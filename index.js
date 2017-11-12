'use strict';
const gutil = require('gulp-util')
    , fs = require('fs')
    , path = require('path')
    , through = require('through2')
    , dom = require('xmldom')
    , PluginError = gutil.PluginError
    , PLUGIN_NAME = 'gulp-template-extend'
    , parser = new dom.DOMParser();

const cleanPattern = /(<(section-|include-file|extend-to)([^>]+)>|(<\/(section-[\w\-]+|include-file|extend-to)>))/ig;

module.exports = () => {

    function readFile(fpath) {
        return fs.readFileSync(fpath).toString();
    }

    function isFile(fpath) {
        try {
            let stat = fs.lstatSync(fpath);
            return stat.isFile();
        } catch(e) {
            return false;
        }
    }

    function doExtend(parsedContent, extendElement, fpath) {
        let sectionAttr = extendElement.getAttribute('section'),
            sectionElement = parsedContent.getElementsByTagName(`section-${sectionAttr}`),
            basedir = path.dirname(path.resolve(fpath)),
            templateFilePath, templateDoc, sectionTemplate;
        
        templateFilePath = path.join(basedir, extendElement.getAttribute('src'));
        
        if (!isFile(templateFilePath)) {
            gutil.log(gutil.colors.red(`Template file ${path.basename(templateFilePath)} not found`), 'on', gutil.colors.bold(path.basename(fpath)));
            return false;
        }

        templateDoc = parser.parseFromString(readFile(templateFilePath), 'text/html');
        sectionTemplate = templateDoc.getElementsByTagName(`section-${sectionAttr}`);
        
        if (!sectionElement.length || !sectionTemplate.length) return templateDoc;

        sectionTemplate[0].appendChild(sectionElement[0]);

        return templateDoc;
    }

    return through.obj((file, enc, cb) => {
        if (file.isNull()) {
            // nothing to do
            return cb(null, file);
        }

        if (file.isStream()) {
            // file.contents is a Stream - https://nodejs.org/api/stream.html
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
        }

        // Empty file
        if (!file.contents.toString().length) {
            return cb(null, file);
        }

        let parsedContent = parser.parseFromString(file.contents.toString(), 'text/html');
        
        if (!parsedContent) {
            return cb(null, file)
        }

        let basedir, templateDoc, extendElements;

        extendElements = parsedContent.getElementsByTagName('extend-to')
        basedir = path.dirname(path.resolve(file.path));

        // If have extend element
        if (extendElements.length) {
            if (extendElements[0].hasAttribute('src') || extendElements[0].hasAttribute('section')) {
                templateDoc = doExtend(parsedContent, extendElements[0], file.path);
            } else {
                templateDoc = parsedContent;
            }
        }  else {
            templateDoc = parsedContent;
        }

        if (templateDoc) {
            let includeElements = templateDoc.getElementsByTagName('include-file');

            for(let i=0,length=includeElements.length;i<length;i++) {
                let includeElement = includeElements[i],
                    src = includeElement.getAttribute('src'),
                    includeFilePath = path.resolve(basedir, src),
                    includeFileDoc;

                if (!src.length) continue;
                if (!isFile(includeFilePath)) {
                    gutil.log(gutil.colors.red(`File ${path.basename(includeFilePath)} not found`), 'on', gutil.colors.bold(path.basename(file.path)));
                    continue;
                }

                includeFileDoc = parser.parseFromString(readFile(includeFilePath), 'text/html');
                includeElement.appendChild(includeFileDoc);
            }
        }

        let content =  (!templateDoc) ? file.contents.toString() : new dom.XMLSerializer().serializeToString(templateDoc);
        content = content.replace(cleanPattern,'');
        file.contents = new Buffer(content); 
        
        return cb(null, file);
    });
};

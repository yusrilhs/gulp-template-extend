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

    let translatedTemplates = {};

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
        
        if (sectionElement.length && sectionTemplate.length) {
            sectionTemplate[0].appendChild(sectionElement[0]);
        }

        return {
            doc: templateDoc,
            path: templateFilePath
        };
    }

    function translateIncludeFile(basedir, parsedContent) {
        let includeFileElements = parsedContent.getElementsByTagName('include-file');

        for(let i=0,length=includeFileElements.length;i<length;i++) {
            let includeFileElement = includeFileElements[i],
                includeFile, includeFilePath;

            if (!includeFileElement.hasAttribute('src')) continue;
            includeFilePath = path.resolve(basedir, includeFileElement.getAttribute('src'));
            
            if (isFile(includeFilePath)) {
                let fileToInclude = readFile(includeFilePath),
                    fileIncludeDoc = parser.parseFromString(fileToInclude);

                // Make sure this is a html source
                if (fileIncludeDoc) {
                    includeFileElement.appendChild(fileIncludeDoc);
                }
            }
        }

        return parsedContent;
    }

    function appendSectionToTemplate(sectionElement, templateFilePath, sectionSelector) {
        let templateDoc;

        if (!translatedTemplates[templateFilePath]) {
            templateDoc = parser.parseFromString(readFile(templateFilePath));
            translatedTemplates[templateFilePath] = templateDoc;
        } else {
            return true;
        }

        // Make sure templateDoc is parsed as html
        if (templateDoc) {
            templateDoc = translateIncludeFile(path.dirname(templateFilePath), templateDoc);
            
            let sectionTarget = templateDoc.getElementsByTagName(sectionSelector);
            
            if (sectionTarget.length) {
                sectionTarget[0].appendChild(sectionElement);
                return templateDoc;
            }
        }

        return false;
    }

    function translateExtendElement(parsedContent, filePath) {
        let basedir = path.dirname(filePath),
            extendElements = parsedContent.getElementsByTagName('extend-to');
        
        translatedTemplates = [];

        // Support for multiple section
        for(let i=0,length=extendElements.length;i<length;i++) {
            let extendElement = extendElements[i], sectionTarget, 
                templateFilePath, sectionElement;
            
            // Check for src and section attribute
            if (extendElement.hasAttribute('src') && extendElement.hasAttribute('section')) {
                sectionTarget = 'section-' + extendElement.getAttribute('section');
                templateFilePath = path.resolve(basedir, extendElement.getAttribute('src'));
                sectionElement = parsedContent.getElementsByTagName(sectionTarget);

                if (sectionElement.length && isFile(templateFilePath)) {
                    let doc = appendSectionToTemplate(sectionElement[0], templateFilePath, sectionTarget);
                    if (doc !== false) {
                        extendElement.childNodes = new Array();
                        extendElement.appendChild(doc);
                    } 

                    // Already translated template
                    if (doc === true) {
                        sectionTarget = parsedContent.getElementsByTagName(sectionTarget);
                        for (let j=0,len=sectionTarget.length;j<len;j++) {
                            if (sectionTarget[j] != sectionElement[0]) {
                                let appendableElement, childElement;
                                
                                if (sectionTarget[j].childNodes.length > 0)  {
                                    appendableElement = sectionElement[0];
                                    childElement = sectionTarget[j];
                                } else {
                                    appendableElement = sectionTarget[j];
                                    childElement = sectionElement[0];
                                }

                                appendableElement.appendChild(childElement);
                                extendElement.childNodes = new Array();

                                // I don't know why this give me a little
                                // bit confusing with return `??`
                                parsedContent.removeChild(extendElement);
                                break;
                            }
                        }
                    }
                }
            }
        }

        return parsedContent;
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
        
        // Non html
        if (!parsedContent) {
            return cb(null, file)
        }

        let templateDoc, xmlSerializeString;

        templateDoc = translateIncludeFile(path.dirname(file.path), parsedContent);
        templateDoc = translateExtendElement(templateDoc, file.path);

        xmlSerializeString = new dom.XMLSerializer().serializeToString(templateDoc);
        
        file.contents = new Buffer(xmlSerializeString.trim().replace(cleanPattern, ''));
        
        return cb(null, file);
    });
};

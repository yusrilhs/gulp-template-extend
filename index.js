'use strict';
const colors = require('ansi-colors')
    , log = require('fancy-log')
    , PluginError = require('plugin-error')
    , fs = require('fs')
    , path = require('path')
    , through = require('through2')
    , cheerio = require('cheerio')
    , PLUGIN_NAME = 'gulp-template-extend';

const CHEERIO_OPTIONS = {
  xmlMode: true,
  decodeEntities: false,
  recognizeSelfClosing: false
};

module.exports = () => {
  function readFile(fpath) {
    return fs.readFileSync(fpath).toString().trim();
  }

  function isFile(fpath) {
    let notFoundErrorMessage = colors.red(`${path.relative(process.cwd(), fpath)} is not a file`);

    try {
      let stat = fs.lstatSync(fpath),
        isFile = stat.isFile();

      if (!isFile) {
        this.emit('error', new PluginError(
          PLUGIN_NAME, notFoundErrorMessage
        ));
      }

      return isFile;
    } catch(e) {
      if (process.env.NODE_ENV != 'test_gulp_template_extend') {
        log(notFoundErrorMessage);
      }
      return false;
    }
  }

  function basedir(fpath) {
    return path.dirname(fpath);
  }

  function translateExtendFile($, basepath) {
    let $elE, $elT, extendElement, sectionTag,
      templateFilePath, templateFileContent, $$;

    extendElement = $('extend-to').first();

    if (!extendElement.length) return $;

    templateFilePath = path.resolve(basepath, extendElement.attr('src') || '');

    if (!isFile(templateFilePath)) return $;

    templateFileContent = readFile(templateFilePath);
    $$ = cheerio.load(templateFileContent, CHEERIO_OPTIONS);

    $('template-section').each((i, el) => {
      $elE = $(el);
      sectionTag = $elE.attr('name');

      if (!sectionTag) return;

      sectionTag = 'section-' + sectionTag;
      $elT = $$(sectionTag).first();

      if (!$elT.length) return;

      $elT.replaceWith($elE.html().trim());
    });

    $$ = translateIncludeFile($$, basedir(templateFilePath));

    return $$;
  }

  function translateIncludeFile($, basepath) {
    let $el, includeFilePath, includeFileContent, includeDom;

    $('include-file').each((i, el) => {
      $el = $(el);

      includeFilePath = path.resolve(basepath, $el.attr('src'));

      if (!isFile(includeFilePath)) return $;

      includeFileContent = readFile(includeFilePath);
      includeDom = $(includeFileContent);
      $el.replaceWith(includeDom);
    });

    return $;
  }

  return through.obj((file, enc, cb) => {
    let content;

    if (file.isNull()) {
      // nothing to do
      return cb(null, file);
    }

    if (file.isStream()) {
      // file.contents is a Stream - https://nodejs.org/api/stream.html
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
    }

    content = file.contents.toString();

    // Empty file
    if (!content.length) {
      return cb(null, file);
    }

    let contentDom = cheerio.load(content, CHEERIO_OPTIONS),
      basepath = basedir(file.path);

     contentDom = translateIncludeFile(contentDom, basepath);
     contentDom = translateExtendFile(contentDom, basepath);

     if (contentDom) {
    file.contents = new Buffer(contentDom.html().trim());
     }

    return cb(null, file);
  });
};

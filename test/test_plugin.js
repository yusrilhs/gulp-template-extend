'use strict';
const should = require('chai').should()
    , fs = require('fs')
    , File = require('vinyl')
    , templateExtend = require('../');

function readFile(fpath) {
  return fs.readFileSync(fpath);
}

function cleanTag(content) {
  return content.replace(/(<(section-|include-file|extend-to)([^>]+)>|(<\/(section-\w+|include-file|extend-to)>))/ig, '');
}

function createVinylFile(fpath) {
  return new File({
    path: fpath,
    contents: readFile(fpath)
  });
}

describe('Test gulp-template-extend plugin', () => {
  beforeEach(() => {
    this.plugin = templateExtend();
  });

  it('Should be no error if blank file', (done) => { 
    let blankFile = new File({
        path: 'any/file.html',
        contents: new Buffer('')
    });

    this.plugin.write(blankFile);

    this.plugin.once('data', (file) => {
        file.contents.should.to.equal(blankFile.contents);
        done();
    });
  });

  it('Should return the original file when all file is not exists', (done) => {
    let fileBuffer = new Buffer([
'<extend-to src="this/unavailable.html" />',
'<section-not-exists>',
'<include-file src="another/uniavailable/file.html" />',
'my file is not exists',
'</section-not-exists>'].join('\n'));

    let file = new File({
      path: './unexists/test_unexists.html',
      contents: fileBuffer
    });

    this.plugin.write(file);

    this.plugin.once('data', (f) => {
      f.contents.toString().should.equal(file.contents.toString());
      done();
    });
  });

  it('Should return only template file when template-section is not exists', (done) => {
    let fileBuffer = new Buffer([
'<extend-to src="test_template.html">',
'<template-section name="notExists">',
'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellat, rem!',
'</template-section>'].join('\n'));

    let file = new File({
        path: './test/fixtures/layouts/test_no_section.html',
        contents: fileBuffer
    });

    this.plugin.write(file);

    this.plugin.once('data', (f) => {
        file.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'    <title/>',
'</head>',
'<body>',
'<section-content/>',
'</body>',
'</html>'
].join('\n'));
        done();
    });
  });

  it('Should extend file with template', (done) => {
    let extendFile = createVinylFile('./test/fixtures/pages/test_extend.html');

    this.plugin.write(extendFile);

    this.plugin.once('data', (file) => {
      file.contents.toString().should.not.include.all.string('section-content', 'template-section', 'include-file', 'extend-to');
      file.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'    <title/>',
'</head>',
'<body>',
'<style type="text/css">',
'        .hell {',
'            content: \'yeah\';',
'        }',
'    </style>',
'    <h1>This is my file content</h1>',
'    &rsaquo;',
'</body>',
'</html>'
].join('\n'));
      done();
    });
  });

  it('should include file', (done) => {
    let includeFile = createVinylFile('./test/fixtures/pages/test_include.html');

    this.plugin.write(includeFile);

    this.plugin.once('data', (file) => {
      file.contents.toString().should.not.include.all.string('section-content', 'template-section', 'include-file', 'extend-to');

      file.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'    <title/>',
'</head>',
'<body>',
'    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore, blanditiis!</p>',
'    <p>Lorem ipsum dolor sit amet.</p>',
'</body>',
'</html>',
].join('\n'));
      done();
    });
  });

  it('should extend and include file', (done) => {
    let testFile = createVinylFile('./test/fixtures/pages/test_extend_and_include.html');

    this.plugin.write(testFile);

    this.plugin.once('data', (file) => {
      file.contents.toString().should.not.include.all.string('section-content', 'template-section', 'include-file', 'extend-to');
      file.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'    <title>Lorem ipsum dolor.</title>',
'</head>',
'<body>',
'<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore, blanditiis!</p>',
'<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore, blanditiis!</p>',
'',
'<p>Lorem ipsum dolor sit amet.</p>',
'',
'<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quis, aspernatur!</p>',
'</body>',
'</html>'
].join('\n'));
      done();
    });
  });

  it('should become a good documentation :)', (done) => {
    let pageFile = createVinylFile('./test/fixtures/docs/my_page.html');

    this.plugin.write(pageFile);

    this.plugin.once('data', (f) => {
        f.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'    <title>This is page title.</title>',
'</head>',
'<body>',
'<header>Welcome to my page</header>',
'<h1>This is my file content.</h1>',
'</body>',
'</html>'
].join('\n'));
        done();
    });
  });

});

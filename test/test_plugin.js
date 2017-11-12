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

  it('Should extend file with template', (done) => {
    let extendFile = createVinylFile('./test/fixtures/pages/test_extend.html');

    this.plugin.write(extendFile);

    this.plugin.once('data', (file) => {
      file.contents.toString().should.not.include.all.string('section-content', 'extend-to', 'include-file');
      file.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'    <title></title>',
'</head>',
'<body>',
'',
'    <style type="text/css">',
'        .hell {',
'            content: \'yeah\';',
'        }',
'    </style>',
'    <h1>This is my file content</h1>',
'',
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
      file.contents.toString().should.not.include.all.string('section-content', 'extend-to', 'include-file');

      file.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en" xmlns="http://www.w3.org/1999/xhtml">',
'<head>',
'    <title></title>',
'</head>',
'<body>',
'    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Saepe, laboriosam?</p>',
'    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam voluptate ea incidunt beatae, eos facilis, atque dicta optio quia, excepturi facere illo sunt unde voluptatibus nisi consectetur quod eaque. Sunt ullam, cumque blanditiis eos, rerum sed. Omnis reiciendis dolores amet animi velit doloribus cum deserunt ab harum aspernatur sapiente ea, culpa quaerat, exercitationem iusto laudantium aliquid! Praesentium at rem magni velit obcaecati eligendi expedita fuga autem error tempore accusamus blanditiis quibusdam corporis, earum id quisquam laudantium iste! Temporibus minus consequuntur culpa nam neque assumenda vero nihil qui eos, nostrum quis impedit corporis ratione, molestiae perspiciatis dignissimos. Ex quis qui distinctio iste libero ea commodi, voluptas autem voluptate. Veniam voluptas impedit quidem esse maxime, reiciendis quibusdam consequuntur, nihil ullam cumque error! Repellendus vitae error, labore cumque. Nemo, impedit. Aspernatur et magnam consequatur, molestiae, asperiores impedit facilis mollitia exercitationem doloribus incidunt beatae culpa in quas recusandae aperiam temporibus? Accusamus illum, ea illo nemo voluptatibus ipsum unde asperiores adipisci obcaecati et, odit odio. Eos sed accusamus eligendi at, error voluptates reiciendis. Ab aliquam quae numquam voluptatum tenetur error nihil, fugit ad dolorem non rerum perferendis, minus dolore. Dolorem illum culpa aliquid veniam pariatur laboriosam, explicabo doloribus aspernatur distinctio earum praesentium nemo sunt numquam sequi optio voluptate excepturi aut quos non quae, ipsa obcaecati iusto, qui. Quod cumque omnis, itaque quia ipsum illum enim, vitae dignissimos praesentium ad quidem, corporis laborum error adipisci? Illum animi temporibus facilis, blanditiis, fuga nemo repellat culpa, veniam molestiae placeat voluptatibus. Vero nulla nam corrupti qui natus saepe unde, laboriosam magni! Earum, quibusdam, id doloribus iste numquam consequuntur eius perferendis amet error laborum consectetur excepturi ea animi, odit obcaecati eum. Tempore aspernatur dolores, quos neque voluptates, excepturi voluptatibus architecto, necessitatibus officia nesciunt molestias fugit voluptate nulla? Ratione, aut, libero. Cupiditate velit commodi voluptatem ut corrupti similique unde nisi totam.</p>',
'</body>',
'</html>'
].join('\n'));
      done();
    });
  });

  it('should extend and include file', (done) => {
    let testFile = createVinylFile('./test/fixtures/pages/test_extend_and_include.html');

    this.plugin.write(testFile);

    this.plugin.once('data', (file) => {
      file.contents.toString().should.not.include.all.string('section-content', 'extend-to', 'include-file');
      file.contents.toString().should.equal([
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'    <title></title>',
'</head>',
'<body>',
'<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Saepe, laboriosam?</p>',
'',
'<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Saepe, laboriosam?</p>',
'',
'<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam voluptate ea incidunt beatae, eos facilis, atque dicta optio quia, excepturi facere illo sunt unde voluptatibus nisi consectetur quod eaque. Sunt ullam, cumque blanditiis eos, rerum sed. Omnis reiciendis dolores amet animi velit doloribus cum deserunt ab harum aspernatur sapiente ea, culpa quaerat, exercitationem iusto laudantium aliquid! Praesentium at rem magni velit obcaecati eligendi expedita fuga autem error tempore accusamus blanditiis quibusdam corporis, earum id quisquam laudantium iste! Temporibus minus consequuntur culpa nam neque assumenda vero nihil qui eos, nostrum quis impedit corporis ratione, molestiae perspiciatis dignissimos. Ex quis qui distinctio iste libero ea commodi, voluptas autem voluptate. Veniam voluptas impedit quidem esse maxime, reiciendis quibusdam consequuntur, nihil ullam cumque error! Repellendus vitae error, labore cumque. Nemo, impedit. Aspernatur et magnam consequatur, molestiae, asperiores impedit facilis mollitia exercitationem doloribus incidunt beatae culpa in quas recusandae aperiam temporibus? Accusamus illum, ea illo nemo voluptatibus ipsum unde asperiores adipisci obcaecati et, odit odio. Eos sed accusamus eligendi at, error voluptates reiciendis. Ab aliquam quae numquam voluptatum tenetur error nihil, fugit ad dolorem non rerum perferendis, minus dolore. Dolorem illum culpa aliquid veniam pariatur laboriosam, explicabo doloribus aspernatur distinctio earum praesentium nemo sunt numquam sequi optio voluptate excepturi aut quos non quae, ipsa obcaecati iusto, qui. Quod cumque omnis, itaque quia ipsum illum enim, vitae dignissimos praesentium ad quidem, corporis laborum error adipisci? Illum animi temporibus facilis, blanditiis, fuga nemo repellat culpa, veniam molestiae placeat voluptatibus. Vero nulla nam corrupti qui natus saepe unde, laboriosam magni! Earum, quibusdam, id doloribus iste numquam consequuntur eius perferendis amet error laborum consectetur excepturi ea animi, odit obcaecati eum. Tempore aspernatur dolores, quos neque voluptates, excepturi voluptatibus architecto, necessitatibus officia nesciunt molestias fugit voluptate nulla? Ratione, aut, libero. Cupiditate velit commodi voluptatem ut corrupti similique unde nisi totam.</p>',
'',
'<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quis, aspernatur!</p>',
'',
'</body>',
'</html>'
].join('\n'));
      done();
    });
  });

  it('Should have result without extend-to, include-file and section-* tag while file to include, extend or section is not exists', (done) => {
    let fileBuffer = new Buffer([
'<extend-to section="my-section" src="this/unavailable.html" />',
'<section-not-exists>',
'<include-file src="another/uniavailable/file.html" />',
'my file is not exists',
'</section-not-exists>'].join('\n'));

    let file = new File({
      path: './unexists/test_unexists.html',
      contents: fileBuffer
    });

    this.plugin.write(file);

    this.plugin.once('data', () => {
      file.contents.toString().should.not.include.all.string('section-content', 'extend-to', 'include-file');
      file.contents.toString().should.equal([
'',
'',
'',
'my file is not exists',
''
].join('\n'));
      done();
    });
  });
});

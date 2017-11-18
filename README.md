# gulp-template-extend
[![Build Status](https://travis-ci.org/yusrilhs/gulp-template-extend.svg?branch=master)](https://travis-ci.org/yusrilhs/gulp-template-extend)
[![GitHub license](https://img.shields.io/github/license/yusrilhs/gulp-template-extend.svg)](https://github.com/yusrilhs/gulp-template-extend/blob/master/LICENSE)

Easiest way to extend or include html file using gulp.

## Install 
* Using npm : `npm install gulp-template-extend --save-dev`
* Using yarn : `yarn add gulp-template-extend --dev`

## Example
##### my_page.html
```html
<extend-to src="my_template.html" />
<template-section name="title">
    This is page title.
</template-section>
<template-section name="content">
    <h1>This is my file content.</h1>
</template-section>
```
##### my_template.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title><section-title /></title>
</head>
<body>
<include-file src="header.html" />
<section-content />
</body>
</html>
```

##### header.html
```html
<header>Welcome to my page</header>
```

##### gulpfile.js
```js
const gulp = require('gulp')
    , templateExtend = require('gulp-template-extend');
    
gulp.task('build-page', () => {
    gulp.src('my_page.html')
        .pipe(templateExtend())
        .pipe(gulp.dest('pages'));
});
```

##### Result will be:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>This is page title.</title>
</head>
<body>
<header>Welcome to my page</header>
<h1>This is my file content.</h1>
</body>
</html>
```

'use strict';
const path = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');
const imagemin = require('imagemin');

const {_: [srcDir, destDir]} = require('minimist')(process.argv.slice(2));

const run = () => {
  const renderFiles = glob.sync(path.join(srcDir, '**/*'), {nodir: true});

  return Promise.all(renderFiles.map(file => {
    const filePath = path.relative(srcDir, file);
    const dir = path.join(destDir, path.dirname(filePath));
    mkdirp.sync(dir);
    return imagemin([file], dir);
  }))
  .then(() => console.log('rendered images'));
};

run();

'use strict';
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');
const pug = require('pug');
const chokidar = require('chokidar');
const debounce = require('lodash.debounce');

const {_: [srcDir, destDir], watch} = require('minimist')(process.argv.slice(2));

const metaDataPath = 'src/metadata.json';
const serveDir = process.env.npm_package_config_serveDir;
const root = {
  pc: path.join('/', serveDir, '/'),
  sp: path.join('/', serveDir, '/sp/')
};

const render = () => {
  const renderFiles = glob.sync(path.join(srcDir, '**/*.pug'), {
    ignore: path.join(srcDir, 'partial/**')
  });
  const metaData = JSON.parse(fs.readFileSync(metaDataPath, 'utf8'));

  renderFiles.forEach(file => {
    const filePath = path.relative(srcDir, file).replace(/\.pug$/, '.html');
    const destPath = path.join(destDir, filePath);
    const pagePath = filePath.replace(/\/?index\.html$/, '');
    const options = Object.assign({}, metaData, {
      pretty: true,
      root,
      currentPath: pagePath
    });
    const html = pug.renderFile(file, options);
    mkdirp.sync(path.dirname(destPath));
    fs.writeFileSync(destPath, html);
  });

  console.log('rendered html');
}

if (watch) {
  const deboucnedRender = debounce(render, 300);

  chokidar.watch([srcDir, metaDataPath])
  .on('add', deboucnedRender)
  .on('change', deboucnedRender);
} else {
  render();
}

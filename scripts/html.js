'use strict';
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const pug = require('pug');
const chokidar = require('chokidar');

const serveDir = process.env.npm_package_config_serve_dir;
const argv = require('minimist')(process.argv.slice(2));
const uniq = array => Array.from(new Set(array));

[{
  src: 'pc',
  dest: '.'
}, {
  src: 'sp',
  dest: 'sp'
}].forEach(env => {
  const envSrcDir = path.join('src', env.src, 'html');
  const envDestDir = path.join('dist', serveDir, env.dest);
  const render = () => {
    const srcFiles = glob.sync(`${envSrcDir}/**/*.pug`);
    const destDirs = uniq(
      srcFiles.map(file => path.dirname(file).replace(envSrcDir, envDestDir))
    );
    destDirs.forEach(dir => mkdirp.sync(dir));
    srcFiles.forEach(srcFile => {
      const destFileName = srcFile
      .replace(envSrcDir, envDestDir)
      .replace(/\.pug$/, '.html');
      const html = pug.renderFile(srcFile, {
        pretty: argv.pretty
      });
      fs.writeFileSync(destFileName, html);
    });
  };

  if (!argv.watch) {
    render();
  } else {
    chokidar.watch(envSrcDir)
    .on('add', render)
    .on('change', render);
  }
});

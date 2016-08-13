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
  const srcDir = path.join('src', env.src, 'html');
  const destDir = path.join('dist', serveDir, env.dest);
  const render = () => {
    const files = glob.sync(`${srcDir}/**/*.pug`);
    const directories = uniq(
      files.map(file => path.dirname(file).replace(srcDir, destDir))
    );
    directories.forEach(dir => mkdirp.sync(dir));
    files.forEach(file => {
      const filename = file.replace(srcDir, destDir).replace(/\.pug$/, '.html');
      const html = pug.renderFile(file, {
        pretty: argv.pretty
      });
      fs.writeFileSync(filename, html);
    });
  };

  if (!argv.watch) {
    render();
  } else {
    chokidar.watch(srcDir)
    .on('add', render)
    .on('change', render);
  }
});

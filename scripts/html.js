'use strict';
const values = require('object.values');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const debounce = require('lodash.debounce');
const pug = require('pug');
const chokidar = require('chokidar');

const uniq = array => Array.from(new Set(array));

const serveDir = process.env.npm_package_config_serve_dir;
const argv = require('minimist')(process.argv.slice(2));
const envs = {
  pc: {
    src: 'pc',
    dest: '.'
  },
  sp: {
    src: 'sp',
    dest: 'sp'
  }
};

values(envs).forEach(env => {
  const envSrcDir = path.join('src', env.src, 'html');
  const envDestDir = path.join('dist', serveDir, env.dest);
  const render = debounce(() => {
    const srcFiles = glob.sync(`${envSrcDir}/**/*.pug`, {
      ignore: `${envSrcDir}/partial/**`
    });
    const destDirs = uniq(
      srcFiles.map(file => path.dirname(file).replace(envSrcDir, envDestDir))
    );
    const metadata = require('../src/metadata.json');
    destDirs.forEach(dir => mkdirp.sync(dir));
    srcFiles.forEach(srcFile => {
      const destFileName = srcFile
      .replace(envSrcDir, envDestDir)
      .replace(/\.pug$/, '.html');
      const pagePath = srcFile
      .replace(`${envSrcDir}/`, '')
      .replace(/\.pug$/, '.html')
      .replace(/\/?index\.html$/, '');
      const options = Object.assign({}, metadata, {
        pretty: true,
        root: {
          pc: `/${path.join(serveDir, envs.pc.dest)}/`,
          sp: `/${path.join(serveDir, envs.sp.dest)}/`
        },
        currentPath: pagePath
      });
      const html = pug.renderFile(srcFile, options);
      fs.writeFileSync(destFileName, html);
    });
    console.log('rendered html');
  }, 300);

  if (!argv.watch) {
    render();
  } else {
    chokidar.watch([envSrcDir, 'src/metadata.json'])
    .on('add', render)
    .on('change', render);
  }
});

module.exports = {
  files: 'dist',
  server: {
    baseDir: 'dist',
    middleware: require('browsersync-ssi')({
      baseDir: require('path').resolve('dist'),
      ext: '.html'
    })
  },
  startPath: `/${process.env.npm_package_config_serveDir}/`,
  ghostMode: false,
  logFileChanges: false,
  open: false,
  reloadDebounce: 300
};

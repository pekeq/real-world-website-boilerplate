const path = require('path')
const fs = require('fs')
const browserSync = require('browser-sync').create()
const gulp = require('gulp')
const plugins = require('gulp-load-plugins')()
const config = require('./package.json').projectConfig

const isRelease = process.argv.includes('--release')
const destDir = isRelease ? 'dist' : '.tmp'
const destBaseDir = path.join(destDir, config.baseDir)

const html = () =>
  gulp.src([
    'src/html/**/*.pug',
    '!src/html/partial/**/*',
  ])
    .pipe(plugins.plumber())
    .pipe(plugins.data(file => {
      const metaData = JSON.parse(fs.readFileSync('src/html/metadata.json', 'utf8'))
      const pageDataPath = file.path.replace(/\.pug$/, '.json')
      const pageData = fs.existsSync(pageDataPath) ? JSON.parse(fs.readFileSync(pageDataPath)) : null
      const pagePathFromBaseDir = '/' + path.relative('src/html', file.path)
        .replace(/\.pug$/, '.html')
        .replace(/\/?index\.html$/, '')
      const buildPagePath = pagePath => path.join('/', config.baseDir, pagePath)

      return {
        ...metaData,
        ...pageData,
        currentPath: pagePathFromBaseDir,
        urlFor: buildPagePath,
      }
    }))
    .pipe(plugins.pug())
    .pipe(gulp.dest(destBaseDir))
    .pipe(browserSync.stream())

const css = () => {
  const AUTOPREXIER_BROWSERS = [
    'last 1 version',
    '> 5% in JP',
  ]

  return gulp.src('src/css/index.scss')
    .pipe(plugins.if(!isRelease, plugins.sourcemaps.init()))
    .pipe(plugins.rename({basename: 'app'}))
    .pipe(plugins.sass().on('error', plugins.sass.logError))
    .pipe(plugins.postcss([
      require('autoprefixer')({
        browsers: AUTOPREXIER_BROWSERS,
        cascade: false,
      }),
      ...(isRelease ? [
        require('csswring')(),
      ] : [])
    ]))
    .pipe(plugins.if(!isRelease, plugins.sourcemaps.write('.')))
    .pipe(gulp.dest(path.join(destBaseDir, 'css')))
    .pipe(browserSync.stream({match: '**/*.css'}))
}

const webpack = require('webpack')
const webpackConfig = require('./webpack.config.js')
const compiler = webpack(webpackConfig)

const js = done =>
  compiler.run((err, stats) => {
    if (err) throw new plugins.util.PluginError('webpack', err)
    plugins.util.log('[webpack]', stats.toString({
      colors: true,
    }))

    browserSync.reload()
    done()
  })

const img = () =>
  gulp.src('src/img/**/*')
    .pipe(plugins.changed(path.join(destBaseDir, 'img')))
    .pipe(plugins.if(isRelease, plugins.imagemin()))
    .pipe(plugins.if(isRelease, gulp.dest(path.join(destBaseDir, 'img'))))
    .pipe(browserSync.stream())

const copy = () =>
  gulp.src('src/static/**/*')
    .pipe(plugins.changed(destBaseDir))
    .pipe(plugins.if(isRelease, gulp.dest(destBaseDir)))
    .pipe(browserSync.stream())

const clean = () => {
  const del = require('del')
  return del(destDir)
}

const serve = done => {
  browserSync.init({
    notify: false,
    ui: false,
    server: {
      baseDir: [
        destDir,
        'vendor-assets',
      ],
      routes: isRelease ? {} : {
        [`${path.join('/', config.baseDir)}`]: 'src/static',
        [`${path.join('/', config.baseDir, 'img')}`]: 'src/img',
      },
    },
    startPath: path.join('/', config.baseDir, '/'),
    ghostMode: false,
    open: false,
    reloadDebounce: 300,
  }, done)
}

const watch = done => {
  gulp.watch('src/html/**/*', html)
  gulp.watch('src/css/**/*.scss', css)
  gulp.watch('src/js/**/*.js', js)
  gulp.watch('src/img/**/*', img)
  gulp.watch('src/static/**/*', copy)

  done()
}

export default gulp.series(
  clean,
  gulp.parallel(html, css, js, img, copy),
  serve,
  watch,
)

export const build = gulp.series(
  clean,
  gulp.parallel(html, css, js, img, copy),
)

export const archive = done => {
  const cp = require('child_process')
  const mkdirp = require('mkdirp')
  const archiver = require('archiver')
  const minimist = require('minimist')

  const git = (...args) => cp.execFileSync('git', [...args])
  const {commit} = minimist(process.argv.slice(2))
  const oldCommit = Array.isArray(commit) ? commit[0] : commit
  const newCommit = Array.isArray(commit) ? commit[1] : 'HEAD'
  const archiveName = path.resolve('archive', `htdocs.zip`)
  const zip = archiver('zip')
  const prefix = path.join('dist', config.baseDir, '/')
  const changedFiles = String(git('diff', '--diff-filter=AMCR', '--name-only', oldCommit, newCommit))
    .slice(0, -1)
    .split('\n')
    .filter(file => file.startsWith(prefix))
  const output = fs.createWriteStream(archiveName)

  mkdirp.sync('archive')

  zip.on('error', err => {
    done()
    throw err
  })

  output.on('close', () => {
    console.log(`${zip.pointer()} total bytes`)
    console.log('archiver has been finalized and the output file descriptor has closed.')
    done()
  })

  zip.pipe(output)

  changedFiles.forEach(file => {
    const filePath = path.resolve(file)
    zip.append(fs.createReadStream(filePath), {
      name: file.slice(prefix.length),
      mode: fs.statSync(filePath).mode,
    })
  })

  zip.finalize()
}

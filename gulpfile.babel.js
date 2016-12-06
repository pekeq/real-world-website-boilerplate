const path = require('path')
const fs = require('fs')
const del = require('del')
const browserSync = require('browser-sync').create()
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const gulp = require('gulp')
const gutil = require('gulp-util')
const gulpif = require('gulp-if')
const plumber = require('gulp-plumber')
const sourcemaps = require('gulp-sourcemaps')
const data = require('gulp-data')
const pug = require('gulp-pug')
const htmlmin = require('gulp-htmlmin')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const cssnano = require('gulp-cssnano')
const browserify = require('browserify')
const watchify = require('watchify')
const uglify = require('gulp-uglify')
const concat = require('gulp-concat')
const imagemin = require('gulp-imagemin')
const changed = require('gulp-changed')
const config = require('./config.json')

const isRelease = process.argv.includes('--release')
const destDir = isRelease ? 'dist' : '.tmp'
const destBaseDir = path.join(destDir, config.baseDir)

const html = () =>
  gulp.src([
    'src/html/**/*.pug',
    '!src/html/partial/**/*',
  ])
    .pipe(plumber())
    .pipe(data(file => {
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
    .pipe(pug())
    .pipe(gulpif(isRelease, htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true,
    })))
    .pipe(gulp.dest(destBaseDir))
    .pipe(browserSync.stream())

const css = () =>
  gulp.src('src/css/main.scss')
    .pipe(gulpif(!isRelease, sourcemaps.init({loadMaps: true})))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer(config.autoprefixerBrowsers))
    .pipe(gulpif(!isRelease, sourcemaps.write('.')))
    .pipe(gulpif(isRelease, cssnano()))
    .pipe(gulp.dest(path.join(destBaseDir, 'css')))
    .pipe(browserSync.stream({match: '**/*.css'}))

let isWatchifyEnabled = false

const mainJs = () => {
  const bundler = browserify('src/js/main.js', {
    ...watchify.args,
    debug: true,
  })
    .transform('babelify')
    .plugin('licensify')

  const bundle = () => bundler
    .bundle()
    .on('error', err => gutil.log('Browserify Error', err))
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulpif(!isRelease, sourcemaps.init({loadMaps: true})))
    .pipe(gulpif(!isRelease, sourcemaps.write('.')))
    .pipe(gulpif(isRelease, uglify({preserveComments: 'license'})))
    .pipe(gulp.dest(path.join(destBaseDir, 'js')))
    .pipe(browserSync.stream({match: '**/*.js'}))

  if (isWatchifyEnabled) {
    const watcher = watchify(bundler)
    watcher.on('update', bundle)
    watcher.on('log', gutil.log)
  }

  return bundle()
}

const polyfillJs = () =>
  gulp.src(config.polyfillScripts)
    .pipe(concat('polyfill.js'))
    .pipe(gulpif(isRelease, uglify({preserveComments: 'license'})))
    .pipe(gulp.dest(path.join(destBaseDir, 'js')))
    .pipe(browserSync.stream())

const js = gulp.parallel(mainJs, polyfillJs)

const enableWatchJs = done => {
  isWatchifyEnabled = true
  done()
}

const watchJs = gulp.series(enableWatchJs, js)

const img = () =>
  gulp.src('src/img/**/*')
    .pipe(changed(path.join(destBaseDir, 'img')))
    .pipe(gulpif(isRelease, imagemin()))
    .pipe(gulpif(isRelease, gulp.dest(path.join(destBaseDir, 'img'))))
    .pipe(browserSync.stream())

const copy = () =>
  gulp.src('src/static/**/*')
    .pipe(changed(destBaseDir))
    .pipe(gulpif(isRelease, gulp.dest(destBaseDir)))
    .pipe(browserSync.stream())

const clean = () => del(destDir)

const serve = done => {
  browserSync.init({
    notify: false,
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
  })

  done()
}

const watch = done => {
  gulp.watch('src/html/**/*', html)
  gulp.watch('src/css/**/*.scss', css)
  gulp.watch('src/img/**/*', img)
  gulp.watch('src/static/**/*', copy)

  done()
}

export default gulp.series(
  clean,
  gulp.parallel(html, css, watchJs, img, copy),
  serve,
  watch,
)

export const build = gulp.series(
  clean,
  gulp.parallel(html, css, js, img, copy),
)

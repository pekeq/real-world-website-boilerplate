const path = require('path')
const fs = require('fs')
const del = require('del')
const browserSync = require('browser-sync')
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
const csso = require('gulp-csso')
const browserify = require('browserify')
const watchify = require('watchify')
const uglify = require('gulp-uglify')
const imagemin = require('gulp-imagemin')

const baseURL = process.env.npm_package_config_baseURL || ''
const tmpDir = path.join('.tmp', baseURL)
const destDir = path.join('dist', baseURL)

const server = browserSync.create()

const html = () =>
  gulp.src([
    'src/html/**/*.pug',
    '!src/html/partial/**/*'
  ])
    .pipe(plumber())
    .pipe(data(file => {
      const metaData = JSON.parse(fs.readFileSync('src/html/metadata.json', 'utf8'))
      const pageDataPath = file.path.replace(/\.pug$/, '.json')
      const pageData = fs.existsSync(pageDataPath) ? JSON.parse(fs.readFileSync(pageDataPath)) : null
      const pagePathFromBaseDir = '/' + path.relative('src/html', file.path)
        .replace(/\.pug$/, '.html')
        .replace(/\/?index\.html$/, '')
      const buildPagePath = pagePath => path.join('/', baseURL, pagePath)

      return {
        ...metaData,
        ...pageData,
        currentPath: pagePathFromBaseDir,
        urlFor: buildPagePath
      }
    }))
    .pipe(pug())
    .pipe(gulp.dest(tmpDir))
    .pipe(server.stream())
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    }))
    .pipe(gulp.dest(destDir))

const css = () => {
  const AUTOPREFIXER_BROWSERS = [
    'last 1 version',
    '> 5% in JP'
  ]

  return gulp.src('src/css/style.scss')
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(sourcemaps.write('.', {sourceRoot: '.'}))
    .pipe(gulp.dest(tmpDir))
    .pipe(server.stream({match: '**/*.css'}))
    .pipe(gulpif('*.css', csso()))
    .pipe(gulpif('*.css', gulp.dest(destDir)))
}

let isWatchifyEnabled = false

const js = () => {
  const bundler = browserify('src/js/main.js', {
    ...watchify.args,
    debug: true
  })
    .transform('babelify')
    .plugin('licensify')

  const bundle = () => bundler
    .bundle()
    .on('error', err => gutil.log('Browserify Error', err))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(tmpDir))
    .pipe(server.stream({match: '**/*.js'}))
    .pipe(gulpif('*.js', uglify({preserveComments: 'license'})))
    .pipe(gulpif('*.js', gulp.dest(destDir)))

  if (isWatchifyEnabled) {
    const watcher = watchify(bundler)
    watcher.on('update', bundle)
    watcher.on('log', gutil.log)
  }

  return bundle()
}

const enableWatchJs = done => {
  isWatchifyEnabled = true
  done()
}

const watchJs = gulp.series(enableWatchJs, js)

const img = () =>
  gulp.src('src/img/**/*', {since: gulp.lastRun(img)})
    .pipe(gulp.dest(path.join(tmpDir, 'img')))
    .pipe(server.stream())
    .pipe(imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(path.join(destDir, 'img')))

const copy = () =>
  gulp.src('src/assets/**/*', {since: gulp.lastRun(copy)})
    .pipe(gulp.dest(tmpDir))
    .pipe(server.stream())
    .pipe(gulp.dest(destDir))

export const clean = () => del(['.tmp', 'dist'])

const serve = done => {
  server.init({
    notify: false,
    server: [
      '.tmp',
      'vendor-assets'
    ],
    startPath: path.join('/', baseURL, '/'),
    ghostMode: false,
    open: false,
    reloadDebounce: 300
  })

  done()
}

export const serveDist = done => {
  server.init({
    notify: false,
    server: [
      'dist',
      'vendor-assets'
    ],
    startPath: path.join('/', baseURL, '/'),
    ghostMode: false,
    open: false,
    reloadDebounce: 300
  })

  done()
}

const watch = done => {
  gulp.watch('src/html/**/*', html)
    .on('unlink', file => {
      const filePathFromSrc = path.relative('src/html', file)
      const compiledFilePath = filePathFromSrc.replace(/\.pug$/, '.html')
      const tmpFilePath = path.resolve(tmpDir, compiledFilePath)
      const destFilePath = path.resolve(destDir, compiledFilePath)

      del.sync([
        tmpFilePath,
        destFilePath
      ])
    })

  gulp.watch('src/css/**/*.{scss,css}', css)

  gulp.watch('src/img/**/*', img)
    .on('unlink', file => {
      const filePathFromSrc = path.relative('src/img', file)
      const tmpFilePath = path.resolve(tmpDir, filePathFromSrc)
      const destFilePath = path.resolve(destDir, filePathFromSrc)

      del.sync([
        tmpFilePath,
        destFilePath
      ])
    })

  gulp.watch('src/assets/**/*', copy)
    .on('unlink', file => {
      const filePathFromSrc = path.relative('src/assets', file)
      const tmpFilePath = path.resolve(tmpDir, filePathFromSrc)
      const destFilePath = path.resolve(destDir, filePathFromSrc)

      del.sync([
        tmpFilePath,
        destFilePath
      ])
    })

  done()
}

export default gulp.series(
  gulp.parallel(html, css, watchJs, img, copy),
  serve,
  watch
)

export const build = gulp.parallel(html, css, js, img, copy)

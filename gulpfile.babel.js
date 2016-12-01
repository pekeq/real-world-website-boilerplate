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
const cssnano = require('gulp-cssnano')
const browserify = require('browserify')
const watchify = require('watchify')
const uglify = require('gulp-uglify')
const concat = require('gulp-concat')
const imagemin = require('gulp-imagemin')
const changed = require('gulp-changed')

const BASE_DIR = 'path/to/project'

const tmpDir = path.join('.tmp', BASE_DIR)
const destDir = path.join('dist', BASE_DIR)

const server = browserSync.create()

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
      const buildPagePath = pagePath => path.join('/', BASE_DIR, pagePath)

      return {
        ...metaData,
        ...pageData,
        currentPath: pagePathFromBaseDir,
        urlFor: buildPagePath,
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
      removeOptionalTags: true,
    }))
    .pipe(gulp.dest(destDir))

const css = () => {
  const AUTOPREFIXER_BROWSERS = [
    'last 1 version',
    '> 5% in JP',
  ]

  return gulp.src('src/css/main.scss')
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(sourcemaps.write('.', {sourceRoot: '.'}))
    .pipe(gulp.dest(path.join(tmpDir, 'css')))
    .pipe(server.stream({match: '**/*.css'}))
    .pipe(gulpif('*.css', cssnano()))
    .pipe(gulpif('*.css', gulp.dest(path.join(destDir, 'css'))))
}

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
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join(tmpDir, 'js')))
    .pipe(server.stream({match: '**/*.js'}))
    .pipe(gulpif('*.js', uglify({preserveComments: 'license'})))
    .pipe(gulpif('*.js', gulp.dest(path.join(destDir, 'js'))))

  if (isWatchifyEnabled) {
    const watcher = watchify(bundler)
    watcher.on('update', bundle)
    watcher.on('log', gutil.log)
  }

  return bundle()
}

const polyfillJs = () => {
  const polyfills = [
    'node_modules/picturefill/dist/picturefill.js',
  ]

  return gulp.src(polyfills)
    .pipe(concat('polyfill.js'))
    .pipe(gulp.dest(path.join(tmpDir, 'js')))
    .pipe(uglify({preserveComments: 'license'}))
    .pipe(gulp.dest(path.join(destDir, 'js')))
}

const js = gulp.parallel(mainJs, polyfillJs)

const enableWatchJs = done => {
  isWatchifyEnabled = true
  done()
}

const watchJs = gulp.series(enableWatchJs, js)

const img = () =>
  gulp.src('src/img/**/*')
    .pipe(changed(path.join(destDir, 'img')))
    .pipe(imagemin())
    .pipe(gulp.dest(path.join(destDir, 'img')))

const copy = () =>
  gulp.src('src/static/**/*')
    .pipe(changed(destDir))
    .pipe(gulp.dest(destDir))

const clean = () => del(['.tmp', 'dist'])

const serve = done => {
  server.init({
    notify: false,
    server: {
      baseDir: [
        '.tmp',
        'vendor-assets',
      ],
      routes: {
        [`${path.join('/', BASE_DIR)}`]: 'src/static',
        [`${path.join('/', BASE_DIR, 'img')}`]: 'src/img',
      },
    },
    startPath: path.join('/', BASE_DIR, '/'),
    ghostMode: false,
    open: false,
    reloadDebounce: 300,
  })

  done()
}

export const serveDist = done => {
  server.init({
    notify: false,
    server: {
      baseDir: [
        'dist',
        'vendor-assets',
      ],
    },
    startPath: path.join('/', BASE_DIR, '/'),
    ghostMode: false,
    open: false,
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
  watch
)

export const build = gulp.series(
  clean,
  gulp.parallel(html, css, js, img, copy)
)

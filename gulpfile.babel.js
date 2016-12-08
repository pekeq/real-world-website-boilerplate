const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const mkdirp = require('mkdirp')
const del = require('del')
const browserSync = require('browser-sync').create()
const browserify = require('browserify')
const watchify = require('watchify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const gulp = require('gulp')
const plugins = require('gulp-load-plugins')()
const archiver = require('archiver')
const minimist = require('minimist')

const BASE_DIR = 'path/to/project'

const isRelease = process.argv.includes('--release')
const destDir = isRelease ? 'dist' : '.tmp'
const destBaseDir = path.join(destDir, BASE_DIR)

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
      const buildPagePath = pagePath => path.join('/', BASE_DIR, pagePath)

      return {
        ...metaData,
        ...pageData,
        currentPath: pagePathFromBaseDir,
        urlFor: buildPagePath,
      }
    }))
    .pipe(plugins.pug())
    .pipe(plugins.if(isRelease, plugins.htmlmin({
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

const css = () => {
  const AUTOPREXIER_BROWSERS = [
    'last 1 version',
    '> 5% in JP',
  ]

  return gulp.src('src/css/main.scss')
    .pipe(plugins.if(!isRelease, plugins.sourcemaps.init({loadMaps: true})))
    .pipe(plugins.sass().on('error', plugins.sass.logError))
    .pipe(plugins.autoprefixer(AUTOPREXIER_BROWSERS))
    .pipe(plugins.if(!isRelease, plugins.sourcemaps.write('.')))
    .pipe(plugins.if(isRelease, plugins.cssnano()))
    .pipe(gulp.dest(path.join(destBaseDir, 'css')))
    .pipe(browserSync.stream({match: '**/*.css'}))
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
    .on('error', err => plugins.util.log('Browserify Error', err))
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(plugins.if(!isRelease, plugins.sourcemaps.init({loadMaps: true})))
    .pipe(plugins.if(!isRelease, plugins.sourcemaps.write('.')))
    .pipe(plugins.if(isRelease, plugins.uglify({preserveComments: 'license'})))
    .pipe(gulp.dest(path.join(destBaseDir, 'js')))
    .pipe(browserSync.stream({match: '**/*.js'}))

  if (isWatchifyEnabled) {
    const watcher = watchify(bundler)
    watcher.on('update', bundle)
    watcher.on('log', plugins.util.log)
  }

  return bundle()
}

const polyfillJs = () => {
  const POLYFILLS = [
    'node_modules/picturefill/dist/picturefill.js',
  ]

  return gulp.src(POLYFILLS)
    .pipe(plugins.concat('polyfill.js'))
    .pipe(plugins.if(isRelease, plugins.uglify({preserveComments: 'license'})))
    .pipe(gulp.dest(path.join(destBaseDir, 'js')))
    .pipe(browserSync.stream())
}

const js = gulp.parallel(mainJs, polyfillJs)

const enableWatchJs = done => {
  isWatchifyEnabled = true
  done()
}

const watchJs = gulp.series(enableWatchJs, js)

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

const clean = () => del(destDir)

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
        [`${path.join('/', BASE_DIR)}`]: 'src/static',
        [`${path.join('/', BASE_DIR, 'img')}`]: 'src/img',
      },
    },
    startPath: path.join('/', BASE_DIR, '/'),
    ghostMode: false,
    open: false,
    reloadDebounce: 300,
  }, done)
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

export const archive = done => {
  const git = (...args) => childProcess.execFileSync('git', [...args])
  const {commit} = minimist(process.argv.slice(2))
  const oldCommit = Array.isArray(commit) ? commit[0] : commit
  const newCommit = Array.isArray(commit) ? commit[1] : 'HEAD'
  const archiveName = path.resolve('archive', `htdocs.zip`)
  const zip = archiver('zip')
  const prefix = path.join('dist', BASE_DIR, '/')
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

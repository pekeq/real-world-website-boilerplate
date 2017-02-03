const path = require('path')
const webpack = require('webpack')
const config = require('./package.json').projectConfig

const isRelease = process.argv.includes('--release')
const destDir = isRelease ? 'dist' : '.tmp'
const destBaseDir = path.join(destDir, config.baseDir)

module.exports = {
  entry: {
    app: [
      'picturefill',
      './src/js/index.js',
    ],
  },
  output: {
    path: path.join(__dirname, destBaseDir, 'js'),
    publicPath: path.join('/', config.baseDir, '/js/'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [
    ...(isRelease ? [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new webpack.optimize.UglifyJsPlugin({
        beautify: false,
        mangle: {
          screw_ie8: true,
          keep_fnames: true
        },
        compress: {
          screw_ie8: true
        },
        comments: false
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify('production'),
        },
      }),
    ] : []),
  ],
  devtool: !isRelease && 'source-map',
}

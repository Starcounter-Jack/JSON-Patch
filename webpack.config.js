var webpack = require('webpack');
const package = require('./package.json');

module.exports = [
  {
    entry: './lib/duplex.js',
    mode: 'production',
    optimization: {
      minimize: false
    },
    output: {
      filename: 'fast-json-patch.js',
      library: 'jsonpatch',
      libraryTarget: 'var'
    },
    resolve: {
      extensions: ['.js']
    },
    plugins: [
      new webpack.BannerPlugin('fast-json-patch, version: ' + package['version'])
    ]
  },
  {
    entry: './lib/duplex.js',
    mode: 'production',
    output: {
      filename: 'fast-json-patch.min.js',
      library: 'jsonpatch',
      libraryTarget: 'var'
    },
    resolve: {
      extensions: ['.js']
    },
    plugins: [
      new webpack.BannerPlugin('fast-json-patch, version: ' + package['version'])
    ]
  }
];

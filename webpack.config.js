var webpack = require('webpack');
const BabiliPlugin = require('babili-webpack-plugin');

module.exports = [
  {
    entry: './src/duplex.js',
    output: {
      filename: './dist/fast-json-patch.js',
      library: 'jsonpatch',
      libraryTarget: 'var'
    },
    resolve: {
      extensions: ['.js']
    }
  },
  {
    entry: './src/duplex.js',
    output: {
      filename: './dist/fast-json-patch.min.js',
      library: 'jsonpatch',
      libraryTarget: 'var'
    },
    resolve: {
      extensions: ['.js']
    },
    plugins: [new BabiliPlugin()]
  }
];

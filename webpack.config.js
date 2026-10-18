var webpack = require('webpack');
const package = require('./package.json');
const path = require('path');
const MinimizerPlugin = require('minimizer-webpack-plugin');

// Minify, but keep `/*!` comments (the MIT headers and the version banner)
// in the file. By default webpack 5 moves them to a separate `*.LICENSE.txt`.
function minimizeKeepingLicenses() {
  return {
    minimizer: [new MinimizerPlugin({ extractComments: false })]
  };
}

module.exports = env => {
  if(env && env.NODE_ENV === "test") {
    return [
      {
        entry: './test/spec/webpack/importSpec.src.js',
        mode: 'production',
        optimization: minimizeKeepingLicenses(),
        output: {
          path: path.resolve(__dirname, 'test/spec/webpack'),
          filename: 'importSpec.build.js'
        },
        target: 'node',
        resolve: {
          extensions: ['.js']
        }
      }
    ];
  }
  else {
    return [
      {
        entry: './index.js',
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
        entry: './index.js',
        mode: 'production',
        optimization: minimizeKeepingLicenses(),
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
  }
};





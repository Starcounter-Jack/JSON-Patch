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

// `tsc` compiles the library to ES5, but webpack 5 writes its own runtime
// (the bundle wrapper) as ES2015. Keep the browser bundles ES5, like 3.1.1.
const BROWSER_TARGET = ['web', 'es5'];

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
        target: BROWSER_TARGET,
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
        target: BROWSER_TARGET,
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





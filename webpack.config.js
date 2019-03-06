const path = require('path');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

module.exports = {
  mode: 'production',
  entry: {
    'istanbul-lib-coverage': './lib/istanbul-lib-coverage.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'istanbul-lib-coverage.js',
    library: '__istanbulLibCoverage__',
    libraryTarget: 'var',
  },
  plugins: [
    new LicenseWebpackPlugin()
  ]
};

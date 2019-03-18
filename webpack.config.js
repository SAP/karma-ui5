const path = require('path');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

module.exports = {
  mode: 'development',
  entry: {
    'browser-bundle': './lib/client/browser.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'browser-bundle.js'
  },
  plugins: [
    new LicenseWebpackPlugin()
  ]
};

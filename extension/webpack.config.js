const path = require('path');

module.exports = {
  entry: {
    'page-script': './src/page-script.js',
    'background-script': './src/background-script.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    writeToDisk: true
  }
}

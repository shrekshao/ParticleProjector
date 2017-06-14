var path = require('path');
var webpack = require('webpack')

module.exports = {
  entry: {
    app: './js/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    loaders: [
      {
        test: /\.glsl$/,
        loader: "webpack-glsl-loader"
      },
    ]
  },
  plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
            warnings: false,
            drop_console: false,
            }
        })
    ],
  devServer: {
    port: 7000
  }
};
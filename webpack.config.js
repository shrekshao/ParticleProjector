var path = require('path');

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
  devServer: {
    port: 7000
  }
};
'use strict';

const Webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const buildDirectory = path.join(__dirname, 'build');

module.exports = {
  mode: 'development',
  entry: {
    app: './src/app.js'
  },
  output: {
    filename: 'app.js',
    path: buildDirectory,
  },
  devtool: false,
  devServer: {
    static: buildDirectory,
    port: 8080,
    proxy: {
      '/api': 'http://localhost:3500'
    }
  },

  stats: {
    colors: true,
    reasons: true
  },

  plugins: [
    new HtmlWebpackPlugin({template: 'src/assets/index.html'}),
  ],

  resolve: {
    extensions: ['.webpack.js', '.web.js', '.js', '.jsx'],
    fallback: {
      'fs': false,
      'path': false,
      'child_process': false,
      'stream': false,
      'crypto': false,
      'os': false,
    }
  },

  externals: {
    'congraphdb': 'null'
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|ico|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
    ]
  },
};

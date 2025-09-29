const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new (require('webpack')).DefinePlugin({
      'process.env': JSON.stringify({
        BACKEND_URL: process.env.BACKEND_URL || '',
        BASE_CANVA_CONNECT_API_URL: process.env.BASE_CANVA_CONNECT_API_URL || 'https://api.canva.cn/rest',
        BASE_CANVA_CONNECT_AUTH_URL: process.env.BASE_CANVA_CONNECT_AUTH_URL || 'https://www.canva.cn/api',
        CANVA_CLIENT_ID: process.env.CANVA_CLIENT_ID || 'OC-AZbW7d5jk2-P',
      }),
    }),
  ],
};

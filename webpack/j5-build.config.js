var path = require('path');
var webpack = require('webpack');
var Autoprefixer = require('less-plugin-autoprefix');

var IS_PROD = (process.env.NODE_ENV === 'production')
var plugins = [
    new webpack.NoErrorsPlugin(),
]
if (IS_PROD) {
  plugins = plugins.concat(
    [
      new webpack.DefinePlugin({
        "process.env" : {NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')}
      }),
      new webpack.optimize.UglifyJsPlugin({compress: {warnings: false} })
    ]
  )
}
console.log(plugins)


module.exports = {
  entry: path.join(__dirname, '../src/j5-index.js'),
  output: {
    library: 'react-big-calendar',
    libraryTarget: 'umd',
    path: path.join(__dirname, '../j5-build/'),
    filename: IS_PROD ? 'react-big-calendar.min.js': 'react-big-calendar.js',
  },

  plugins: plugins,
  resolve: {
    alias: {
      'react-big-calendar': path.join(__dirname, '..', 'src')
    },
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.gif$/, loader: 'url-loader?mimetype=image/png' },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff' },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader?name=[name].[ext]' },
      { test: /\.less/, loader: 'style-loader!css-loader!postcss-loader!less-loader', exclude: /node_modules/ },
      { test: /\.md/, loader: 'babel!markdown-jsx-loader'},
      { test: /\.js/, loaders: ['babel'], exclude: /node_modules/},
      { test: /\.js/, loaders: ['babel'], include: path.join(__dirname, '..', 'src')}
    ]
  },

  lessLoader: {
    lessPlugins: [
      new Autoprefixer({
        browsers: ['last 2 versions', "ie >= 10"]
      })
    ]
  }
};

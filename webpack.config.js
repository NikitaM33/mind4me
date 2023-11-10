const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
// const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const OptimizeCssAssetsWebpackPlugin = require("optimize-css-assets-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageminPlugin = require("imagemin-webpack");

const isDev = process.env.NODE_ENV === "development";
const isProd = !isDev;

const filename = (ext) =>
  isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

const optimize = () => {
  const configObj = {
    splitChunks: {
      chunks: "all",
    },
  };

  if (isProd) {
    configObj.minimizer = [
      new OptimizeCssAssetsWebpackPlugin(),
      new TerserWebpackPlugin(),
    ];
  }

  return configObj;
};

const plugins = () => {
  const basePlugins = [
    new HTMLWebpackPlugin({
      template: path.resolve(__dirname, "src/index.html"),
      filename: "index.html",
      minify: {
        collapseWhitespace: isProd,
      },
    }),
    // new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `./css/${filename("css")}`,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "../assets"),
          noErrorOnMissing: true,
        },
      ],
    }),
  ];

  if (isProd) {
    basePlugins.push(
      new ImageminPlugin({
        bail: false,
        cache: true,
        imageminOptions: {
          plugins: [
            ["gifsicle", { interlaced: true }],
            ["jpegtran", { progressive: true }],
            ["optipng", { optimizationLevel: 5 }],
            [
              "svgo",
              {
                plugins: [
                  {
                    removeViewBox: false,
                  },
                ],
              },
            ],
          ],
        },
      })
    );
  }

  return basePlugins;
};

module.exports = {
  context: path.resolve(__dirname, "src"),
  mode: "development",
  entry: "./js/main.js",
  output: {
    filename: `./js/${filename("js")}`,
    path: path.resolve(__dirname, "app"),
    clean: true,
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "app"),
    },
    historyApiFallback: true,
    open: true,
    compress: true,
    hot: true,
    port: 3000,
    client: {
      reconnect: true,
    },
  },
  optimization: optimize(),
  plugins: plugins(),
  devtool: isProd ? false : "source-map",
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: isDev,
            },
          },
          "css-loader",
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.(?:js|mjs|cjs)$/i,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
            plugins: ["@babel/plugin-proposal-class-properties"],
          },
        },
        generator: {
          filename: `js/[hash][ext]`,
        },
      },
      {
        test: /\.(?:|gif|png|jpg|jpeg|svg|webp|mp4)$/i,
        type: "asset/resource",
        generator: {
          filename: `assets/[hash][ext]`,
        },
      },
      {
        test: /\.(?:|woff|woff2|eot|ttf|svg)$/i,
        type: "asset/resource",
        generator: {
          filename: `fonts/[hash][ext]`,
        },
      },
    ],
  },
};

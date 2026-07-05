import path from "path"
import { Configuration } from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import publiEntries from "./public.entries"

interface IAppConfigEntries {
  title: string
  filename: string
  template: string
  chunks: string[]
}

type IPlugins = (CleanWebpackPlugin | MiniCssExtractPlugin | HtmlWebpackPlugin)[]

const entryGroup: IAppConfigEntries[] = Object.keys(publiEntries).map((key) => ({
  title: key,
  filename: `${key}.html`,
  template: `${key}.html`,
  chunks: [key]
}))

const plugins: IPlugins = [
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: "[name].css"
  })
]

Object.values(entryGroup).forEach((entryInfo, _entryName) => {
  plugins.push(
    new HtmlWebpackPlugin({
      title: entryInfo.title,
      filename: path.join(__dirname, "../public/" + entryInfo.filename),
      template: "./src/templates/" + entryInfo.template,
      chunks: entryInfo.chunks,
      publicPath: "/fuhhh",
      chunksSortMode: "manual",
      inject: "head",
      scriptLoading: "defer"
    })
  )
})

const entry = { ...publiEntries }

const config: Configuration = {
  mode: "development",
  entry,
  output: {
    path: path.resolve(__dirname, "../public/fuhhh"),
    filename: "[name].js",
    iife: false,
    clean: true
  },
  plugins,
  resolve: {
    extensions: [".ts", ".js", ".scss"]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-typescript"]
          }
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      }
    ]
  },
  watch: true,
  stats: "minimal",
  infrastructureLogging: {
    level: "error"
  }
}

export default config

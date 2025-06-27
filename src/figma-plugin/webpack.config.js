// Require the necessary packages
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLInlineCSSWebpackPlugin =
  require("html-inline-css-webpack-plugin").default;
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

// Export a function that takes in the environment and argv objects
module.exports = (env, argv) => ({
  // Determine the mode based on the argv.mode value
  mode: argv.mode === "production" ? "production" : "development",

  // Set the devtool based on the mode
  // Note: this is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === "production" ? false : "inline-source-map",

  // Define the entry points for the webpack build
  entry: {
    ui: "./src/app/index.tsx", // The entry point for your UI code
    code: "./src/controller/index.ts", // The entry point for your plugin code
  },

  // Define the rules for how different types of files should be handled
  module: {
    rules: [
      // Convert TypeScript code to JavaScript
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },

      // Allows you to use "<%= require('./file.svg') %>" in your HTML code to get a data URI
      {
        test: /\.(png|jpg|gif|webp|svg)$/,
        use: ["url-loader"],
      },

      // Process SASS/SCSS files and extract the CSS into a separate file
      {
        test: /\.(sass|scss)$/,
        use: [
          MiniCssExtractPlugin.loader, 
          "css-loader", 
          {
            loader: "sass-loader",
            options: {
              api: "modern-compiler", // Use the modern Sass API
              sassOptions: {
                // Additional Sass options can be added here if needed
              },
            },
          }
        ],
      },
    ],
  },

  // Configure how Webpack resolves modules
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"], // Specify the order in which extensions should be tried when resolving modules
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/utils": path.resolve(__dirname, "src/utils"),
      "@/services": path.resolve(__dirname, "src/services"),
      "@/components": path.resolve(__dirname, "src/app/components"),
    },
  },

  // Define the output file(s)
  output: {
    filename: "[name].js", // Use the name of the entry point as the output filename
    path: path.resolve(__dirname, "dist"), // Compile into a folder called "dist"
    publicPath: "", // Set the public path for the output files (empty string means relative path)
  },

  // Optimization settings for bun compatibility
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: false, // Disable parallel processing for bun compatibility
        terserOptions: {
          compress: {
            drop_console: argv.mode === "production",
          },
        },
      }),
    ],
  },

  // Define the plugins that should be used in the build process
  plugins: [
    // Generate "ui.html" and inline "ui.js" into it
    new HtmlWebpackPlugin({
      template: "./src/app/index.html",
      filename: "ui.html",
      chunks: ["ui"],
      cache: false, // Disable caching to prevent issues with Figma plugin reloading
    }),

    // Inline the "ui.js" chunk into "ui.html"
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),

    // Extract the CSS into a separate file
    new MiniCssExtractPlugin(),

    // Inline the CSS into the HTML file
    new HTMLInlineCSSWebpackPlugin(),
  ],
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { viteStaticCopy } from "vite-plugin-static-copy";
import richSvg from "vite-plugin-react-rich-svg";

import compileFigmaPlugin from "./scripts/vite/vite-compile-figma-plugin";

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [
    compileFigmaPlugin(["./src/index.ts"]),
    react(),
    viteSingleFile(),
    richSvg(),
    viteStaticCopy({
      targets: [
        {
          src: "manifest.json",
          dest: "./",
        },
        {
          src: "./src/dist/index.js",
          dest: "./",
        },
      ],
    }),
  ],
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Simplified config for debugging
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    target: "es6",
    minify: false,
    rollupOptions: {
      output: {
        format: 'iife',
      }
    }
  },
  esbuild: {
    target: "es6"
  },
});

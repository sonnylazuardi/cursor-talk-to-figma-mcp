import { Plugin } from "vite";

const compileFigmaPlugin = (entrypoints: string[]): Plugin => {
  console.log('🔧 Figma Plugin Compiler - Entrypoints:', entrypoints);

  return {
    name: "vite-compile-figma-plugin",

    async closeBundle() {
      console.log('🚀 Building Figma plugin code...');
      try {
        const result = await Bun.build({
          entrypoints: entrypoints,
          outdir: "./dist",
          target: "browser",
        });
        
        
        if (result.success) {
          console.log('✅ Figma plugin code built successfully');
        } else {
          console.error('❌ Build failed:', result.logs);
        }
      } catch (error) {
        console.error('❌ Build error:', error);
      }
    },
  };
};
export default compileFigmaPlugin;

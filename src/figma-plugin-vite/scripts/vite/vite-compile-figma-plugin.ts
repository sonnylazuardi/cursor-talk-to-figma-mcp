import { Plugin } from "vite";

const compileFigmaPlugin = (entrypoints: string[]): Plugin => {
  console.log(entrypoints);

  return {
    name: "vite-compile-figma-plugin",

    async buildEnd() {
      await Bun.build({
        entrypoints: entrypoints,
        outdir: "./src/dist",
      });
    },
  };
};
export default compileFigmaPlugin;

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/socket.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  sourcemap: true,
  minify: false,
  splitting: false,
  bundle: true,
}); 
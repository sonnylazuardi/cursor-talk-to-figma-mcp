import { defineConfig } from 'tsup';
import { spawn } from 'child_process';

const buildFigmaPlugin = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🔧 Building Figma plugin...');
    const child = spawn('bun', ['run', 'build'], {
      cwd: 'src/figma-plugin',
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Figma plugin built successfully!');
        resolve();
      } else {
        console.error('❌ Failed to build Figma plugin');
        reject(new Error(`Build failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error('❌ Failed to build Figma plugin:', error);
      reject(error);
    });
  });
};

export default defineConfig({
  entry: ['src/talk_to_figma_mcp/server.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  sourcemap: true,
  minify: false,
  splitting: false,
  bundle: true,
  onSuccess: buildFigmaPlugin,
}); 
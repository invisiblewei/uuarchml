import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@parser': resolve(__dirname, 'src/parser'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@types': resolve(__dirname, 'src/types'),
      '@ai': resolve(__dirname, 'src/ai'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'uuarchml',
      fileName: 'uuarchml',
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: [
        // Allow serving files from root
        resolve(__dirname),
        // Allow serving files from core package
        resolve(__dirname, 'packages/uuarchml-core'),
        // Allow serving examples
        resolve(__dirname, 'examples')
      ]
    }
  },
});

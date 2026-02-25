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
      name: 'ChipViz',
      fileName: 'chipviz',
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
  },
});

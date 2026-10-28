import { defineConfig } from 'vite';

export default defineConfig({
  base: '/clay-pond-garden/',
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/gfx-lab/' : '/',
  server: {
    port: 8080,
  },
  assetsInclude: ['**/*.hdr'],
  build: {
    outDir: 'dist',
  },
});

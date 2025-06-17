import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/js',
      filename: 'service-worker.js',
    }),
  ],
});

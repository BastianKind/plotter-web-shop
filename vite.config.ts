import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /plotter-web-shop/; the dev server stays at the root.
  base: command === 'build' ? '/plotter-web-shop/' : '/',
  server: { port: 5173 },
  // The Iconoir set is one lazily loaded ~1.1 MB chunk (≈140 KB gzipped); that's expected.
  build: { chunkSizeWarningLimit: 1200 },
}));

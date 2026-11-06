import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /plotter-web-shop/; the dev server stays at the root.
  base: command === 'build' ? '/plotter-web-shop/' : '/',
  server: { port: 5173 },
}));

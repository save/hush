import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// hush's homepage. A plain static site: `npm run site:build` → site/dist,
// which any static host (Vercel, Netlify, GitHub Pages) can serve.
export default defineConfig({
  root: here('.'),
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': here('./src'), '@ui': here('../ui/src') } },
  build: { outDir: here('./dist'), emptyOutDir: true, target: 'es2022', reportCompressedSize: false },
  server: { port: 5180 },
  preview: { port: 5180 },
});

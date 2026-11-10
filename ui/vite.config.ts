import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The popup is hush's own page, so it can use React + shadcn/ui without
// costing the sites anything. Built into build/popup (relative asset paths
// so it works from chrome-extension://).
export default defineConfig({
  root: here('.'),
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': here('./src') } },
  build: {
    outDir: here('../build/popup'),
    emptyOutDir: true,
    target: 'chrome120',
    modulePreload: false,
    cssCodeSplit: false,
    reportCompressedSize: false,
    rollupOptions: { input: { popup: here('./index.html'), support: here('./support.html') } },
  },
});

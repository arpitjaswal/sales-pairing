import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  root: __dirname,
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 5173,
    open: true,
    host: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '@components', replacement: resolve(__dirname, 'src/components') },
      { find: '@pages', replacement: resolve(__dirname, 'src/pages') },
      { find: '@hooks', replacement: resolve(__dirname, 'src/hooks') },
      { find: '@services', replacement: resolve(__dirname, 'src/services') },
      { find: '@utils', replacement: resolve(__dirname, 'src/utils') },
      { find: '@types', replacement: resolve(__dirname, 'src/types') },
      { find: '@styles', replacement: resolve(__dirname, 'src/styles') },
      { find: '@assets', replacement: resolve(__dirname, 'src/assets') },
      { find: '@layouts', replacement: resolve(__dirname, 'src/layouts') },
      { find: '@api', replacement: resolve(__dirname, 'src/api') },
      { find: '@config', replacement: resolve(__dirname, 'src/config') },
      { find: '@routes', replacement: resolve(__dirname, 'src/routes') },
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
        },
      },
    },
    minify: 'esbuild',
  },
  preview: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})

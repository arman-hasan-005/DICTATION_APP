import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Warn when any chunk exceeds 500 KB
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps vendor libs out of app chunks
        manualChunks: {
          // React core — changes rarely, long cache lifetime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Axios — separate so app updates don't bust the axios cache
          'vendor-axios': ['axios'],
        },
      },
    },
  },
});

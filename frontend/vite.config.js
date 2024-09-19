import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    eslint()
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './setupTests.js',
    coverage: {
      exclude: [ 
        'dist/*', 
        'src/main.jsx', 
        'src/__tests__/validity.test.jsx', 
        '.eslintrc.cjs', 
        'vite.config.js' 
      ]
    }
  },
});
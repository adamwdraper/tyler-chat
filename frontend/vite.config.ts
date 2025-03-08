import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file in the backend directory
const backendEnvPath = path.resolve(__dirname, '../backend/.env');
let fileStoragePath = 'files'; // Default value

if (fs.existsSync(backendEnvPath)) {
  const backendEnv = dotenv.parse(fs.readFileSync(backendEnvPath));
  if (backendEnv.TYLER_FILE_STORAGE_PATH) {
    // Extract the basename from the storage path
    fileStoragePath = path.basename(backendEnv.TYLER_FILE_STORAGE_PATH);
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '3000'),
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      [`/${fileStoragePath}`]: {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
}); 
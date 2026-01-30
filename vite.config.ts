import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      // Allow connections to local pusher trigger server, Pusher CDN, and Supabase (HTTP + WebSocket)
      // Also explicitly allow blob workers via worker-src to satisfy Vite HMR worker creation in dev
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' http://localhost:5000 ws://localhost:5000 https://js.pusher.com https://*.pusher.com wss://*.pusher.com https://zvclaylphpigdidtqbed.supabase.co wss://zvclaylphpigdidtqbed.supabase.co; script-src 'self' https://js.pusher.com 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    }
  }
});

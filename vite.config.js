import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3001';
  const proxy = {
    '/api': { target: proxyTarget, changeOrigin: true },
    '/arquivos': { target: proxyTarget, changeOrigin: true }
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts,
      proxy
    },
    preview: {
      port: 4173,
      allowedHosts,
      proxy
    }
  };
});

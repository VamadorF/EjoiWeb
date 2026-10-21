import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // process.env no incluye .env.local en el config de Vite: hay que cargarlo explícitamente.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      __DEV__: JSON.stringify(mode !== 'production'),
    },
    resolve: {
      alias: [
        {
          find: '@/features/companion/api/image.api',
          replacement: fileURLToPath(new URL('./src/platform/image.api.shim.ts', import.meta.url)),
        },
        { find: '@/shared/services/http/client', replacement: fileURLToPath(new URL('./src/platform/http.ts', import.meta.url)) },
        { find: '@/shared/services/storage/secure', replacement: fileURLToPath(new URL('./src/platform/secure.ts', import.meta.url)) },
        { find: '@/shared/services/storage/keyValue', replacement: fileURLToPath(new URL('./src/platform/keyValue.ts', import.meta.url)) },
        { find: '@/app/config/env', replacement: fileURLToPath(new URL('./src/platform/env.ts', import.meta.url)) },
        { find: '@', replacement: fileURLToPath(new URL('./src/app-shared', import.meta.url)) },
        { find: '~', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      ],
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    },
  };
});

/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { politiqueSecurite } from './src/lib/csp';

const csp = (apiUrl?: string): Plugin => ({
  name: 'trade-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${politiqueSecurite(apiUrl)}" />`
    ),
});

// En développement, le navigateur appelle /api sur le serveur Vite, qui relaie vers
// l'API trade_back (préfixe /trade/v1). Même origine : pas de CORS à configurer.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cible = env.VITE_API_PROXY_TARGET || 'http://localhost:8000';
  const proxy = {
    '/api': {
      target: cible,
      changeOrigin: true,
      rewrite: (chemin: string) => chemin.replace(/^\/api/, '/trade/v1'),
    },
  };

  return {
    plugins: [react(), csp(env.VITE_API_URL)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5176, proxy },
    preview: { port: 4176, proxy },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      pool: 'forks',
      maxWorkers: 1,
      isolate: false,
      restoreMocks: true,
    },
  };
});

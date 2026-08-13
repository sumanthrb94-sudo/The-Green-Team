/**
 * Documentation / screenshot build.
 *
 * Identical to vite.config.ts except that the four `firebase/*` entrypoints are
 * aliased to the in-memory stand-ins in scripts/demo-firebase/. That lets the app
 * boot in a fully signed-in state — including the admin dashboard — without real
 * Firebase credentials, so `npm run screenshots` can capture authenticated UI.
 *
 * Never used by `npm run build` / production deploys.
 *
 *   npm run dev:demo      # http://localhost:4173
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const demo = (file: string) => path.resolve(__dirname, 'scripts/demo-firebase', file);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^firebase\/app$/, replacement: demo('app.ts') },
      { find: /^firebase\/auth$/, replacement: demo('auth.ts') },
      { find: /^firebase\/firestore$/, replacement: demo('firestore.ts') },
      { find: /^firebase\/analytics$/, replacement: demo('analytics.ts') },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  server: {
    port: 4173,
    host: '0.0.0.0',
    hmr: false,
  },
});

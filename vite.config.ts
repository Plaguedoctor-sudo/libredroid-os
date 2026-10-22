import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { hardwareBridgePlugin } from './server/hardwareBridgePlugin';

export default defineConfig({
  plugins: [react(), hardwareBridgePlugin()],
  server: {
    host: '0.0.0.0',
    port: 3001,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = 'http://localhost:3333';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // falha com aviso claro se a porta estiver ocupada, em vez de mudar de porta
    proxy: {
      '/api': API,
      '/uploads': API,
    },
  },
});

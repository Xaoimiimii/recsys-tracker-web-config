import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, '');
    
    return {
      server: {
        port: 5174,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'import.meta.env.WEB_CONFIG_API_BASE_URL': JSON.stringify(env.WEB_CONFIG_API_BASE_URL),
        'import.meta.env.MODULE_API_BASE_URL': JSON.stringify(env.MODULE_API_BASE_URL),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

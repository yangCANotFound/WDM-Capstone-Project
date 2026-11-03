import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the React SPA.
// - `base: '/'` is the default and works on Vercel/Netlify root deployments.
// - The API base URL is NOT hard-coded here: it comes from VITE_API_URL at build
//   time (see src/api/client.js), which is how the deployed SPA talks to the
//   deployed API only.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Local dev nicety: if you prefer to hide CORS during development you could
    // proxy here, but we intentionally call the API directly so that the local
    // setup is identical to production.
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

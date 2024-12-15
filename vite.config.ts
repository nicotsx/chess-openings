import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// biome-ignore lint/style/noDefaultExport: Needed for Vite
export default defineConfig({
  plugins: [react()],
});

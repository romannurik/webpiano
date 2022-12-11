import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    assetsInclude: ['**/*.mp3'],
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true
    }
  })],
});

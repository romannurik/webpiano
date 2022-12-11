import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.mp3"],
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globDirectory: "dist/",
        globPatterns: ["**/*.{html,ico,css,woff2,png,svg,jpg,js,mp3}"],
      },
      injectRegister: "auto",
      manifest: {
        name: "Piano Toys",
        short_name: "Piano",
        description: 'A simple, no-frills, web-based piano',
        theme_color: '#ffffff',
        display: "fullscreen",
        icons: [
          { src: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32" },
          { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
          { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
          {
            src: "/icon-192-maskable.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "maskable",
          },
          {
            src: "/icon-512-maskable.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import {VitePWA} from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'FarmAssist',
        short_name: 'FarmAssist',
        description: 'Intelligent agricultural platform and crop recommendation',
        theme_color: '#ffffff', // Change this to match your app's primary UI color
        background_color: '#ffffff',
        display: 'standalone', // This makes it look like a native app (hides URL bar)
        icons: [
          {
            src: "launchericon-192x192.png",
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
  })],
});

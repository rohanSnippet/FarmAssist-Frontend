import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",
      // Enable the same manifest and service-worker behavior while
      // testing from a phone during development. A production build
      // remains required to test PWA installability over HTTPS.
      devOptions: {
        enabled: true,
        // type: "module",
      },

      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],

      manifest: {
        name: "FarmAssist",
        short_name: "FarmAssist",
        description:
          "Intelligent agricultural platform and crop recommendation",

        start_url: "/",
        scope: "/",

        display: "standalone",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        icons: [
          {
            src: "/launchericon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});

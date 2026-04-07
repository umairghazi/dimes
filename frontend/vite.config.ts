import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Dimes",
        short_name: "Dimes",
        description: "Track your dimes. Every one counts.",
        theme_color: "#1976d2",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/global/variables" as *; @use "@/styles/global/mixins" as *;`,
      },
    },
  },
});

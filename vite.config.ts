import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/hls.js/")) return "hls";
          if (id.includes("/framer-motion/")) return "motion";
          if (id.includes("/@supabase/")) return "supabase";
          if (id.includes("/@tanstack/")) return "tanstack";
          if (id.includes("/react-router-dom/") || id.includes("/react-router/")) return "router";
          if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("/scheduler/")) return "react-core";
          if (id.includes("/recharts/")) return "charts";
          if (id.includes("/@radix-ui/") || id.includes("/cmdk/") || id.includes("/vaul/")) return "ui-kit";
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}"],
      },
      manifest: {
        name: "شبام24 | Shibam24",
        short_name: "شبام24",
        description: "منصة إخبارية ذكية مدعومة بالذكاء الاصطناعي",
        theme_color: "#dc2626",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

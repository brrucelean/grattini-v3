import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { ticketLayoutPlugin } from "./vite-plugin-ticket-layout.js";

export default defineConfig({
  plugins: [
    react(),
    ticketLayoutPlugin(),
    ...(process.env.ANALYZE
      ? [visualizer({ filename: ".stats/stats.html", gzipSize: true, brotliSize: true })]
      : []),
  ],
  base: "/grattini-v3/",
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: { output: { manualChunks: { vendor: ["react", "react-dom"] } } },
    chunkSizeWarningLimit: 320,
  },
});

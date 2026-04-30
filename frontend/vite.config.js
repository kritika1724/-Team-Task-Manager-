import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const railwayPublicHost = process.env.RAILWAY_PUBLIC_DOMAIN;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    host: true,
    allowedHosts: railwayPublicHost ? [railwayPublicHost] : [],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the app to your local network
    proxy: {
      // Any request starting with /api or /stream goes to backend
      "/api": "http://localhost:8080",
      "/stream": "http://localhost:8080",
    },
  },
});

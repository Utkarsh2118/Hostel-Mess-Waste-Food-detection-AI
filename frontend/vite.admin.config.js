import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../static/admin-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/admin/main.jsx",
      output: {
        entryFileNames: "admin-app.js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "admin-app.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});

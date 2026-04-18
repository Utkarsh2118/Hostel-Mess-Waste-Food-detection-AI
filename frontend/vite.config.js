import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../static/student-dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "student-app.js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "student-app.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});

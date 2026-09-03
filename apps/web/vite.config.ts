import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "./src"),
      "@product-reviews/shared": path.resolve(
        currentDir,
        "../packages/shared/src",
      ),
    },
  },
  optimizeDeps: {
    include: ["@product-reviews/shared"],
  },
});

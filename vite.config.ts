import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import build from "@hono/vite-build/cloudflare-workers";
import devServer from '@hono/vite-dev-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [react()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
        },
      },
      css: {
        transformer: 'postcss'    
      },
      root: path.resolve(__dirname, "client"),
      build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true,
        cssMinify: false,
      },
    }
  } else {
    return {
      plugins: [
        devServer({
          entry: path.resolve(__dirname, "server", "index.ts")
        }),
        build({
        entry: path.resolve(__dirname, "server", "index.ts"),
        outputDir: path.resolve(__dirname, "dist"),
        emptyOutDir: false,
        output: "index.js",
        minify: false,
      })],
    }
  }
})


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import build from "@hono/vite-build/cloudflare-workers";
import pages from '@hono/vite-cloudflare-pages'
import devServer, { defaultOptions } from '@hono/vite-dev-server';
import adapter from '@hono/vite-dev-server/cloudflare'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    console.log("client")
    return {
      plugins: [react(), devServer({
        entry: path.resolve(__dirname, "server", "app.ts"),
        adapter: adapter(),
        exclude: ['/assets/*', ...defaultOptions.exclude],
      })],
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
        pages(),
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


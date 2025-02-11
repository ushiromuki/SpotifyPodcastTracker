import type { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "hono") {
  const formattedTime = new Date().toLocaleTimeString("ja-JP", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Hono) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: {
      middlewareMode: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    appType: "custom",
  });

  // APIルートを除外するミドルウェア
  app.use("*", async (c, next) => {
    if (c.req.url.startsWith("/api/")) {
      return next();
    }

    const middleware = vite.middlewares.handle;
    return new Promise((resolve, reject) => {
      middleware(c.req.raw, c.res.raw, (err: Error) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(next());
      });
    });
  });

  // HTML配信用のミドルウェア
  app.use("*", async (c) => {
    if (c.req.url.startsWith("/api/")) {
      return c.next();
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(c.req.url, template);
      return c.html(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error(e);
      return c.text("Internal Server Error", 500);
    }
  });

  return vite;
}

export function serveStaticFiles(app: Hono) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  app.use("/", serveStatic({ root: distPath }));
}
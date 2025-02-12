import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { Bindings } from "./bindings";

async function createDevServer() {
  const app = new Hono<{ Bindings: Bindings }>();

  // CORSの設定を追加
  app.use("*", cors({
    origin: ["http://localhost:5000", "http://127.0.0.1:5000"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }));

  // その他のミドルウェアの設定
  app.use("*", logger());
  app.use("*", secureHeaders());

  

  // APIルートの登録
  registerRoutes(app);

  // Viteの開発サーバーのセットアップ
  await setupVite(app);

  const port = process.env.PORT || 5000;
  log(`開発サーバーを起動しています: http://localhost:${port}`);

  serve({
    fetch: app.fetch,
    port: Number(port),
    hostname: "0.0.0.0"
  });
}

createDevServer().catch((err) => {
  console.error("サーバーの起動に失敗しました:", err);
  process.exit(1);
}); 
import { Hono } from "hono";
import { registerRoutes } from "./routes";
import { serveStaticFiles } from "./vite";

const app = new Hono();

// APIルートや認証ルートの登録
registerRoutes(app);

// ビルド済みの静的ファイル（例えば Vite でビルドした client）を提供
serveStaticFiles(app);

export default {
  fetch: app.fetch,
}; 
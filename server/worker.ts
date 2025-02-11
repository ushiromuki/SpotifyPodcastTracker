import { Hono } from "hono";
import { registerRoutes } from "./routes";
import { serveStaticFiles } from "./vite";
import { PrismaClient } from '@prisma/client';
import { PrismaStorage } from './storage';

const prisma = new PrismaClient();
const storage = new PrismaStorage(prisma);
const app = new Hono();

// ストレージをコンテキストに追加
app.use('*', async (c, next) => {
  c.set('storage', storage);
  await next();
});

// APIルートや認証ルートの登録
registerRoutes(app);

// ビルド済みの静的ファイル提供
serveStaticFiles(app);

export default {
  fetch: app.fetch,
}; 
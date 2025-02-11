import { drizzle, AnyD1Database } from "drizzle-orm/d1";
import { users, podcastShows, playedEpisodes } from "./shared/schema"; // ←パスは各自調整してください

declare global {
  // Cloudflare Workers の D1 バインディングにより、グローバル変数 DB が提供されます
  const DB: AnyD1Database;
}

// schema オブジェクトとしてまとめる例（あるいは個別に渡しても可）
const schema = { users, podcastShows, playedEpisodes };

export const db = drizzle(DB, { schema });

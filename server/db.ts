import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from '@cloudflare/workers-types';
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

// D1 database will be injected by Cloudflare Workers
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// Export types for use in other files
export type Database = ReturnType<typeof createDb>;
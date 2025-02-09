import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from "@shared/schema";

// D1 database will be injected by Cloudflare Workers
export function createDb(d1?: D1Database) {
  if (!d1) {
    // Return null in development or when D1 is not available
    return null;
  }
  return drizzle(d1, { schema });
}

// Export types for use in other files
export type Database = ReturnType<typeof createDb>;
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { D1Database } from '@cloudflare/workers-types';

export const getPrismaClient = async (db: D1Database) => {
    const adapter = new PrismaD1(db);
    return new PrismaClient({ adapter });
};
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';

// Driver pg tidak punya batas waktu bawaan; tanpa ini permintaan menggantung saat Neon
// bangun dari tidur (AUDIT D-13). 10 detik cukup untuk cold start Neon.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  max: 5,
});

export const prisma = new PrismaClient({ adapter });

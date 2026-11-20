import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const backendRoot = path.resolve(import.meta.dirname, '../..');

// Variabel lain (DATABASE_URL, SESSION_SECRET, AI_*) ditambahkan oleh tugas yang memakainya.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_ORIGIN: z.url().default('http://localhost:5173'),
  FRONTEND_DIST_DIR: z.string().min(1).default('../frontend/dist'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Nama variabel saja, tanpa nilai, agar rahasia tidak masuk log.
  const names = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Environment tidak valid: ${names}`);
}

export const env = {
  ...parsed.data,
  // Relatif terhadap backend/, bukan cwd, karena Render menjalankan dari root repo.
  FRONTEND_DIST_DIR: path.resolve(backendRoot, parsed.data.FRONTEND_DIST_DIR),
};

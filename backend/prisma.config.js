// Prisma 7 tidak memuat .env otomatis.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// URL di sini hanya dipakai CLI (migrasi), jadi koneksi langsung Neon (DIRECT_URL).
// Aplikasi memakai DATABASE_URL (pooled) lewat @prisma/adapter-pg.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  // `seed` juga dipanggil otomatis oleh `prisma migrate reset`.
  migrations: { path: 'prisma/migrations', seed: 'node prisma/seed.js' },
  datasource: { url: process.env.DIRECT_URL ?? '' },
});

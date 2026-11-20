import { CATALOG as BASE_CATALOG } from '@lavestreat/shared';

/**
 * `est_days_hint` per kode, hanya di server (PUB-01). Layanan reguler adalah estimasi sementara
 * tim (Q-13); ganti di sini lalu jalankan `npm run db:seed -w backend`, tanpa migrasi.
 * Kode yang tidak ada di sini bernilai null.
 */
const EST_DAYS_HINT = {
  EASY: 2,
  MEDIUM: 3,
  DEEP: 3,
  WHITE: 3,
  LEATHER: 4,
  SUEDE: 4,
  BOOTS: 4,
  KIDS: 2,
  EXPRESS: 1,
  // UNYELLOWING sengaja kosong: menambah 2 hari pada estimasi, bukan durasi sendiri (PRD 14.1).
  FASTTRACK: 2,
};

/** Katalog BR-01 (docs/DATABASE.md 9.1) beserta `est_days_hint`, untuk seed. */
export const CATALOG = BASE_CATALOG.map((item) => ({
  ...item,
  est_days_hint: EST_DAYS_HINT[item.code] ?? null,
}));

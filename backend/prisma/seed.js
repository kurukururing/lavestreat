// Seed idempotent (NFR-08): upsert berdasarkan `code`, aman dijalankan berulang.
// Pesanan dummy untuk dasbor menyusul di W2-28 dari dataset W1-22.
import { prisma } from '../src/lib/prisma.js';
import { CATALOG } from './catalog.js';

try {
  await prisma.$transaction(
    CATALOG.map(({ code, ...fields }) =>
      prisma.catalogItem.upsert({
        where: { code },
        create: { code, ...fields, active: true },
        update: fields, // `active` tidak disentuh: item yang dinonaktifkan pemilik tetap nonaktif
      }),
    ),
  );
  console.log(`Seed katalog selesai: ${CATALOG.length} item.`);
} finally {
  await prisma.$disconnect();
}

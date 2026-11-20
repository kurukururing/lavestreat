import { expect, test } from 'vitest';
import { CATALOG } from '../prisma/catalog.js';

test('katalog seed sesuai BR-01 dan keputusan Q-13', () => {
  expect(CATALOG).toHaveLength(13);
  expect(new Set(CATALOG.map((c) => c.code)).size).toBe(13);
  for (const item of CATALOG) {
    expect(Number.isInteger(item.price_idr) && item.price_idr > 0).toBe(true);
    expect(['service', 'addon', 'product']).toContain(item.type);
  }
  const hint = Object.fromEntries(CATALOG.map((c) => [c.code, c.est_days_hint]));
  expect(hint).toMatchObject({ EXPRESS: 1, FASTTRACK: 2, UNYELLOWING: null, SHOE_CLEANER: null });
  // Layanan reguler dalam rentang situs "Estimasi 1–4 hari" (BR-09).
  const regular = CATALOG.filter((c) => c.type === 'service');
  expect(regular.every((c) => c.est_days_hint >= 1 && c.est_days_hint <= 4)).toBe(true);
});

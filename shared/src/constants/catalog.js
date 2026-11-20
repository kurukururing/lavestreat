/**
 * Katalog BR-01 (docs/DATABASE.md 9.1), satu sumber untuk seed dan mock. Harga menunggu
 * konfirmasi PIC (Q-03). `est_days_hint` sengaja tidak di sini karena tidak pernah keluar ke
 * klien (PUB-01); nilainya ada di backend/prisma/catalog.js.
 */
export const CATALOG = [
  { code: 'EASY', type: 'service', name: 'Easy Clean', price_idr: 15000, unit: 'per pasang' },
  { code: 'MEDIUM', type: 'service', name: 'Medium Clean', price_idr: 20000, unit: 'per pasang' },
  { code: 'DEEP', type: 'service', name: 'Deep Clean', price_idr: 25000, unit: 'per pasang' },
  { code: 'WHITE', type: 'service', name: 'White Clean', price_idr: 35000, unit: 'per pasang' },
  { code: 'LEATHER', type: 'service', name: 'Leather Clean', price_idr: 45000, unit: 'per pasang' },
  { code: 'SUEDE', type: 'service', name: 'Suede Clean', price_idr: 50000, unit: 'per pasang' },
  { code: 'BOOTS', type: 'service', name: 'Boots Clean', price_idr: 50000, unit: 'per pasang' },
  { code: 'KIDS', type: 'service', name: 'Kids Shoes', price_idr: 30000, unit: 'per pasang' },
  { code: 'EXPRESS', type: 'service', name: 'Express Clean', price_idr: 35000, unit: 'per pasang' },
  {
    code: 'UNYELLOWING',
    type: 'addon',
    name: 'Unyellowing Treat',
    price_idr: 25000,
    unit: 'per pasang',
  },
  { code: 'FASTTRACK', type: 'addon', name: 'Fast Track', price_idr: 15000, unit: 'per pasang' },
  {
    code: 'SHOE_CLEANER',
    type: 'product',
    name: 'Shoe Cleaner',
    price_idr: 15000,
    unit: 'per botol 100 ml',
  },
  {
    code: 'SHOE_REFRESHER',
    type: 'product',
    name: 'Shoe Refresher',
    price_idr: 20000,
    unit: 'per botol 100 ml',
  },
];

// Data dummy untuk mock API (W1-21). Nama dan nomor jelas palsu (AGENTS aturan 7).

/** Katalog BR-01. `est_days_hint` sengaja tidak ada: tidak pernah keluar ke klien (PUB-01). */
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
].map((item) => ({ ...item, description: null }));

export const SHIPPING = { sidoarjo: 5000, surabaya: 10000, dropoff: 0 };

export const SLOTS = [
  { code: 'morning', label: 'PAGI', start: '09:00', end: '12:00' },
  { code: 'noon', label: 'SIANG', start: '13:00', end: '16:00' },
  { code: 'evening', label: 'SORE', start: '16:00', end: '19:00' },
];

export const MAX_ADVANCE_DAYS = 30;

/** Kredensial login mock saja. Back-end asli memakai akun dari `admin:create`. */
export const MOCK_ADMIN = { username: 'owner', password: 'dummy-owner' };

const customers = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    name: 'Budi Contoh',
    phone: '+6281200000001',
    email: null,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    name: 'Sari Contoh',
    phone: '+6281200000002',
    email: 'sari@contoh.test',
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    name: 'Andi Contoh',
    phone: '+6281200000003',
    email: null,
  },
];

/** Bentuk pesanan awal; dilengkapi oleh `seedOrder` di handlers. */
export const SEED_ORDERS = [
  {
    code: 'LS-7K3M9QW2',
    customer: 0,
    status: 'pending_confirmation',
    items: [
      ['EASY', 1],
      ['UNYELLOWING', 1],
    ],
    fulfillment: 'pickup',
    area: 'sidoarjo',
    daysAgo: 0,
  },
  {
    code: 'LS-H4TR8WN5',
    customer: 1,
    status: 'received',
    items: [['DEEP', 2]],
    fulfillment: 'dropoff',
    area: null,
    daysAgo: 1,
    estimated_days: 3,
  },
  {
    code: 'LS-P2XN5DK7',
    customer: 2,
    status: 'processing',
    items: [['SUEDE', 1]],
    fulfillment: 'pickup',
    area: 'surabaya',
    daysAgo: 2,
    estimated_days: 4,
  },
  {
    code: 'LS-B9CF3KA4',
    customer: 0,
    status: 'done',
    items: [
      ['WHITE', 1],
      ['FASTTRACK', 1],
    ],
    fulfillment: 'pickup',
    area: 'sidoarjo',
    daysAgo: 4,
    estimated_days: 2,
  },
  {
    code: 'LS-M6VJ2ET8',
    customer: 1,
    status: 'completed',
    items: [['EASY', 3]],
    fulfillment: 'dropoff',
    area: null,
    daysAgo: 9,
    estimated_days: 3,
  },
  {
    code: 'LS-R8YT4AZ3',
    customer: 2,
    status: 'cancelled',
    items: [['KIDS', 1]],
    fulfillment: 'pickup',
    area: 'surabaya',
    daysAgo: 6,
  },
];

export function seedCustomers() {
  return customers.map((c) => ({ ...c, created_at: '2026-11-01T03:00:00.000Z' }));
}

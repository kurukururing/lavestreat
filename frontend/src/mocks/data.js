// Data dummy untuk mock API (W1-21). Nama dan nomor jelas palsu (AGENTS aturan 7).

import { CATALOG as BASE_CATALOG } from '@lavestreat/shared';

/** Katalog BR-01 dari shared/ (bentuk respons PUB-01). */
export const CATALOG = BASE_CATALOG.map((item) => ({ ...item, description: null }));

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

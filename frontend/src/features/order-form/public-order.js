import { BadgeCheck, Droplets, Package, Plus, Sparkles } from 'lucide-react';
import { CATALOG, SLOTS } from '@lavestreat/shared';

import deepSrc from '@/assets/pesan/deep.jpg';
import regulerSrc from '@/assets/pesan/reguler.jpg';
import suedeSrc from '@/assets/pesan/suede.jpg';
import whiteSrc from '@/assets/pesan/white.jpg';
import { AREA_LABELS, byCode } from '@/features/order-form/order-form';
import { useCatalog } from '@/hooks/useCatalog';

// Data dan perhitungan form pesanan publik (PG-2), dipisah dari komponen agar fast refresh jalan.

export { byCode };

// Keterangan item, disalin dari Figma Hi-fi (89:3771) dan kartu layanan (84:3942).
export const DESC = {
  EASY: 'Pembersihan ringan upper dan midsole',
  MEDIUM: 'Bagian luar: upper dan midsole',
  DEEP: 'Menyeluruh, termasuk insole dan tali',
  WHITE: 'Bodi dan midsole putih kembali cerah',
  LEATHER: 'Bahan kulit dengan leather lotion',
  SUEDE: 'Suede & nubuck dengan suede lotion',
  BOOTS: 'Sepatu boots',
  KIDS: 'Sepatu anak',
  EXPRESS: 'Selesai 1 hari',
  UNYELLOWING: '+2 hari kerja',
  FASTTRACK: 'Estimasi 2 hari · tidak bisa digabung Express',
  SHOE_CLEANER: 'Botol 100 ml',
  SHOE_REFRESHER: 'Botol 100 ml',
};
export const IMAGES = {
  EASY: regulerSrc,
  MEDIUM: regulerSrc,
  DEEP: deepSrc,
  WHITE: whiteSrc,
  SUEDE: suedeSrc,
};

/** Kategori akordeon langkah 1 (Figma "Akordeon layanan" 179:7745). */
export const CATEGORIES = [
  {
    value: 'regular',
    icon: Droplets,
    title: 'Cuci reguler',
    short: 'Easy, Medium, Deep',
    codes: ['EASY', 'MEDIUM', 'DEEP'],
  },
  {
    value: 'material',
    icon: Sparkles,
    title: 'Bahan & warna',
    short: 'White, Leather, Suede',
    codes: ['WHITE', 'LEATHER', 'SUEDE'],
  },
  {
    value: 'special',
    icon: BadgeCheck,
    title: 'Khusus',
    short: 'Boots, Kids, Express',
    codes: ['BOOTS', 'KIDS', 'EXPRESS'],
  },
  {
    value: 'addon',
    icon: Plus,
    title: 'Add-on (opsional)',
    short: 'Unyellowing, Fast Track · per pasang',
    codes: ['UNYELLOWING', 'FASTTRACK'],
  },
  {
    value: 'product',
    icon: Package,
    title: 'Produk (opsional)',
    short: 'Shoe Cleaner, Shoe Refresher · per botol',
    codes: ['SHOE_CLEANER', 'SHOE_REFRESHER'],
  },
];

export const unitOf = (code) => (byCode[code]?.type === 'product' ? 'botol' : 'pasang');

/**
 * Baris pesanan dari `{ code: qty }` dengan harga katalog server (hanya perkiraan, AC-01.5).
 * `subtotal` `undefined` selama harga dimuat.
 */
export function useOrderLines(qty) {
  const { price } = useCatalog();
  const lines = CATALOG.filter((c) => qty[c.code] > 0).map((c) => ({
    code: c.code,
    name: c.name,
    type: c.type,
    qty: qty[c.code],
    price: price(c.code),
  }));
  const prices = lines.map((l) => l.price);
  const subtotal = prices.includes(null)
    ? null
    : prices.includes(undefined)
      ? undefined
      : lines.reduce((s, l) => s + l.price * l.qty, 0);
  return { lines, subtotal };
}

/** Ongkir perkiraan: jemput per area (BR-03), antar sendiri 0, belum memilih `undefined`. */
export function useShippingFee({ fulfillment, area }) {
  const { shipping } = useCatalog();
  if (fulfillment === 'dropoff') return 0;
  if (fulfillment === 'pickup' && area) return shipping(area);
  return undefined;
}

export const addMoney = (a, b) =>
  typeof a === 'number' && typeof b === 'number' ? a + b : undefined;

/**
 * Teks metode per jenis pesanan. Nilai `fulfillment` tetap `pickup`/`dropoff` (kontrak API);
 * untuk `product_only` artinya diantar ke alamat atau diambil di outlet (AC-09.1).
 */
const WORDING = {
  treatment: {
    question: 'Bagaimana sepatu sampai ke kami?',
    pickup: 'Dijemput kurir',
    pickupDesc: 'Kurir mengambil dan mengantar kembali. Ongkir flat per pesanan.',
    dropoff: 'Antar sendiri ke outlet',
    dropoffDesc: 'Bawa sepatu ke outlet. Tanpa ongkir.',
    dropoffShort: 'antar sendiri',
    area: 'Area penjemputan',
    pickupSchedule: 'Jadwal penjemputan',
    dropoffSchedule: 'Jadwal antar ke outlet',
    address: 'Alamat penjemputan',
    addressNote: 'Hanya bila dijemput kurir',
    addressHelper: 'Wajib untuk penjemputan, 10–300 karakter',
  },
  product_only: {
    question: 'Bagaimana produk sampai ke Anda?',
    pickup: 'Diantar ke alamat',
    pickupDesc: 'Kurir mengantar produk ke alamat Anda. Ongkir flat per pesanan.',
    dropoff: 'Ambil di outlet',
    dropoffDesc: 'Ambil produk langsung di outlet. Tanpa ongkir.',
    dropoffShort: 'ambil di outlet',
    area: 'Area pengantaran',
    pickupSchedule: 'Jadwal pengantaran',
    dropoffSchedule: 'Jadwal ambil di outlet',
    address: 'Alamat pengantaran',
    addressNote: 'Hanya bila diantar ke alamat',
    addressHelper: 'Wajib untuk pengantaran, 10–300 karakter',
  },
};

/** @param {'treatment'|'product_only'} orderType */
export const wording = (orderType) => WORDING[orderType] ?? WORDING.treatment;

export const shippingLabel = ({ fulfillment, area }, orderType) =>
  fulfillment === 'pickup'
    ? `Ongkir (${AREA_LABELS[area] ?? 'pilih area'})`
    : `Ongkir (${wording(orderType).dropoffShort})`;

export const methodText = ({ fulfillment, area }, orderType) =>
  fulfillment === 'pickup'
    ? `${wording(orderType).pickup} · ${AREA_LABELS[area]}`
    : wording(orderType).dropoff;

export const slotText = (code) => {
  const s = SLOTS.find((x) => x.code === code);
  return s ? `${s.label} · ${s.start}–${s.end} WIB` : '';
};

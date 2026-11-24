import { CATALOG, SLOTS } from '@lavestreat/shared';

import { addDays, todayJakarta } from '@/lib/format';

/** Jam sekarang di Asia/Jakarta, "HH:MM". */
const nowJakartaTime = (now) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);

/**
 * Slot yang jam akhirnya sudah lewat pada hari ini tidak bisa dipilih (AC-01.4).
 * @param {string} code kode slot
 * @param {string} date `YYYY-MM-DD`
 */
export function slotPassed(code, date, now = new Date()) {
  const slot = SLOTS.find((s) => s.code === code);
  return Boolean(slot) && date === todayJakarta(now) && slot.end <= nowJakartaTime(now);
}

// Produk (FR-09, P2) belum dikerjakan; form admin hanya layanan dan add-on.
export const ORDERABLE = CATALOG.filter((c) => c.type === 'service' || c.type === 'addon');
const byCode = Object.fromEntries(CATALOG.map((c) => [c.code, c]));
export const MAX_ADVANCE_DAYS = 30;
/** Kunci sesi hasil pesanan publik, agar ID di halaman konfirmasi tidak hilang saat dimuat ulang. */
export const LAST_ORDER_KEY = 'lavestreat:last-order';
export const AREAS = [
  { value: 'sidoarjo', label: 'Sidoarjo' },
  { value: 'surabaya', label: 'Surabaya' },
];
export const AREA_LABELS = Object.fromEntries(AREAS.map((a) => [a.value, a.label]));

export const catalogName = (code) => byCode[code]?.name ?? code;

/**
 * Validasi klien sebelum kirim (cermin aturan server, server tetap memvalidasi ulang).
 * @returns {Record<string, string>} galat per path field
 */
export function validateSchedule(v, now = new Date()) {
  const errors = {};
  if (!v.fulfillment) errors.fulfillment = 'Pilih dijemput kurir atau antar sendiri.';
  if (v.fulfillment === 'pickup') {
    if (!v.area) errors.area = 'Pilih area penjemputan.';
    const len = v.address_text?.trim().length ?? 0;
    if (len < 10 || len > 300) errors.address_text = 'Alamat 10 sampai 300 karakter.';
  }
  const today = todayJakarta(now);
  if (!v.scheduled_date) errors.scheduled_date = 'Pilih tanggal.';
  else if (v.scheduled_date < today) errors.scheduled_date = 'Tanggal tidak boleh di masa lalu.';
  else if (v.scheduled_date > addDays(today, MAX_ADVANCE_DAYS))
    errors.scheduled_date = 'Maksimal 30 hari dari hari ini.';
  if (!v.scheduled_slot) errors.scheduled_slot = 'Pilih slot waktu.';
  else if (slotPassed(v.scheduled_slot, v.scheduled_date, now))
    errors.scheduled_slot = 'Slot ini sudah lewat. Pilih slot lain.';
  return errors;
}

// BR-06: 08…, 628…, +628…, boleh berspasi atau bertanda hubung, 10–15 digit.
const PHONE = /^(\+?62|0)8\d{7,12}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Data pemesan form publik (AC-01.3). Kunci galat memakai path body API (`customer.phone`).
 * @param {{ name: string, phone: string, email: string, customer_notes: string }} v
 */
export function validateCustomer(v) {
  const errors = {};
  const name = v.name.trim().length;
  if (name < 2 || name > 80) errors['customer.name'] = 'Nama minimal 2 karakter.';
  if (!PHONE.test(v.phone.replace(/[\s-]/g, '')))
    errors['customer.phone'] = 'Nomor WhatsApp tidak valid. Contoh: 081200000000';
  if (v.email.trim() && !EMAIL.test(v.email.trim()))
    errors['customer.email'] = 'Format email tidak valid.';
  if (v.customer_notes.length > 500) errors.customer_notes = 'Catatan maksimal 500 karakter.';
  return errors;
}

/**
 * Jenis pesanan publik: tanpa baris layanan berarti beli produk saja (FR-09, AC-09.2).
 * @param {Record<string, number>} qty
 * @returns {'treatment'|'product_only'}
 */
export const orderTypeOf = (qty) =>
  Object.entries(qty).some(([code, n]) => n > 0 && byCode[code]?.type === 'service')
    ? 'treatment'
    : 'product_only';

/**
 * Item form publik dalam bentuk `{ [catalog_code]: qty }` (BR-02, AC-01.1). Pesan pertama yang
 * melanggar dikembalikan, atau `null` bila valid.
 * @param {Record<string, number>} qty
 * @returns {string|null}
 */
export function publicItemsError(qty) {
  const picked = Object.entries(qty).filter(([, n]) => n > 0);
  if (!picked.length) return 'Pilih minimal satu layanan atau produk.';
  const sum = (type) =>
    picked.filter(([code]) => byCode[code]?.type === type).reduce((s, [, n]) => s + n, 0);
  const pairs = sum('service');
  // Tanpa layanan, hanya produk yang boleh (FR-09 `product_only`); add-on butuh layanan.
  if (!pairs && sum('addon')) return 'Add-on hanya bisa dipesan bersama layanan cuci.';
  if (picked.some(([code, n]) => byCode[code]?.type === 'addon' && n > pairs))
    return 'Jumlah add-on tidak boleh melebihi jumlah pasang layanan.';
  if (qty.EXPRESS > 0 && qty.FASTTRACK > 0)
    return 'Express Clean dan Fast Track tidak bisa dipilih bersamaan.';
  return null;
}

export function validateItems(items) {
  const errors = {};
  if (!items.length) errors.items = 'Tambahkan minimal satu item.';
  items.forEach((it, i) => {
    if (!it.catalog_code) errors[`items[${i}].catalog_code`] = 'Pilih layanan.';
  });
  if (items.length && !items.some((it) => byCode[it.catalog_code]?.type === 'service'))
    errors.items = 'Pilih minimal satu layanan cuci, tambahan tidak bisa dipesan sendiri.';
  return errors;
}

export const toItemsBody = (items) => items.map(({ catalog_code, qty }) => ({ catalog_code, qty }));

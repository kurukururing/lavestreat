import { CATALOG } from '@lavestreat/shared';

import { addDays, todayJakarta } from '@/lib/format';

// Produk (FR-09, P2) belum dikerjakan; form admin hanya layanan dan add-on.
export const ORDERABLE = CATALOG.filter((c) => c.type === 'service' || c.type === 'addon');
const byCode = Object.fromEntries(CATALOG.map((c) => [c.code, c]));
export const MAX_ADVANCE_DAYS = 30;
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
export function validateSchedule(v) {
  const errors = {};
  if (!v.fulfillment) errors.fulfillment = 'Pilih dijemput kurir atau antar sendiri.';
  if (v.fulfillment === 'pickup') {
    if (!v.area) errors.area = 'Pilih area penjemputan.';
    const len = v.address_text?.trim().length ?? 0;
    if (len < 10 || len > 300) errors.address_text = 'Alamat 10 sampai 300 karakter.';
  }
  const today = todayJakarta();
  if (!v.scheduled_date) errors.scheduled_date = 'Pilih tanggal.';
  else if (v.scheduled_date < today) errors.scheduled_date = 'Tanggal tidak boleh di masa lalu.';
  else if (v.scheduled_date > addDays(today, MAX_ADVANCE_DAYS))
    errors.scheduled_date = 'Maksimal 30 hari dari hari ini.';
  if (!v.scheduled_slot) errors.scheduled_slot = 'Pilih slot waktu.';
  return errors;
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

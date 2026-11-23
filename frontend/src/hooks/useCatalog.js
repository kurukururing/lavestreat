import { useEffect, useSyncExternalStore } from 'react';

import { getCatalog } from '@/api/public';

// Satu permintaan PUB-01 dipakai bersama semua komponen di halaman, dan "Coba lagi" dari
// komponen mana pun memperbarui semuanya. Hasil sukses disimpan selama sesi halaman.
let state = { data: null, error: null, loading: false };
const listeners = new Set();
const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const set = (next) => {
  state = next;
  listeners.forEach((fn) => fn());
};

function load() {
  if (state.data || state.loading) return;
  set({ data: null, error: null, loading: true });
  getCatalog().then(
    (data) => set({ data, error: null, loading: false }),
    (error) => set({ data: null, error, loading: false }),
  );
}

/**
 * Katalog publik dari `GET /api/public/catalog` (PRD PG-7). Harga dan ongkir selalu dari server.
 * Nilai turunan bernilai `undefined` selama memuat (placeholder) dan `null` setelah galat ("—").
 */
export function useCatalog() {
  const { data, error, loading } = useSyncExternalStore(subscribe, () => state);
  // Halaman baru setelah galat ikut mencoba lagi; `load` menolak permintaan ganda.
  useEffect(load, []);

  const items = data?.items ?? [];
  const services = items.filter((i) => i.type === 'service');
  const ready = (value) => (data ? value : error ? null : undefined);
  const price = (code) => ready(items.find((i) => i.code === code)?.price_idr ?? null);
  return {
    loading,
    error,
    reload: load,
    /** Harga per pasang/botol; `null` juga untuk item yang tidak aktif. */
    price,
    /** Harga × jumlah, tetap `undefined`/`null` bila harga belum ada. */
    lineTotal: (code, qty) => {
      const p = price(code);
      return p == null ? p : p * qty;
    },
    minPrice: ready(Math.min(...services.map((i) => i.price_idr))),
    serviceCount: ready(services.length),
    /** Ongkir per area (BR-03), contoh `shipping('sidoarjo')`. */
    shipping: (area) => ready(data?.shipping[area] ?? null),
  };
}

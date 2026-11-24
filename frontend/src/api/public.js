import { api } from './client';

// Pemanggil endpoint publik (API.md Bagian 3). Komponen tidak memanggil Axios langsung.

const data = (promise) => promise.then((res) => res.data);

/** PUB-01: katalog aktif, ongkir, slot, dan `max_advance_days`. */
export const getCatalog = () => data(api.get('/public/catalog'));

/**
 * PUB-02: kirim pesanan. Tanpa foto JSON; dengan foto multipart `data` + `files[]`.
 * `key` dibuat baru oleh pemanggil untuk setiap percobaan pengiriman (AC-01.6).
 * @param {object} body field sesuai API.md PUB-02, tanpa field uang
 * @param {File[]} files foto yang sudah diperkecil (≤ 3)
 * @param {string} key Idempotency-Key
 */
export function createOrder(body, files, key) {
  const headers = { 'Idempotency-Key': key };
  if (!files.length) return data(api.post('/public/orders', body, { headers }));
  const form = new FormData();
  form.append('data', JSON.stringify(body));
  files.forEach((f) => form.append('files[]', f, f.name));
  return data(api.post('/public/orders', form, { headers }));
}

/** PUB-03: data lacak pesanan (DTO publik tanpa kontak dan alamat). */
export const getPublicOrder = (code) => data(api.get(`/public/orders/${encodeURIComponent(code)}`));

/** PUB-05: nota PDF, hanya tersedia saat status `done` atau `completed`. */
export const fetchPublicInvoice = (code) =>
  data(api.get(`/public/orders/${encodeURIComponent(code)}/invoice`, { responseType: 'blob' }));

import { api } from './client';

// Pemanggil endpoint admin (API.md Bagian 4–10). Komponen tidak memanggil Axios langsung.

const data = (promise) => promise.then((res) => res.data);

export const login = (body) => data(api.post('/admin/auth/login', body));
export const logout = () => data(api.post('/admin/auth/logout'));
export const getMe = () => data(api.get('/admin/auth/me'));

/** ADM-04. `params`: `{ status?, q?, page?, page_size? }`. */
export const listOrders = (params) => data(api.get('/admin/orders', { params }));
export const createOrder = (body) => data(api.post('/admin/orders', body));
export const getOrder = (id) => data(api.get(`/admin/orders/${id}`));
export const updateOrder = (id, body) => data(api.patch(`/admin/orders/${id}`, body));
export const confirmOrder = (id, body) => data(api.post(`/admin/orders/${id}/confirm`, body));
export const changeStatus = (id, body) => data(api.post(`/admin/orders/${id}/status`, body));

/** ADM-10: hitung ulang estimasi AI, mengembalikan `updated_at` baru. */
export const estimateOrder = (id) => data(api.post(`/admin/orders/${id}/estimate`));
/** ADM-11: pratinjau estimasi form manual, tidak menyimpan apa pun. */
export const previewEstimate = (body) => data(api.post('/admin/orders/estimate', body));
export const parseChat = (text) => data(api.post('/admin/orders/parse-chat', { text }));

/** ADM-12: satu berkas per permintaan agar status per berkas jelas (EC-15). */
export function uploadPhoto(id, kind, file, onProgress) {
  const form = new FormData();
  form.append('kind', kind);
  form.append('files[]', file, file.name);
  return data(
    api.post(`/admin/orders/${id}/photos`, form, {
      onUploadProgress: (e) => e.total && onProgress?.((e.loaded / e.total) * 100),
    }),
  );
}
export const deletePhoto = (id, photoId) => api.delete(`/admin/orders/${id}/photos/${photoId}`);
/** ADM-14: URL relatif, dibaca lewat cookie sesi. */
export const photoUrl = (id, photoId) => `/api/admin/orders/${id}/photos/${photoId}`;

/**
 * ADM-15: unduh PDF nota. `warnings` dari header `X-Invoice-Warning` (AC-03.5).
 * @returns {Promise<{ blob: Blob, warnings: string[] }>}
 */
export async function fetchInvoice(id) {
  const res = await api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' });
  const header = res.headers['x-invoice-warning'] ?? '';
  return { blob: res.data, warnings: header.split(',').filter(Boolean) };
}

export const createAftercare = (id) => data(api.post(`/admin/orders/${id}/aftercare`));
export const markAftercareCopied = (draftId, body) =>
  data(api.patch(`/admin/aftercare/${draftId}`, body));

export const listCustomers = (params) => data(api.get('/admin/customers', { params }));
export const getCustomer = (id) => data(api.get(`/admin/customers/${id}`));

/** ADM-21. `params`: `{ from, to, service? }`. */
export const getDashboard = (params) => data(api.get('/admin/dashboard', { params }));

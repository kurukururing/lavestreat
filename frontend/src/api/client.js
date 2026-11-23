import axios from 'axios';

/**
 * Satu instance Axios untuk seluruh aplikasi (TECH_STACK 4). Satu origin, jadi `baseURL` relatif
 * dan tanpa `withCredentials`: cookie sesi selalu terkirim (AGENTS 6.3).
 */
export const api = axios.create({ baseURL: '/api', timeout: 20000 });

const RETRYABLE_STATUS = [502, 504];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Event global saat sesi admin berakhir (401), ditangkap AuthProvider. */
export const AUTH_EXPIRED_EVENT = 'lavestreat:auth-expired';

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    // Satu percobaan ulang otomatis saat server masih bangun (cold start Render, NFR-04).
    const retryable = !response || RETRYABLE_STATUS.includes(response.status);
    if (config && retryable && !config.__retried && config.method === 'get') {
      config.__retried = true;
      await wait(1500);
      return api(config);
    }
    const url = config?.url ?? '';
    const isAuthProbe = url.endsWith('/auth/login') || url.endsWith('/auth/me');
    if (response?.status === 401 && url.startsWith('/admin') && !isAuthProbe) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Kode galat seragam API 1.2 (`VALIDATION_ERROR`, `CONFLICT`, …) atau `NETWORK`. */
export function errorCode(error) {
  return error?.response?.data?.error?.code ?? (error?.response ? 'INTERNAL' : 'NETWORK');
}

/**
 * Pesan galat untuk pengguna. Pesan server sudah berbahasa Indonesia dan aman ditampilkan (NFR-07).
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function errorMessage(error, fallback = 'Terjadi kesalahan. Coba lagi.') {
  if (errorCode(error) === 'NETWORK') return 'Tidak dapat terhubung ke server. Periksa koneksi.';
  return error?.response?.data?.error?.message ?? fallback;
}

/**
 * Galat per field dari `details[]` (path penuh, API 1.2) menjadi `{ 'customer.phone': 'pesan' }`.
 * @param {unknown} error
 * @returns {Record<string, string>}
 */
export function fieldErrors(error) {
  const details = error?.response?.data?.error?.details ?? [];
  return Object.fromEntries(details.map((d) => [d.field, d.message]));
}

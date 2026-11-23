import { api } from './client';

// Pemanggil endpoint publik (API.md Bagian 3). Komponen tidak memanggil Axios langsung.

const data = (promise) => promise.then((res) => res.data);

/** PUB-01: katalog aktif, ongkir, slot, dan `max_advance_days`. */
export const getCatalog = () => data(api.get('/public/catalog'));

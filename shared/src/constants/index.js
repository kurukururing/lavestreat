/** Nilai enum `order_status` (DATABASE.md Bagian 2). */
export const ORDER_STATUSES = [
  'pending_confirmation',
  'received',
  'processing',
  'done',
  'completed',
  'cancelled',
];

/** Label tampilan BR-08. Ingat: `done` = "Selesai", `completed` = "Diambil/Diantar". */
export const STATUS_LABELS = {
  pending_confirmation: 'Menunggu konfirmasi',
  received: 'Diterima',
  processing: 'Diproses',
  done: 'Selesai',
  completed: 'Diambil/Diantar',
  cancelled: 'Dibatalkan',
};

/** Alfabet ID pesanan BR-07 (tanpa I, L, O, 0, 1). */
export const ORDER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Panjang bagian acak ID `LS-XXXXXXXX` (Q-07). `orders.code` = char(11). */
export const ORDER_CODE_LENGTH = 8;

/** Slot jadwal BR-05 (DATABASE.md, nilai `scheduled_slot`). Jam dalam WIB. */
export const SLOTS = [
  { code: 'morning', label: 'PAGI', start: '09:00', end: '12:00' },
  { code: 'noon', label: 'SIANG', start: '13:00', end: '16:00' },
  { code: 'evening', label: 'SORE', start: '16:00', end: '19:00' },
];

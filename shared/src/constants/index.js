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

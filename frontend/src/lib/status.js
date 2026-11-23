import { BadgeCheck, CircleX, ClipboardCheck, Clock, Droplets, PackageCheck } from 'lucide-react';

// Warna dan ikon per status (DESIGN 2.3, Figma StatusBadge 6:124). Label dari BR-08 di shared.
export const STATUS_STYLES = {
  pending_confirmation: { icon: Clock, className: 'bg-status-pending-bg text-status-pending-fg' },
  received: { icon: ClipboardCheck, className: 'bg-status-received-bg text-status-received-fg' },
  processing: { icon: Droplets, className: 'bg-status-processing-bg text-status-processing-fg' },
  done: { icon: BadgeCheck, className: 'bg-status-done-bg text-status-done-fg' },
  completed: { icon: PackageCheck, className: 'bg-status-completed-bg text-status-completed-fg' },
  cancelled: { icon: CircleX, className: 'bg-status-cancelled-bg text-status-cancelled-fg' },
};

/** Aksi maju per status (API ADM-09). `pending_confirmation` maju hanya lewat /confirm. */
export const NEXT_STATUS = {
  received: { to: 'processing', label: 'Tandai Diproses' },
  processing: { to: 'done', label: 'Tandai Selesai' },
  done: { to: 'completed', label: 'Tandai Diambil/Diantar' },
};

/** Koreksi mundur satu langkah, wajib catatan. Tidak ada mundur ke `pending_confirmation`. */
export const PREV_STATUS = { processing: 'received', done: 'processing' };

export const CANCELLABLE = ['pending_confirmation', 'received', 'processing', 'done'];

/** Status akhir: tidak ada perubahan status, item, atau foto (AC-02.7, AC-03.3). */
export const isFinal = (status) => status === 'completed' || status === 'cancelled';

/** Item, jadwal, dan alamat hanya dapat diubah sebelum Diproses (AC-02.7). */
export const isEditable = (status) => status === 'pending_confirmation' || status === 'received';

export const SOURCE_LABELS = {
  public: 'dari portal publik',
  admin_manual: 'dibuat manual',
  admin_ai_chat: 'dibuat dari chat',
};

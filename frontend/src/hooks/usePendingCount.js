import { useEffect, useState } from 'react';

import { listOrders } from '@/api/admin';

const POLL_MS = 30_000;

/** Dikirim halaman setelah status pesanan berubah agar badge langsung diperbarui. */
export const ORDERS_CHANGED_EVENT = 'lavestreat:orders-changed';
export const notifyOrdersChanged = () => window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));

/**
 * Jumlah pesanan "Menunggu konfirmasi" untuk badge sidebar, diperbarui tiap 30 detik (AC-02.3).
 * Tidak ada endpoint khusus: ADM-04 dengan `page_size=1` lalu baca `total`.
 * @param {boolean} enabled hanya berjalan saat pemilik sudah masuk
 */
export function usePendingCount(enabled) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const load = () =>
      listOrders({ status: 'pending_confirmation', page_size: 1 })
        .then((res) => active && setCount(res.total))
        .catch(() => {}); // badge bukan data penting; galat cukup diabaikan sampai polling berikutnya
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener(ORDERS_CHANGED_EVENT, load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener(ORDERS_CHANGED_EVENT, load);
    };
  }, [enabled]);

  return count;
}

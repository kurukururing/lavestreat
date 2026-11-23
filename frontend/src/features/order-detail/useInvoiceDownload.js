import { useState } from 'react';
import { toast } from 'sonner';

import { fetchInvoice } from '@/api/admin';
import { errorMessage } from '@/api/client';

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Unduh nota PDF (ADM-15). Bila header `X-Invoice-Warning` ada, berkas ditahan dulu dan
 * `warnings` diisi agar halaman menampilkan konfirmasi (AC-03.5).
 */
export function useInvoiceDownload(order) {
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null);

  const filename = `nota-${order?.code}.pdf`;

  async function download() {
    setLoading(true);
    try {
      const { blob, warnings } = await fetchInvoice(order.id);
      if (warnings.length) setPending({ blob, warnings });
      else {
        saveBlob(blob, filename);
        toast.success('Nota diunduh.');
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Nota gagal dibuat. Coba lagi.'));
    } finally {
      setLoading(false);
    }
  }

  function confirm() {
    saveBlob(pending.blob, filename);
    setPending(null);
    toast.success('Nota diunduh.');
  }

  return {
    loading,
    download,
    warnings: pending?.warnings ?? null,
    confirm,
    dismiss: () => setPending(null),
  };
}

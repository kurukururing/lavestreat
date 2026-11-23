import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

/**
 * Tombol salin (DESIGN 6.7, Figma CopyButton 4:202). Setelah berhasil: "Disalin" + ikon centang
 * selama 2 detik, diumumkan lewat aria-live. Gagal menyalin memberi toast galat (aksi tidak diam).
 */
function CopyButton({ text, label = 'Salin', className }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      toast.error('Gagal menyalin. Salin secara manual.');
    }
  }

  return (
    <Button variant="secondary" onClick={handleCopy} className={className}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Disalin' : label}</span>
    </Button>
  );
}

export { CopyButton };

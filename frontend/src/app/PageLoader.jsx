import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Indikator proses saat halaman atau sesi dimuat (NFR-06). */
export function PageLoader({ fullscreen = false, label = 'Memuat…' }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 text-sm text-muted-foreground',
        fullscreen ? 'min-h-dvh bg-background' : 'py-16',
      )}
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

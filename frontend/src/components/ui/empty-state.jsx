import { CircleAlert, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Figma "EmptyState" (6:385): ikon dalam lingkaran, judul h3, satu kalimat, aksi opsional.
function EmptyState({
  icon: Icon = CircleAlert,
  title,
  description,
  action,
  tone = 'default',
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-10 text-center', className)}>
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full',
          tone === 'danger' ? 'bg-danger-bg text-danger' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-h3">{title}</h3>
      {description && <p className="max-w-80 text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/** Galat layanan (server tidur, koneksi putus) dengan tombol "Coba lagi" (PRD 8.3). */
function ErrorState({
  title = 'Layanan sedang tidak tersedia',
  description = 'Server mungkin sedang bangun. Tunggu sebentar lalu coba lagi.',
  onRetry,
  retrying = false,
  className,
}) {
  return (
    <div role="alert">
      <EmptyState
        tone="danger"
        title={title}
        description={description}
        className={className}
        action={
          onRetry && (
            <Button variant="secondary" onClick={onRetry} loading={retrying} loadingText="Mencoba…">
              <RefreshCw aria-hidden="true" />
              Coba lagi
            </Button>
          )
        }
      />
    </div>
  );
}

export { EmptyState, ErrorState };

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function PublicSkeleton() {
  return (
    // min-h-dvh: footer tetap di bawah layar selama memuat, jadi tidak bergeser (CLS) saat isi datang.
    <div className="mx-auto flex min-h-dvh w-full max-w-312 flex-col gap-6 px-4 py-8 lg:px-6 lg:py-12">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
            <Skeleton className="h-27.5 w-full lg:h-37.5" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-lg lg:col-span-2" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}

const VARIANTS = { public: PublicSkeleton, admin: AdminSkeleton, blank: () => null };

/**
 * Kerangka (skeleton) saat halaman atau data dimuat (NFR-06, DESIGN 6). Muncul setelah jeda singkat
 * (`animate-loader-in`) agar tidak berkedip bila potongan halaman sudah di cache.
 * @param {{ variant?: 'public'|'admin'|'blank', fullscreen?: boolean, label?: string }} props
 */
export function PageLoader({ variant = 'public', fullscreen = false, label = 'Memuat…' }) {
  const Shape = VARIANTS[variant];
  return (
    <div
      role="status"
      // Fullscreen tanpa kerangka admin: padding sama dengan <main> AdminLayout.
      className={cn(
        'animate-loader-in',
        fullscreen && 'min-h-dvh bg-background px-4 py-5 md:px-6 md:py-6',
      )}
    >
      <span className="sr-only">{label}</span>
      {/* Bilah proses tipis di tepi atas layar; ikut tertunda 150 ms bersama kerangka. */}
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
        <div className="h-full w-1/3 animate-loading-bar bg-brand-500" />
      </div>
      <Shape />
    </div>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

const pageBtn =
  'flex size-11 shrink-0 items-center justify-center rounded-full border text-base font-medium transition-colors outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50';

/**
 * Pagination antrean (Figma PageButton 7:247): tombol 44 × 44, aktif berisi primary.
 * Di ponsel nomor halaman disembunyikan, diganti teks "Halaman 1 dari 3".
 */
function Pagination({ page, totalPages, onPageChange, summary, className }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav aria-label="Halaman" className={cn('flex items-center justify-between gap-3', className)}>
      <p className="hidden text-sm text-muted-foreground md:block">{summary}</p>
      <div className="flex w-full items-center justify-between gap-2 md:w-auto">
        <button
          type="button"
          className={cn(pageBtn, 'border-border bg-card hover:bg-muted')}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <p className="text-sm text-muted-foreground md:hidden">
          Halaman {page} dari {totalPages}
        </p>
        <ul className="hidden items-center gap-2 md:flex">
          {pages.map((n) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => onPageChange(n)}
                aria-current={n === page ? 'page' : undefined}
                className={cn(
                  pageBtn,
                  n === page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-muted',
                )}
              >
                {n}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={cn(pageBtn, 'border-border bg-card hover:bg-muted')}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export { Pagination };

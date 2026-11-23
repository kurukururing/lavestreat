import { Link, useSearchParams } from 'react-router';
import { Inbox, Plus, X } from 'lucide-react';
import { ORDER_STATUSES, STATUS_LABELS } from '@lavestreat/shared';

import { listOrders } from '@/api/admin';
import { PageHeader } from '@/components/layout/AdminLayout';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/chip';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderList } from '@/features/order-queue/OrderList';
import { useApi } from '@/hooks/useApi';
import { usePendingCount } from '@/hooks/usePendingCount';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

/** AD-3 Antrean pesanan (Figma 36:463 desktop, 50:1994 mobile; AC-02.2, AC-02.3). */
export function OrderQueuePage() {
  const [params, setParams] = useSearchParams();
  const status = ORDER_STATUSES.includes(params.get('status')) ? params.get('status') : null;
  const q = params.get('q')?.trim() || null;
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const pending = usePendingCount(true);

  const { data, error, loading, reload } = useApi(
    () =>
      listOrders({ status: status ?? undefined, q: q ?? undefined, page, page_size: PAGE_SIZE }),
    [status, q, page],
  );

  function update(next) {
    const merged = { status, q, page, ...next };
    const out = new URLSearchParams();
    if (merged.status) out.set('status', merged.status);
    if (merged.q) out.set('q', merged.q);
    if (merged.page > 1) out.set('page', String(merged.page));
    setParams(out);
  }

  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1;
  const from = data && data.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  return (
    <>
      <PageHeader
        title="Antrean pesanan"
        nowrap
        subtitle={
          data
            ? `${data.total} pesanan${status ? ` ${STATUS_LABELS[status].toLowerCase()}` : ''}${pending == null ? '' : ` · ${pending} menunggu konfirmasi`}`
            : ' '
        }
        actions={
          <Link to="/admin/pesanan/baru" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            <span className="sm:hidden">Baru</span>
            <span className="hidden sm:inline">Pesanan baru</span>
          </Link>
        }
      />

      <div
        className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
        role="group"
        aria-label="Filter status"
      >
        <FilterChip selected={!status} onClick={() => update({ status: null, page: 1 })}>
          Semua
        </FilterChip>
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s}
            selected={status === s}
            onClick={() => update({ status: s, page: 1 })}
          >
            {STATUS_LABELS[s]}
            {s === 'pending_confirmation' && pending != null && ` (${pending})`}
          </FilterChip>
        ))}
      </div>

      {q && (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          Hasil pencarian <strong className="font-semibold">“{q}”</strong>
          <button
            type="button"
            onClick={() => update({ q: null, page: 1 })}
            className="flex h-11 items-center gap-1 rounded-full px-3 font-medium text-accent-foreground outline-none hover:bg-muted focus-visible:focus-ring"
          >
            <X className="size-4" aria-hidden="true" />
            Hapus pencarian
          </button>
        </p>
      )}

      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Memuat antrean">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title={q || status ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}
            description={
              q || status
                ? 'Ubah filter atau kata pencarian.'
                : 'Pesanan dari pembeli atau yang dibuat manual akan muncul di sini.'
            }
          />
        </Card>
      ) : (
        <div className={cn('flex flex-col gap-4 transition-opacity', loading && 'opacity-60')}>
          <OrderList
            orders={data.data}
            getHref={(o) => `/admin/pesanan/${o.id}`}
            LinkComponent={Link}
            className="md:overflow-hidden md:rounded-lg md:border md:border-border md:bg-card md:shadow-xs"
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => update({ page: p })}
            summary={`Menampilkan ${from}–${to} dari ${data.total} pesanan`}
          />
        </div>
      )}
    </>
  );
}

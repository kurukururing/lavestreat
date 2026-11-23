import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Users } from 'lucide-react';

import { listCustomers } from '@/api/admin';
import { PageHeader } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SearchField } from '@/components/ui/search-field';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatPhone } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

function OrdersChip({ count }) {
  return (
    <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-accent-foreground">
      {count} pesanan
    </span>
  );
}

/** AD-7 Pelanggan (Figma 41:1789, AC-02.8). Pelanggan dikenali dari nomor WhatsApp. */
export function CustomersPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() || '';
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const [draft, setDraft] = useState(q);

  const { data, error, loading, reload } = useApi(
    () => listCustomers({ q: q || undefined, page, page_size: PAGE_SIZE }),
    [q, page],
  );

  function go(next) {
    const out = new URLSearchParams();
    if (next.q) out.set('q', next.q);
    if (next.page > 1) out.set('page', String(next.page));
    setParams(out);
  }

  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1;
  const from = data?.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? Math.min(page * PAGE_SIZE, data.total) : 0;

  return (
    <>
      <PageHeader
        title="Pelanggan"
        subtitle={data ? `${data.total} pelanggan · dikenali dari nomor WhatsApp` : ' '}
      />
      <form
        role="search"
        className="mb-4 md:max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: draft.trim(), page: 1 });
        }}
      >
        <SearchField
          label="Cari pelanggan"
          placeholder="Cari nama atau nomor WhatsApp…"
          maxLength={80}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (!e.target.value) go({ q: '', page: 1 });
          }}
          className="bg-card"
        />
      </form>

      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Memuat pelanggan">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={q ? 'Pelanggan tidak ditemukan' : 'Belum ada pelanggan'}
            description={
              q ? 'Coba nama atau nomor lain.' : 'Pelanggan tercatat otomatis dari pesanan.'
            }
          />
        </Card>
      ) : (
        <div className={cn('flex flex-col gap-4 transition-opacity', loading && 'opacity-60')}>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-xs md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="h-10 bg-accent text-left text-xs font-medium tracking-[0.06em] text-brand-900 uppercase">
                  <th scope="col" className="px-4 font-medium">
                    Pelanggan
                  </th>
                  <th scope="col" className="px-4 font-medium">
                    WhatsApp
                  </th>
                  <th scope="col" className="px-4 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-4 font-medium">
                    Pesanan
                  </th>
                  <th scope="col" className="px-4 font-medium">
                    Pelanggan sejak
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr
                    key={c.id}
                    className="h-14 border-b border-border last:border-0 hover:bg-accent"
                  >
                    <td className="px-4">
                      <span className="flex items-center gap-3">
                        <Avatar name={c.name} size="sm" />
                        <Link
                          to={`/admin/pelanggan/${c.id}`}
                          className="rounded-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:focus-ring"
                        >
                          {c.name}
                        </Link>
                      </span>
                    </td>
                    <td className="px-4 whitespace-nowrap">{formatPhone(c.phone)}</td>
                    <td className="px-4 text-muted-foreground">{c.email ?? '—'}</td>
                    <td className="px-4">
                      <OrdersChip count={c.orders_count} />
                    </td>
                    <td className="px-4 whitespace-nowrap">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {data.data.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/pelanggan/${c.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 outline-none hover:bg-muted focus-visible:focus-ring"
                >
                  <Avatar name={c.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">{formatPhone(c.phone)}</span>
                  </span>
                  <OrdersChip count={c.orders_count} />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => go({ q, page: p })}
            summary={`Menampilkan ${from}–${to} dari ${data.total} pelanggan`}
          />
        </div>
      )}
    </>
  );
}

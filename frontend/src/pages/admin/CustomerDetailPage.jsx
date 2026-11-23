import { Link, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, Mail, Phone } from 'lucide-react';

import { getCustomer } from '@/api/admin';
import { errorCode } from '@/api/client';
import { PageLoader } from '@/app/PageLoader';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatPhone, formatRupiah } from '@/lib/format';

function ContactRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

/** AD-7 Detail pelanggan (Figma 45:2282, ADM-20). */
export function CustomerDetailPage() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApi(() => getCustomer(id), [id]);

  if (error) {
    return (
      <Card>
        {errorCode(error) === 'NOT_FOUND' ? (
          <EmptyState title="Pelanggan tidak ditemukan" description="Periksa kembali tautan." />
        ) : (
          <ErrorState onRetry={reload} />
        )}
      </Card>
    );
  }
  if (loading || !data) return <PageLoader />;

  const orders = [...data.orders].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <div className="mb-5">
        <Link
          to="/admin/pelanggan"
          className="mb-2 inline-flex h-11 items-center gap-1.5 rounded-sm text-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:focus-ring max-lg:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Pelanggan
        </Link>
        <h1 className="text-h1 lg:text-h1-lg">{data.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kontak dan seluruh riwayat pesanan</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={data.name} size="lg" />
            <div className="min-w-0">
              <h2 className="font-heading text-h3">{data.name}</h2>
              <p className="text-xs text-muted-foreground">Nama dari pesanan terbaru</p>
            </div>
          </div>
          <dl className="flex flex-col gap-3">
            <ContactRow icon={Phone} label="WhatsApp">
              {formatPhone(data.phone)}
            </ContactRow>
            <ContactRow icon={Mail} label="Email">
              {data.email ?? 'Tidak diisi'}
            </ContactRow>
            <ContactRow icon={CalendarDays} label="Pelanggan sejak">
              {formatDate(data.created_at)}
            </ContactRow>
          </dl>
          <p className="flex items-center justify-between rounded-md bg-accent px-4 py-3 text-accent-foreground">
            <span className="text-sm font-medium">Total pesanan</span>
            <span className="text-h2 font-semibold">{orders.length}</span>
          </p>
        </Card>

        <Card className="flex flex-col gap-4">
          <CardTitle>Riwayat pesanan</CardTitle>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <>
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="h-10 bg-accent text-left text-xs font-medium tracking-[0.06em] text-brand-900 uppercase">
                    <th scope="col" className="rounded-l-md px-3 font-medium">
                      ID
                    </th>
                    <th scope="col" className="px-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-3 font-medium">
                      Tanggal jadwal
                    </th>
                    <th scope="col" className="rounded-r-md px-3 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="h-14 border-b border-border last:border-0">
                      <td className="px-3">
                        <Link
                          to={`/admin/pesanan/${o.id}`}
                          className="rounded-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:focus-ring"
                        >
                          {o.code}
                        </Link>
                      </td>
                      <td className="px-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-3">{formatDate(o.scheduled_date)}</td>
                      <td className="px-3 text-right">{formatRupiah(o.total_idr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="flex flex-col divide-y divide-border md:hidden">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/admin/pesanan/${o.id}`}
                      className="flex flex-col gap-1.5 rounded-sm py-3 outline-none focus-visible:focus-ring"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-accent-foreground">{o.code}</span>
                        <StatusBadge status={o.status} />
                      </span>
                      <span className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatDate(o.scheduled_date)}
                        </span>
                        <span className="font-medium">{formatRupiah(o.total_idr)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}

import { CalendarDays, CircleCheck, Search } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router';

import { Container } from '@/components/layout/PublicLayout';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { SummaryDivider, SummaryList, SummaryRow } from '@/components/ui/summary-list';
import { LAST_ORDER_KEY } from '@/features/order-form/order-form';
import { InfoRow } from '@/features/order-form/PublicOrderSteps';
import { methodText } from '@/features/order-form/public-order';
import { Money } from '@/features/public/Money';
import { formatDateLongWeekday, formatSlot } from '@/lib/format';
import { cn } from '@/lib/utils';

function readLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) ?? 'null');
  } catch {
    return null;
  }
}

/** PG-3 Konfirmasi pesanan (`/pesan/selesai`, Figma 90:4658). Total dari respons server. */
export function OrderDonePage() {
  const { state } = useLocation();
  // Muat ulang halaman tetap menampilkan ID dari sesi agar pembeli tidak kehilangan kuncinya.
  const summary = state?.order ? state : readLastOrder();
  if (!summary?.order) return <Navigate to="/pesan" replace />;
  const { order, lines, method, order_type, scheduled_date, scheduled_slot } = summary;

  return (
    <Container className="grid items-start gap-6 pt-8 pb-16 lg:grid-cols-[1fr_440px] lg:gap-8 lg:pt-12 lg:pb-24">
      <section
        aria-labelledby="judul-terkirim"
        className="flex flex-col items-center gap-4 rounded-xl border border-border bg-brand-50 px-4 py-10 text-center sm:px-4 lg:py-12"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-success-bg text-success">
          <CircleCheck className="size-8" aria-hidden="true" />
        </span>
        <h1 id="judul-terkirim" className="text-h1 text-brand-900 lg:text-h1-lg">
          Pesanan terkirim
        </h1>
        <p className="text-base text-muted-foreground">
          Pemilik akan memeriksa dan mengonfirmasi pesanan Anda.
        </p>

        <div className="mt-2 w-full rounded-lg bg-card text-left shadow-md">
          <div className="flex flex-col items-center gap-3 px-4 pt-5 pb-6">
            <p className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
              ID pesanan
            </p>
            <p className="font-heading text-[2rem] leading-10 font-bold tracking-tight break-all text-brand-900">
              {order.code}
            </p>
            <CopyButton text={order.code} label="Salin" />
          </div>
          {/* Sobekan tiket: garis putus-putus dengan dua takik setengah lingkaran. */}
          <div aria-hidden="true" className="relative h-4">
            <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-brand-50" />
            <span className="absolute top-1/2 right-4 left-4 border-t-2 border-dashed border-border" />
            <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-brand-50" />
          </div>
          <div className="flex flex-col gap-3 px-4 pt-3 pb-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={order.status} />
            </div>
            <Alert type="warning">Simpan ID ini. Anda membutuhkannya untuk melacak pesanan.</Alert>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <section
          aria-labelledby="judul-ringkasan"
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
        >
          <h2 id="judul-ringkasan" className="font-heading text-h3 text-brand-900">
            Ringkasan
          </h2>
          <SummaryList>
            {lines.map((l) => (
              <SummaryRow
                key={l.code}
                label={`${l.name} × ${l.qty}`}
                value={<Money value={typeof l.price === 'number' ? l.price * l.qty : null} />}
              />
            ))}
            <SummaryRow label="Ongkir" value={<Money value={order.shipping_idr} />} />
            <SummaryDivider />
            <SummaryRow label="Total" value={<Money value={order.total_idr} />} emphasis />
          </SummaryList>
          <InfoRow icon={CalendarDays} sub={methodText(method, order_type)}>
            {formatDateLongWeekday(scheduled_date)} · {formatSlot(scheduled_slot)}
          </InfoRow>
        </section>
        <Link to={`/lacak?id=${order.code}`} className={cn(buttonVariants(), 'w-full')}>
          <Search aria-hidden="true" />
          Lacak Pesanan
        </Link>
        <Link to="/" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
          Kembali ke beranda
        </Link>
      </div>
    </Container>
  );
}

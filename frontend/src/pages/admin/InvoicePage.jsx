import { Link, useParams } from 'react-router';
import { ArrowLeft, CircleCheck, CircleDashed, Download } from 'lucide-react';

import { getOrder, photoUrl } from '@/api/admin';
import { errorCode } from '@/api/client';
import { PageLoader } from '@/app/PageLoader';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { PhotoSlot } from '@/components/ui/photo-upload';
import { MissingPhotoDialog } from '@/features/order-detail/DetailDialogs';
import { useInvoiceDownload } from '@/features/order-detail/useInvoiceDownload';
import { AREA_LABELS } from '@/features/order-form/order-form';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatDateWeekday, formatPhone, formatRupiah, formatSlot } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * AD-5 Pratinjau nota (Figma 45:2521). Tampilan HTML dari data yang sama dengan PDF ADM-15;
 * berkas PDF tetap dibuat server.
 */
export function InvoicePage() {
  const { id } = useParams();
  const { data: order, error, loading, reload } = useApi(() => getOrder(id), [id]);

  if (error) {
    return (
      <Card>
        {errorCode(error) === 'NOT_FOUND' ? (
          <EmptyState title="Pesanan tidak ditemukan" description="Periksa kembali tautan nota." />
        ) : (
          <ErrorState onRetry={reload} />
        )}
      </Card>
    );
  }
  if (loading || !order) return <PageLoader variant="admin" />;
  return <Invoice order={order} />;
}

function Invoice({ order }) {
  const invoice = useInvoiceDownload(order);
  const before = order.photos.find((p) => p.kind === 'before');
  const after = order.photos.find((p) => p.kind === 'after');
  const checks = [
    { label: 'Identitas usaha, ID & tanggal', ok: true },
    { label: 'Data pembeli', ok: true },
    { label: 'Rincian item (harga snapshot)', ok: order.items.length > 0 },
    { label: 'Ongkir, total & estimasi', ok: Boolean(order.estimated_days) },
    { label: 'Foto sebelum', ok: Boolean(before) },
    { label: 'Foto sesudah', ok: Boolean(after) },
    { label: 'Catatan pembayaran QRIS', ok: true },
  ];
  const ready = checks.filter((c) => c.ok).length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={`/admin/pesanan/${order.id}`}
            className="mb-2 inline-flex h-11 items-center gap-1.5 rounded-sm text-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:focus-ring max-lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Detail pesanan
          </Link>
          <h1 className="text-h1 lg:text-h1-lg">Nota {order.code}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pratinjau PDF A4, dibuat dari data pesanan yang sama
          </p>
        </div>
        <Button
          onClick={invoice.download}
          loading={invoice.loading}
          loadingText="Menyiapkan…"
          className="max-sm:w-full"
        >
          <Download aria-hidden="true" />
          Unduh PDF
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="overflow-x-auto rounded-lg bg-muted p-3 md:p-6">
          <article
            aria-label={`Pratinjau nota ${order.code}`}
            className="mx-auto flex min-h-[600px] w-full max-w-[595px] flex-col gap-5 bg-card p-5 text-sm shadow-md md:aspect-[1/1.414] md:p-10"
          >
            <header className="flex items-start justify-between gap-4 border-b-2 border-brand-700 pb-4">
              <div>
                <p className="font-heading text-lg font-bold text-brand-900">LAVE STREAT</p>
                <p className="text-xs text-muted-foreground">
                  Alamat &amp; nomor usaha (menunggu Q-09)
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-lg font-bold">NOTA</p>
                <p className="text-xs font-medium">{order.code}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
            </header>
            <section className="text-xs">
              <p>
                <span className="text-muted-foreground">Kepada: </span>
                <span className="font-medium">
                  {order.customer.name} · {formatPhone(order.customer.phone)}
                </span>
              </p>
              <p className="mt-1 text-muted-foreground">
                {order.fulfillment === 'pickup'
                  ? `Dijemput kurir · ${AREA_LABELS[order.area] ?? ''}`
                  : 'Antar sendiri'}{' '}
                · {formatDateWeekday(order.scheduled_date)} · {formatSlot(order.scheduled_slot)}
              </p>
            </section>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th scope="col" className="py-1.5 font-medium">
                    Item
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Qty
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Harga
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((l) => (
                  <tr key={l.id} className="border-b border-border">
                    <td className="py-1.5">{l.name}</td>
                    <td className="py-1.5 text-right">{l.qty}</td>
                    <td className="py-1.5 text-right">{formatRupiah(l.unit_price_idr)}</td>
                    <td className="py-1.5 text-right">{formatRupiah(l.line_total_idr)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="py-1.5 text-muted-foreground">
                    Ongkir
                  </td>
                  <td className="py-1.5 text-right">{formatRupiah(order.shipping_idr)}</td>
                </tr>
                <tr className="border-t-2 border-foreground font-semibold">
                  <td colSpan={3} className="py-2">
                    TOTAL
                  </td>
                  <td className="py-2 text-right">{formatRupiah(order.total_idr)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs">
              Estimasi pengerjaan:{' '}
              {order.estimated_days ? `${order.estimated_days} hari` : 'belum ditentukan'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <PhotoSlot
                label="Sebelum"
                src={before && photoUrl(order.id, before.id)}
                alt="Foto sebelum cuci"
              />
              <PhotoSlot
                label="Sesudah"
                src={after && photoUrl(order.id, after.id)}
                alt="Foto sesudah cuci"
              />
            </div>
            <p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">
              Pembayaran melalui QRIS di WhatsApp.
            </p>
          </article>
        </div>

        <Card className="flex flex-col gap-4">
          <CardTitle subtitle={`${ready} dari ${checks.length} bagian siap`}>
            Kelengkapan nota
          </CardTitle>
          {ready < checks.length && (
            <Alert type="warning">
              Bagian yang belum ada tetap dicetak dengan kotak kosong. Lengkapi dulu bila perlu.
            </Alert>
          )}
          <ul className="flex flex-col gap-2.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5 text-sm">
                {c.ok ? (
                  <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <CircleDashed className="size-5 shrink-0 text-warning" aria-hidden="true" />
                )}
                <span className={cn('flex-1', !c.ok && 'text-muted-foreground')}>{c.label}</span>
                {!c.ok && <span className="text-xs font-medium text-warning">Belum ada</span>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <MissingPhotoDialog
        warnings={invoice.warnings}
        onOpenChange={(open) => !open && invoice.dismiss()}
        onConfirm={invoice.confirm}
      />
    </>
  );
}

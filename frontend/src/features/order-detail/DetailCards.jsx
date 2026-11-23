import { useState } from 'react';
import { Link } from 'react-router';
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Truck,
} from 'lucide-react';
import { STATUS_LABELS } from '@lavestreat/shared';

import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { ItemTile } from '@/features/order-form/OrderFormFields';
import { AREA_LABELS } from '@/features/order-form/order-form';
import {
  formatDateTime,
  formatDateWeekday,
  formatPhone,
  formatRupiah,
  formatSlot,
} from '@/lib/format';
import { STATUS_STYLES, isEditable } from '@/lib/status';
import { cn } from '@/lib/utils';

/** Ringkasan item · metode · total, dipakai saat kartu item dan jadwal disembunyikan (Selesai/Diambil). */
function orderSummary(order) {
  const items = order.items.map((l) => `${l.name} × ${l.qty}`).join(' · ');
  const method =
    order.fulfillment === 'pickup'
      ? `Dijemput ${AREA_LABELS[order.area] ?? ''}`.trim()
      : 'Antar sendiri';
  return `${items} · ${method} · Total ${formatRupiah(order.total_idr)}`;
}

export function CustomerCard({ order, summary = false, className }) {
  const { customer } = order;
  return (
    <Card className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={customer.name} />
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold">{customer.name}</h2>
          <p className="text-sm text-muted-foreground">
            {summary
              ? orderSummary(order)
              : `${formatPhone(customer.phone)} · ${customer.email ?? 'email tidak diisi'}`}
          </p>
        </div>
      </div>
      <Link
        to={`/admin/pelanggan/${customer.id}`}
        className={buttonVariants({ variant: 'secondary', className: 'w-full sm:w-auto' })}
      >
        Lihat pelanggan
      </Link>
    </Card>
  );
}

export function ItemsCard({ order, onEdit, className }) {
  const editable = isEditable(order.status);
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <CardHeader>
        <CardTitle
          subtitle={
            editable
              ? 'Dapat diubah selama belum Diproses'
              : 'Terkunci setelah Diproses, hanya catatan internal yang dapat diubah'
          }
        >
          Item pesanan
        </CardTitle>
        {editable && (
          <Button variant="link" size="sm" className="px-0" onClick={onEdit}>
            Ubah item
          </Button>
        )}
      </CardHeader>
      <table className="w-full text-sm">
        <thead className="max-sm:sr-only">
          <tr className="h-9 border-b border-border text-left text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
            <th scope="col" className="font-medium">
              Item
            </th>
            <th scope="col" className="px-3 text-right font-medium">
              Qty
            </th>
            <th scope="col" className="px-3 text-right font-medium max-sm:hidden">
              Harga satuan
            </th>
            <th scope="col" className="text-right font-medium">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((line) => (
            <tr key={line.id} className="h-14">
              <td>
                <span className="flex items-center gap-3">
                  <ItemTile className="max-sm:hidden" />
                  <span>
                    {line.name}
                    {line.item_type === 'addon' && (
                      <span className="text-muted-foreground"> · add-on</span>
                    )}
                    <span className="block text-xs text-muted-foreground sm:hidden">
                      {formatRupiah(line.unit_price_idr)} × {line.qty}
                    </span>
                  </span>
                </span>
              </td>
              <td className="px-3 text-right max-sm:hidden">{line.qty}</td>
              <td className="px-3 text-right max-sm:hidden">{formatRupiah(line.unit_price_idr)}</td>
              <td className="text-right font-medium sm:font-normal">
                {formatRupiah(line.line_total_idr)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatRupiah(order.subtotal_idr)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Ongkir{order.area ? ` (${AREA_LABELS[order.area]})` : ''}
          </dt>
          <dd>{order.shipping_idr ? formatRupiah(order.shipping_idr) : 'Gratis'}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="text-lg font-semibold">{formatRupiah(order.total_idr)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function InfoTile({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
      <span className="flex size-8 items-center justify-center rounded-sm bg-accent text-accent-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}

export function ScheduleCard({ order, onEdit, className }) {
  const pickup = order.fulfillment === 'pickup';
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <CardHeader>
        <CardTitle>Jadwal &amp; metode</CardTitle>
        {isEditable(order.status) && (
          <Button variant="link" size="sm" className="px-0" onClick={onEdit}>
            Ubah
          </Button>
        )}
      </CardHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <InfoTile icon={Truck} label="Metode">
          {pickup ? `Dijemput kurir · ${AREA_LABELS[order.area] ?? '-'}` : 'Antar sendiri'}
        </InfoTile>
        <InfoTile icon={CalendarDays} label="Jadwal">
          {formatDateWeekday(order.scheduled_date)} ·{' '}
          {formatSlot(order.scheduled_slot, { withTime: true })}
        </InfoTile>
        <InfoTile icon={MapPin} label="Alamat">
          {pickup ? order.address_text || '-' : 'Diantar ke toko'}
        </InfoTile>
      </div>
      {order.customer_notes && (
        <p className="flex items-start gap-2 rounded-md bg-accent px-3 py-2.5 text-sm text-accent-foreground">
          <MessageSquare className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="whitespace-pre-line">Catatan pembeli: {order.customer_notes}</span>
        </p>
      )}
    </Card>
  );
}

/** Catatan internal (AC-02.7: masih dapat diubah sampai Selesai). */
export function InternalNotes({ order, onSave, className }) {
  const locked = order.status === 'completed' || order.status === 'cancelled';
  const [value, setValue] = useState(order.internal_notes ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = value.trim() !== (order.internal_notes ?? '');

  async function save() {
    setSaving(true);
    await onSave(value.trim() || null);
    setSaving(false);
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Field label="Catatan internal (hanya admin)" helper="Tidak terlihat oleh pembeli.">
        <Textarea
          rows={3}
          maxLength={500}
          placeholder="Contoh: ada sobekan kecil di tumit"
          value={value}
          disabled={locked}
          onChange={(e) => setValue(e.target.value)}
        />
      </Field>
      {dirty && !locked && (
        <div className="flex gap-2">
          <Button size="sm" onClick={save} loading={saving} loadingText="Menyimpan…">
            Simpan catatan
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setValue(order.internal_notes ?? '')}
            disabled={saving}
          >
            Batal
          </Button>
        </div>
      )}
    </div>
  );
}

/** Kartu nota (FR-03, Figma kartu "Nota" per status). */
export function InvoiceCard({ order, onDownload, downloading, className }) {
  const before = order.status === 'pending_confirmation' || order.status === 'received';
  const cancelled = order.status === 'cancelled';
  const hasAfter = order.photos.some((p) => p.kind === 'after');
  const ready = order.status === 'done' || order.status === 'completed';
  const previewHref = `/admin/pesanan/${order.id}/nota`;

  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <CardTitle subtitle={ready ? 'Dibuat dari data pesanan yang sama' : undefined}>
        Nota
      </CardTitle>
      {before || cancelled ? (
        <>
          <p className="text-sm text-muted-foreground">
            {cancelled
              ? 'Pesanan dibatalkan, nota tidak dibuat.'
              : 'Nota dapat dibuat setelah pesanan diproses.'}
          </p>
          <Button variant="secondary" disabled>
            <FileText aria-hidden="true" />
            Pratinjau nota
          </Button>
        </>
      ) : (
        <>
          {!hasAfter && (
            <Alert type="warning">
              Foto sesudah belum lengkap. Nota akan memuat kotak “Foto belum tersedia”.
            </Alert>
          )}
          {ready && (
            <Link
              to={previewHref}
              tabIndex={-1}
              aria-hidden="true"
              className="flex h-38 flex-col items-center justify-center gap-2 rounded-md bg-muted text-xs text-muted-foreground"
            >
              <FileText className="size-6" />
              Pratinjau nota A4
            </Link>
          )}
          <Link to={previewHref} className={buttonVariants({ variant: 'secondary' })}>
            <FileText aria-hidden="true" />
            Pratinjau nota
          </Link>
          {ready && (
            <Button onClick={onDownload} loading={downloading} loadingText="Menyiapkan…">
              <Download aria-hidden="true" />
              Unduh PDF
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

/** Linimasa riwayat status (AC-02.5): ikon status, waktu WIB, catatan koreksi atau alasan batal. */
export function HistoryCard({ order, footer, className }) {
  const rows = order.status_history;
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <CardTitle>Riwayat status</CardTitle>
      <ol className="flex flex-col">
        {rows.map((row, i) => {
          const style = STATUS_STYLES[row.to_status];
          const Icon = style.icon;
          const backward =
            row.from_status &&
            ['received', 'processing'].includes(row.to_status) &&
            ['processing', 'done'].includes(row.from_status) &&
            row.note;
          return (
            <li key={`${row.changed_at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
              {i < rows.length - 1 && (
                <span
                  className="absolute top-8 bottom-0 left-3.5 w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground',
                  i === rows.length - 1 && 'ring-4 ring-accent',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium">
                  {backward ? 'Koreksi ke ' : ''}
                  {STATUS_LABELS[row.to_status]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(row.changed_at)}
                  {row.from_status === null && order.source === 'public' ? ' · dibuat pembeli' : ''}
                  {row.from_status === 'pending_confirmation' && order.estimated_days
                    ? ` · estimasi ${order.estimated_days} hari`
                    : ''}
                </p>
                {row.note && (
                  <p className="mt-1 text-xs whitespace-pre-line">Catatan: {row.note}</p>
                )}
                {row.to_status === 'cancelled' && order.cancel_reason && (
                  <p className="mt-1 text-xs whitespace-pre-line">Alasan: {order.cancel_reason}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {footer}
    </Card>
  );
}

/**
 * Pesan edukasi perawatan (FR-06). Draf dibuat hanya saat status Selesai, maks. 5 (AC-06.6).
 * Sistem tidak mengirim pesan; pemilik menyalin manual (AGENTS aturan 8).
 */
export function AftercareCard({ order, onGenerate, onCopy, generating, className }) {
  const drafts = order.aftercare_messages ?? [];
  const latest = drafts.at(-1);
  const canGenerate = order.status === 'done' && drafts.length < 5;
  const [edits, setEdits] = useState({});
  const [copying, setCopying] = useState(false);
  const text = latest ? (edits[latest.id] ?? latest.content) : '';

  async function copy() {
    setCopying(true);
    await onCopy(latest, text);
    setCopying(false);
  }

  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <CardTitle subtitle="Draf dari AI, tidak dikirim otomatis. Salin lalu kirim lewat WhatsApp.">
            Pesan edukasi perawatan
          </CardTitle>
        </div>
        {latest && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            Draf {drafts.length} dari 5
          </span>
        )}
      </CardHeader>
      {latest ? (
        <Field
          label="Draf pesan"
          helper="60–120 kata. Prompt hanya memuat nama depan, layanan, dan catatan bahan."
        >
          <Textarea
            rows={5}
            maxLength={1000}
            value={text}
            onChange={(e) => setEdits((m) => ({ ...m, [latest.id]: e.target.value }))}
          />
        </Field>
      ) : (
        <p className="text-sm text-muted-foreground">
          {order.status === 'done'
            ? 'Buat draf pesan perawatan sepatu untuk dikirim manual lewat WhatsApp.'
            : 'Draf hanya dapat dibuat saat status Selesai.'}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {canGenerate && (
          <Button
            variant={latest ? 'secondary' : 'primary'}
            onClick={onGenerate}
            loading={generating}
            loadingText="Membuat draf…"
            disabled={!canGenerate}
          >
            <RefreshCw aria-hidden="true" />
            {latest ? 'Buat ulang' : 'Buat draf'}
          </Button>
        )}
        {latest && (
          <Button
            variant={latest.copied_at ? 'secondary' : 'primary'}
            onClick={copy}
            loading={copying}
            loadingText="Menyalin…"
            disabled={!text.trim()}
            className={cn(latest.copied_at && 'border-success text-success')}
          >
            {latest.copied_at ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {latest.copied_at ? 'Disalin' : 'Salin'}
          </Button>
        )}
        {latest?.copied_at && (
          <span className="text-xs text-muted-foreground">
            Disalin {formatDateTime(latest.copied_at)}
          </span>
        )}
      </div>
      {order.status === 'done' && drafts.length >= 5 && (
        <p className="text-xs text-muted-foreground">Batas 5 draf tercapai.</p>
      )}
    </Card>
  );
}

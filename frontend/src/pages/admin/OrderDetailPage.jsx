import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, Package } from 'lucide-react';
import { toast } from 'sonner';
import { STATUS_LABELS } from '@lavestreat/shared';

import * as adminApi from '@/api/admin';
import { errorCode, errorMessage, fieldErrors } from '@/api/client';
import { PageLoader } from '@/app/PageLoader';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AftercareCard,
  CustomerCard,
  HistoryCard,
  InternalNotes,
  InvoiceCard,
  ItemsCard,
  ScheduleCard,
} from '@/features/order-detail/DetailCards';
import {
  CancelDialog,
  ConflictDialog,
  MissingPhotoDialog,
  RevertDialog,
} from '@/features/order-detail/DetailDialogs';
import { ItemsEditDialog, ScheduleEditDialog } from '@/features/order-detail/EditDialogs';
import { EstimateCard } from '@/features/order-detail/EstimateCard';
import { PhotosCard } from '@/features/order-detail/PhotosCard';
import { useInvoiceDownload } from '@/features/order-detail/useInvoiceDownload';
import { useApi } from '@/hooks/useApi';
import { notifyOrdersChanged } from '@/hooks/usePendingCount';
import { formatDateTime } from '@/lib/format';
import { CANCELLABLE, NEXT_STATUS, PREV_STATUS, SOURCE_LABELS } from '@/lib/status';
import { cn } from '@/lib/utils';

/** AD-4 Detail pesanan (Figma 39:980, 137:6080, 39:1393, 40:980, 137:6440; mobile 50:2162). */
export function OrderDetailPage() {
  const { id } = useParams();
  const {
    data: order,
    error,
    loading,
    reload,
    setData,
  } = useApi(() => adminApi.getOrder(id), [id]);

  if (error) {
    return errorCode(error) === 'NOT_FOUND' ? (
      <Card>
        <EmptyState
          title="Pesanan tidak ditemukan"
          description="Pesanan mungkin sudah dihapus atau tautan salah."
          action={
            <Link to="/admin/pesanan" className="font-semibold text-accent-foreground underline">
              Kembali ke antrean
            </Link>
          }
        />
      </Card>
    ) : (
      <Card>
        <ErrorState onRetry={reload} />
      </Card>
    );
  }
  // Saat memuat ulang (mis. setelah konflik) detail dilepas, jadi state lokal (estimasi, catatan)
  // dibuat ulang dari data terbaru.
  if (loading || !order) return <PageLoader variant="admin" />;
  return <OrderDetail key={order.id} order={order} setOrder={setData} reload={reload} />;
}

// `ai_estimate_days` tidak dipakai sebagai isian awal: itu nilai mentah sebelum batas D-04
// (Express ≤ 1 hari). Nilai berbatas (`suggested_days`) hanya ada di respons ADM-10.
function initialEstimate(order) {
  if (order.estimated_days) return { days: order.estimated_days, source: order.estimate_source };
  return { days: null, source: null };
}

function OrderDetail({ order, setOrder, reload }) {
  const [busy, setBusy] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [estimate, setEstimate] = useState(() => initialEstimate(order));
  const [ai, setAi] = useState({ loading: false, error: false, baseline: null });
  const invoice = useInvoiceDownload(order);
  const autoEstimated = useRef(false);

  const { status } = order;
  const next = NEXT_STATUS[status];
  const prev = PREV_STATUS[status];
  const canCancel = CANCELLABLE.includes(status);

  /** Jalankan aksi tulis dengan penanganan galat seragam. Mengembalikan galat field bila 422. */
  async function run(key, fn, success) {
    setBusy(key);
    try {
      const updated = await fn();
      if (updated) setOrder(updated);
      if (success) toast.success(success);
      notifyOrdersChanged();
      setDialog(null);
      return undefined;
    } catch (err) {
      const code = errorCode(err);
      if (code === 'CONFLICT') setConflict(true);
      else if (code === 'INVALID_TRANSITION')
        toast.error('Transisi tidak valid. Muat ulang halaman.');
      else if (code === 'VALIDATION_ERROR') {
        const fields = fieldErrors(err);
        if (!Object.keys(fields).length) toast.error(errorMessage(err));
        return Object.keys(fields).length ? fields : {};
      } else toast.error(errorMessage(err));
      return {};
    } finally {
      setBusy(null);
    }
  }

  async function recalc() {
    setAi({ loading: true, error: false, baseline: null });
    try {
      const res = await adminApi.estimateOrder(order.id);
      setOrder((o) => ({
        ...o,
        ai_estimate_days: res.ai_estimate_days,
        updated_at: res.updated_at,
      }));
      setEstimate((e) =>
        !e.days || e.source === 'ai' || status === 'pending_confirmation'
          ? { days: res.suggested_days, source: 'ai' }
          : e,
      );
      setAi({ loading: false, error: false, baseline: null });
    } catch (err) {
      if (errorCode(err) === 'AI_UNAVAILABLE') {
        setAi({
          loading: false,
          error: true,
          baseline: err.response?.data?.fallback?.baseline_days ?? null,
        });
      } else {
        setAi({ loading: false, error: false, baseline: null });
        toast.error(errorMessage(err, 'Estimasi gagal dihitung.'));
      }
    }
  }

  // AC-04.1: hitung otomatis hanya bila nilai AI masih kosong, satu kali per kunjungan.
  useEffect(() => {
    const eligible =
      ['pending_confirmation', 'received'].includes(order.status) &&
      order.order_type !== 'product_only';
    if (!autoEstimated.current && eligible && order.ai_estimate_days == null) {
      autoEstimated.current = true;
      recalc();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali saat halaman dibuka
  }, []);

  const base = { updated_at: order.updated_at };
  const patch = (body, success) =>
    run('patch', () => adminApi.updateOrder(order.id, { ...base, ...body }), success);

  function confirm() {
    if (!estimate.days) {
      toast.error('Isi estimasi pengerjaan dulu (1–14 hari).');
      return;
    }
    run(
      'confirm',
      () =>
        adminApi.confirmOrder(order.id, {
          ...base,
          estimated_days: estimate.days,
          estimate_source: estimate.source ?? 'manual',
        }),
      'Pesanan dikonfirmasi. Status Diterima.',
    );
  }

  const advance = () =>
    run(
      'advance',
      () => adminApi.changeStatus(order.id, { ...base, to_status: next.to }),
      `Status diubah ke ${STATUS_LABELS[next.to]}.`,
    );

  const statusPost = (body, success) => async (text) => {
    const result = await run(
      'status',
      () => adminApi.changeStatus(order.id, { ...base, ...body(text) }),
      success,
    );
    return result === undefined;
  };

  async function generateAftercare() {
    setBusy('aftercare');
    try {
      const draft = await adminApi.createAftercare(order.id);
      setOrder((o) => ({ ...o, aftercare_messages: [...(o.aftercare_messages ?? []), draft] }));
      toast.success('Draf pesan dibuat. Periksa sebelum disalin.');
    } catch (err) {
      toast.error(
        errorCode(err) === 'AI_UNAVAILABLE'
          ? 'Layanan AI tidak tersedia. Coba lagi nanti.'
          : errorMessage(err, 'Draf gagal dibuat.'),
      );
    } finally {
      setBusy(null);
    }
  }

  async function copyAftercare(draft, text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error('Gagal menyalin. Salin teks secara manual.');
      return;
    }
    try {
      const saved = await adminApi.markAftercareCopied(draft.id, {
        copied: true,
        ...(text !== draft.content && { content: text }),
      });
      setOrder((o) => ({
        ...o,
        aftercare_messages: o.aftercare_messages.map((d) => (d.id === saved.id ? saved : d)),
      }));
      toast.success('Draf disalin. Tempel di WhatsApp secara manual.');
    } catch (err) {
      toast.warning(`Teks tersalin, tetapi status salin gagal disimpan. ${errorMessage(err)}`);
    }
  }

  const subtitle = (() => {
    const at = (iso) => formatDateTime(iso);
    const source = SOURCE_LABELS[order.source] ? ` · ${SOURCE_LABELS[order.source]}` : '';
    if (status === 'completed' && order.completed_at)
      return `Diambil/Diantar ${at(order.completed_at)}${source}`;
    if (status === 'done' && order.done_at) return `Selesai ${at(order.done_at)}${source}`;
    if (status === 'cancelled' && order.cancelled_at)
      return `Dibatalkan ${at(order.cancelled_at)}${source}`;
    if (status !== 'pending_confirmation' && order.received_at)
      return `Diterima ${at(order.received_at)}${source}`;
    return `Dibuat ${at(order.created_at)}${source}`;
  })();

  const finished = status === 'done' || status === 'completed';
  const primary =
    status === 'pending_confirmation' ? (
      <Button
        onClick={confirm}
        // Hitungan AI mengubah `updated_at`; konfirmasi sebelum selesai pasti CONFLICT.
        disabled={ai.loading}
        loading={busy === 'confirm'}
        loadingText="Menyimpan…"
        className="max-lg:flex-1"
      >
        <Check aria-hidden="true" />
        Konfirmasi pesanan
      </Button>
    ) : next ? (
      <Button
        onClick={advance}
        loading={busy === 'advance'}
        loadingText="Menyimpan…"
        className="max-lg:flex-1"
      >
        {next.to === 'completed' ? <Package aria-hidden="true" /> : <Check aria-hidden="true" />}
        {next.label}
      </Button>
    ) : null;
  const cancelBtn = canCancel && (
    <Button variant="secondary" onClick={() => setDialog('cancel')} disabled={Boolean(busy)}>
      Batalkan
    </Button>
  );
  const revertBtn = prev && (
    <Button variant="ghost" onClick={() => setDialog('revert')} disabled={Boolean(busy)}>
      Mundur ke {STATUS_LABELS[prev]}
    </Button>
  );

  return (
    <div className={cn((primary || cancelBtn) && 'max-lg:pb-24')}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/admin/pesanan"
            className="mb-2 inline-flex h-11 items-center gap-1.5 rounded-sm text-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:focus-ring max-lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Antrean pesanan
          </Link>
          <h1 className="flex flex-wrap items-center gap-3 text-h1 lg:text-h1-lg">
            {order.code}
            <StatusBadge status={status} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 max-lg:hidden">
          {revertBtn}
          {cancelBtn}
          {primary}
        </div>
      </div>

      {status === 'pending_confirmation' && (
        <Alert type="info" title="Periksa isian sebelum konfirmasi" className="mb-4">
          Pastikan item, jadwal, dan alamat sesuai. Estimasi AI dapat diubah sebelum konfirmasi.
        </Alert>
      )}
      {status === 'completed' && (
        <Alert type="success" title="Pesanan sudah selesai" className="mb-4">
          Diambil/Diantar adalah status akhir. Status, item, dan foto tidak dapat diubah lagi.
        </Alert>
      )}
      {status === 'cancelled' && (
        <Alert type="danger" title="Pesanan dibatalkan" className="mb-4">
          {order.cancel_reason
            ? `Alasan: ${order.cancel_reason}`
            : 'Pesanan ini tidak dapat diubah lagi.'}
        </Alert>
      )}

      {/* < lg satu kolom dengan urutan Figma mobile; ≥ lg dua kolom (kanan 340 px). */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-4">
          <CustomerCard order={order} summary={finished} className="max-lg:order-2" />
          {/* Figma Selesai/Diambil: item & jadwal diringkas di kartu pembeli. */}
          {!finished && (
            <>
              <ItemsCard
                order={order}
                onEdit={() => setDialog('items')}
                className="max-lg:order-3"
              />
              <ScheduleCard
                order={order}
                onEdit={() => setDialog('schedule')}
                className="max-lg:order-4"
              />
            </>
          )}
          <PhotosCard
            order={order}
            onPhotosChange={(fn) => setOrder((o) => ({ ...o, photos: fn(o.photos) }))}
            className="max-lg:order-5"
          />
          {(status === 'done' || status === 'completed') && (
            <AftercareCard
              order={order}
              onGenerate={generateAftercare}
              onCopy={copyAftercare}
              generating={busy === 'aftercare'}
              className="max-lg:order-6"
            />
          )}
          {/* AC-02.7: dapat diubah sampai Selesai; setelah status akhir hanya tampil bila berisi. */}
          {(!['completed', 'cancelled'].includes(status) || order.internal_notes) && (
            <InternalNotes
              order={order}
              onSave={(internal_notes) => patch({ internal_notes }, 'Catatan internal disimpan.')}
              className="max-lg:order-9"
            />
          )}
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-4">
          {status !== 'cancelled' && (
            <EstimateCard
              order={order}
              estimate={estimate}
              onEstimateChange={setEstimate}
              ai={ai}
              onRecalculate={recalc}
              onSave={() =>
                patch(
                  { estimated_days: estimate.days, estimate_source: estimate.source },
                  'Estimasi disimpan.',
                )
              }
              saving={busy === 'patch'}
              className="max-lg:order-1"
            />
          )}
          <InvoiceCard
            order={order}
            onDownload={invoice.download}
            downloading={invoice.loading}
            className="max-lg:order-7"
          />
          <HistoryCard
            order={order}
            className="max-lg:order-8"
            footer={
              revertBtn && <div className="border-t border-border pt-3 lg:hidden">{revertBtn}</div>
            }
          />
        </div>
      </div>

      {(primary || cancelBtn) && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-border bg-card px-4 py-3 shadow-up lg:hidden">
          {cancelBtn}
          {primary}
        </div>
      )}

      <CancelDialog
        open={dialog === 'cancel'}
        onOpenChange={(open) => setDialog(open ? 'cancel' : null)}
        code={order.code}
        onSubmit={statusPost(
          (text) => ({ to_status: 'cancelled', cancel_reason: text }),
          'Pesanan dibatalkan.',
        )}
      />
      <RevertDialog
        open={dialog === 'revert'}
        onOpenChange={(open) => setDialog(open ? 'revert' : null)}
        to={prev}
        onSubmit={statusPost(
          (text) => ({ to_status: prev, note: text }),
          `Status dikoreksi ke ${STATUS_LABELS[prev] ?? ''}.`,
        )}
      />
      <ItemsEditDialog
        open={dialog === 'items'}
        onOpenChange={(open) => setDialog(open ? 'items' : null)}
        order={order}
        onSave={(body) => patch(body, 'Item diperbarui. Total dihitung ulang.')}
      />
      <ScheduleEditDialog
        open={dialog === 'schedule'}
        onOpenChange={(open) => setDialog(open ? 'schedule' : null)}
        order={order}
        onSave={(body) => patch(body, 'Jadwal dan metode diperbarui.')}
      />
      <ConflictDialog
        open={conflict}
        onReload={() => {
          setConflict(false);
          setDialog(null);
          reload();
        }}
      />
      <MissingPhotoDialog
        warnings={invoice.warnings}
        onOpenChange={(open) => !open && invoice.dismiss()}
        onConfirm={invoice.confirm}
      />
      {busy === 'status' && (
        <span className="sr-only" role="status">
          Menyimpan…
        </span>
      )}
    </div>
  );
}

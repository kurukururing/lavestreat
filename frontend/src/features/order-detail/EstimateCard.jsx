import { Check, RefreshCw, Sparkles } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QtyStepper } from '@/components/ui/qty-stepper';
import { addDays, formatDate, formatDateWeekday, formatDayMonth, todayJakarta } from '@/lib/format';
import { cn } from '@/lib/utils';

const SOURCE_CHIP = { ai: 'AI', manual: 'manual', baseline: 'baseline' };

function SourceChip({ source }) {
  if (!source) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
      {source === 'ai' ? (
        <Sparkles className="size-3.5" aria-hidden="true" />
      ) : (
        <Check className="size-3.5" aria-hidden="true" />
      )}
      {SOURCE_CHIP[source]}
    </span>
  );
}

const jakartaDate = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(iso));
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86_400_000);

/**
 * Estimasi pengerjaan (FR-04, Figma kartu "ESTIMASI PENGERJAAN").
 * - Menunggu/Diterima: stepper 1–14 + "Hitung ulang". Menunggu: nilai dipakai saat konfirmasi.
 *   Diterima: tombol simpan muncul bila nilai berubah (AC-04.2 tetap berlaku setelah konfirmasi).
 * - Diproses: hanya baca + perkiraan selesai.
 * - Selesai/Diambil: durasi aktual dibanding estimasi.
 * `estimate` = `{ days, source }`, `ai` = `{ loading, error, baseline }`.
 */
export function EstimateCard({
  order,
  estimate,
  onEstimateChange,
  ai,
  onRecalculate,
  onSave,
  saving,
  className,
}) {
  const editable = order.status === 'pending_confirmation' || order.status === 'received';
  const dirty =
    order.status === 'received' &&
    (estimate.days !== order.estimated_days || estimate.source !== order.estimate_source);
  const finished = order.done_at && (order.status === 'done' || order.status === 'completed');

  return (
    <Card className={cn('flex flex-col gap-3', className)} aria-labelledby="estimasi-title">
      <h2
        id="estimasi-title"
        className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase"
      >
        Estimasi pengerjaan
      </h2>

      {finished ? (
        <FinishedEstimate order={order} />
      ) : (
        <>
          <p className="flex items-center gap-2">
            <span className="text-metric-lg">{estimate.days ? `${estimate.days} hari` : '–'}</span>
            <SourceChip source={estimate.days ? estimate.source : null} />
          </p>
          <p className="text-sm text-muted-foreground">{estimateCaption(order, estimate.days)}</p>
        </>
      )}

      {editable && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          {ai.error && <Alert type="warning">Estimasi otomatis tidak tersedia, isi manual.</Alert>}
          <div className="flex items-center gap-3">
            <QtyStepper
              value={estimate.days ?? 1}
              min={1}
              max={14}
              onChange={(days) => onEstimateChange({ days, source: 'manual' })}
              itemName="estimasi hari"
            />
            <span className="text-sm text-muted-foreground">hari (1–14)</span>
          </div>
          {ai.error && ai.baseline && (
            <>
              <Button
                variant="secondary"
                onClick={() => onEstimateChange({ days: ai.baseline, source: 'baseline' })}
              >
                Gunakan saran baseline: {ai.baseline} hari
              </Button>
              <p className="text-xs text-muted-foreground">
                Baseline hanya saran, tidak otomatis terpakai. Pesanan tetap bisa dikonfirmasi.
              </p>
            </>
          )}
          <Button
            variant="secondary"
            onClick={onRecalculate}
            loading={ai.loading}
            loadingText="Menghitung…"
          >
            <RefreshCw aria-hidden="true" />
            Hitung ulang
          </Button>
          {dirty && (
            <Button
              onClick={onSave}
              loading={saving}
              loadingText="Menyimpan…"
              disabled={!estimate.days}
            >
              Simpan estimasi
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function estimateCaption(order, days) {
  if (!days) return 'Belum ada estimasi. Isi manual atau hitung ulang.';
  if (order.status === 'pending_confirmation') {
    const done = addDays(todayJakarta(), days);
    return `Perkiraan selesai ${formatDateWeekday(done)} bila dikonfirmasi hari ini. Nilai AI mentah tetap disimpan.`;
  }
  const ai = order.ai_estimate_days ? ` · estimasi AI awal ${order.ai_estimate_days} hari` : '';
  if (order.estimated_done_date)
    return `Perkiraan selesai ${formatDateWeekday(order.estimated_done_date)}${ai}.`;
  return `Perkiraan selesai dihitung dari tanggal diterima${ai}.`;
}

function FinishedEstimate({ order }) {
  const actual = Math.max(
    daysBetween(jakartaDate(order.received_at), jakartaDate(order.done_at)),
    1,
  );
  const diff = (order.estimated_days ?? actual) - actual;
  const chip =
    order.estimated_days == null
      ? null
      : diff === 0
        ? `Tepat sesuai estimasi ${order.estimated_days} hari`
        : diff > 0
          ? `Lebih cepat ${diff} hari dari estimasi ${order.estimated_days} hari`
          : `Lebih lama ${-diff} hari dari estimasi ${order.estimated_days} hari`;
  return (
    <>
      <p className="flex items-baseline gap-2">
        <span className="text-metric-lg">{actual} hari</span>
        <span className="text-sm text-muted-foreground">aktual</span>
      </p>
      {chip && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
          <Check className="size-3.5" aria-hidden="true" />
          {chip}
        </span>
      )}
      <p className="text-sm text-muted-foreground">
        Diterima {formatDayMonth(order.received_at)} · Selesai {formatDate(order.done_at)}
      </p>
    </>
  );
}

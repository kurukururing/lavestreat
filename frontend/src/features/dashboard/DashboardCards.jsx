import { Info } from 'lucide-react';
import { STATUS_LABELS } from '@lavestreat/shared';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_STYLES } from '@/lib/status';
import { cn } from '@/lib/utils';

/**
 * Kartu KPI dasbor (Figma KpiCard 7:274, AC-05.2): label, ikon, angka Metric/LG, keterangan.
 * `value` sudah diformat pemanggil (mis. formatRupiah).
 */
function KpiCard({ label, value, caption, icon: Icon, className }) {
  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-sans text-sm font-medium">{label}</h2>
        {Icon && <Icon className="size-5 shrink-0 text-accent-foreground" aria-hidden="true" />}
      </div>
      <p className="text-metric-lg">{value}</p>
      {caption && <p className="text-xs font-medium text-muted-foreground">{caption}</p>}
    </Card>
  );
}

// Batang warna di bawah tiap status memakai warna teks status (DESIGN 2.3).
const TONE = {
  received: { bar: 'bg-status-received-fg', icon: 'text-status-received-fg' },
  processing: { bar: 'bg-status-processing-fg', icon: 'text-status-processing-fg' },
  done: { bar: 'bg-status-done-fg', icon: 'text-status-done-fg' },
  completed: { bar: 'bg-status-completed-fg', icon: 'text-status-completed-fg' },
};

/**
 * Pesanan per status (AC-05.2). Empat kunci `by_status`, tanpa Menunggu konfirmasi dan Dibatalkan
 * (AC-05.9). `counts` = `{ received, processing, done, completed }`.
 */
function StatusSummaryCard({ counts, className }) {
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <CardTitle subtitle="Tidak termasuk Menunggu konfirmasi & Dibatalkan">
        Pesanan per status
      </CardTitle>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.keys(TONE).map((status) => {
          const Icon = STATUS_STYLES[status].icon;
          return (
            <li
              key={status}
              className="flex flex-col gap-1 rounded-md bg-muted p-3 md:bg-transparent md:p-0"
            >
              <p className="flex items-center gap-2">
                <Icon className={cn('size-4 shrink-0', TONE[status].icon)} aria-hidden="true" />
                <span className="text-h2 font-semibold">{counts?.[status] ?? 0}</span>
              </p>
              <p className="text-xs font-medium text-muted-foreground">{STATUS_LABELS[status]}</p>
              <span
                className={cn('mt-1 h-1 w-full rounded-full', TONE[status].bar)}
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/**
 * Kerangka kartu chart (Figma ChartCard 7:275). Judul berupa pertanyaan bisnis, `actions` untuk
 * kontrol (mis. SegmentedControl), `note` keterangan berikon di bawah grafik.
 */
function ChartCard({ title, subtitle, actions, note, className, children }) {
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <CardHeader className="flex-wrap">
        <CardTitle subtitle={subtitle}>{title}</CardTitle>
        {actions}
      </CardHeader>
      <div className="min-h-0 flex-1">{children}</div>
      {note && (
        <p className="flex items-start gap-2 text-xs font-medium text-muted-foreground">
          <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
          {note}
        </p>
      )}
    </Card>
  );
}

export { KpiCard, StatusSummaryCard, ChartCard };

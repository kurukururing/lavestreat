import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { BarChart3, Footprints, ShoppingBag, Wallet } from 'lucide-react';
import { CATALOG } from '@lavestreat/shared';

import { getDashboard } from '@/api/admin';
import { PageHeader } from '@/components/layout/AdminLayout';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard, KpiCard, StatusSummaryCard } from '@/features/dashboard/DashboardCards';
import { useApi } from '@/hooks/useApi';
import { useNearScreen } from '@/hooks/useNearScreen';
import {
  addDays,
  formatDateRange,
  formatNumber,
  formatPercent,
  formatRupiah,
  todayJakarta,
} from '@/lib/format';
import { cn } from '@/lib/utils';

// Recharts dimuat terpisah: kartu KPI (LCP) tidak menunggu pustaka grafik.
const BusiestBars = lazy(() =>
  import('@/features/dashboard/DashboardCharts').then((m) => ({ default: m.BusiestBars })),
);
const FulfillmentDonut = lazy(() =>
  import('@/features/dashboard/DashboardCharts').then((m) => ({ default: m.FulfillmentDonut })),
);
const chartFallback = <Skeleton className="size-full rounded-md" />;

/** Grafik baru dimuat saat mendekati layar: di ponsel letaknya di bawah kartu KPI. */
function LazyChart({ children }) {
  const ref = useRef(null);
  const near = useNearScreen(ref);
  return (
    <div ref={ref} className="size-full">
      {near ? <Suspense fallback={chartFallback}>{children}</Suspense> : chartFallback}
    </div>
  );
}

const PERIODS = [
  { value: '7d', label: '7 hari' },
  { value: '30d', label: '30 hari' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'custom', label: 'Kustom' },
];

const SERVICES = CATALOG.filter((c) => c.type === 'service');
const ALL = 'all';

// Urutan dan label hari mengikuti Figma (Minggu lebih dulu).
const WEEKDAYS = [
  ['Sun', 'Min'],
  ['Mon', 'Sen'],
  ['Tue', 'Sel'],
  ['Wed', 'Rab'],
  ['Thu', 'Kam'],
  ['Fri', 'Jum'],
  ['Sat', 'Sab'],
];
const WEEKDAY_FULL = {
  Sun: 'Minggu',
  Mon: 'Senin',
  Tue: 'Selasa',
  Wed: 'Rabu',
  Thu: 'Kamis',
  Fri: 'Jumat',
  Sat: 'Sabtu',
};
const TOP_ROWS = 4;

const hourLabel = (h) => `${String(h).padStart(2, '0')}.00`;

/** Rentang tanggal kalender (Asia/Jakarta) untuk pilihan periode. */
function rangeFor(period, custom) {
  const today = todayJakarta();
  if (period === '7d') return { from: addDays(today, -6), to: today };
  if (period === '30d') return { from: addDays(today, -29), to: today };
  if (period === 'month') return { from: `${today.slice(0, 8)}01`, to: today };
  return custom;
}

/** AD-2 Dasbor (Figma 34:3211, FR-05). */
export function DashboardPage() {
  const [period, setPeriod] = useState('7d');
  const [custom, setCustom] = useState(() => rangeFor('7d'));
  const [service, setService] = useState(ALL);
  const [busiestView, setBusiestView] = useState('day');

  const range = rangeFor(period, custom);
  const customInvalid = period === 'custom' && (!range.from || !range.to || range.to < range.from);
  const { data, error, loading, reload } = useApi(
    () =>
      customInvalid
        ? Promise.resolve(null)
        : getDashboard({ ...range, ...(service !== ALL && { service }) }),
    [range.from, range.to, service, customInvalid],
  );

  const subtitle =
    range.from && range.to
      ? `Ringkasan bisnis ${formatDateRange(range.from, range.to)} · data dummy`
      : 'Ringkasan bisnis';

  return (
    <>
      <PageHeader
        title="Dasbor"
        subtitle={subtitle}
        actions={
          <>
            <SegmentedControl
              label="Periode"
              options={PERIODS}
              value={period}
              onChange={setPeriod}
            />
            <Select value={service} onValueChange={setService}>
              <SelectTrigger variant="pill" aria-label="Filter layanan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua layanan</SelectItem>
                {SERVICES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {period === 'custom' && (
        <Card className="mb-4 grid gap-4 sm:grid-cols-2 md:max-w-xl">
          <Field label="Dari tanggal">
            <Input
              type="date"
              value={custom.from}
              max={custom.to}
              onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
            />
          </Field>
          <Field
            label="Sampai tanggal"
            error={customInvalid ? 'Tanggal akhir harus sama atau setelah tanggal awal.' : null}
          >
            <Input
              type="date"
              value={custom.to}
              min={custom.from}
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
            />
          </Field>
        </Card>
      )}

      <DashboardBody
        data={data}
        error={error}
        loading={loading && !data}
        reload={reload}
        busiestView={busiestView}
        setBusiestView={setBusiestView}
        stale={loading && Boolean(data)}
      />
    </>
  );
}

function DashboardBody({ data, error, loading, reload, busiestView, setBusiestView, stale }) {
  if (error) return <ErrorState onRetry={reload} />;
  if (loading) return <DashboardSkeleton />;
  if (!data) return null;
  if (!data.has_data) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Belum ada data pada periode ini"
          description="Coba pilih periode lain atau semua layanan."
        />
      </Card>
    );
  }

  const { totals } = data;
  return (
    <div
      className={cn('flex flex-col gap-4 transition-opacity', stale && 'opacity-60')}
      aria-busy={stale}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_520px]">
        <KpiCard
          label="Total pesanan"
          value={formatNumber(totals.orders, 0)}
          caption="Tanpa pesanan menunggu & dibatalkan"
          icon={ShoppingBag}
        />
        <KpiCard
          label="Pendapatan"
          value={formatRupiah(totals.revenue_idr)}
          caption="Termasuk ongkir"
          icon={Wallet}
        />
        <StatusSummaryCard counts={totals.by_status} className="md:col-span-2 xl:col-span-1" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <BusiestCard busiest={data.busiest} view={busiestView} onViewChange={setBusiestView} />
        <FulfillmentCard share={data.fulfillment_share} total={totals.orders} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <TopServicesCard services={data.top_services} />
        <DurationCard duration={data.duration} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Memuat dasbor">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_520px]">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg md:col-span-2 xl:col-span-1" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

/** AC-05.4: hari dan jam tersibuk. Batang tertinggi diberi warna primer. */
function BusiestCard({ busiest, view, onViewChange }) {
  const rows = useMemo(() => {
    if (view === 'day') {
      const byDay = Object.fromEntries(busiest.by_weekday.map((d) => [d.day, d.orders]));
      return WEEKDAYS.map(([key, label]) => ({ key, label, orders: byDay[key] ?? 0 }));
    }
    const active = busiest.by_hour.filter((h) => h.orders > 0);
    const first = active[0]?.hour ?? 8;
    const last = active.at(-1)?.hour ?? 20;
    return busiest.by_hour
      .filter((h) => h.hour >= first && h.hour <= last)
      .map((h) => ({ key: h.hour, label: hourLabel(h.hour), orders: h.orders }));
  }, [busiest, view]);

  const max = Math.max(...rows.map((r) => r.orders), 0);
  const topDay = busiest.by_weekday.reduce((a, b) => (b.orders > a.orders ? b : a), {
    orders: -1,
  });
  const topHour = busiest.by_hour.reduce((a, b) => (b.orders > a.orders ? b : a), { orders: -1 });
  const note =
    view === 'day'
      ? `Hari tersibuk ${WEEKDAY_FULL[topDay.day] ?? '-'} (${topDay.orders} pesanan). Jam tersibuk ${hourLabel(topHour.hour)} WIB, lihat tab Per jam.`
      : `Jam tersibuk ${hourLabel(topHour.hour)} WIB (${topHour.orders} pesanan). Waktu dihitung dalam WIB.`;

  return (
    <ChartCard
      title="Kapan periode tersibuk?"
      subtitle="Jumlah pesanan per hari dan per jam (WIB)"
      actions={
        <SegmentedControl
          label="Tampilan periode tersibuk"
          options={[
            { value: 'day', label: 'Per hari' },
            { value: 'hour', label: 'Per jam' },
          ]}
          value={view}
          onChange={onViewChange}
        />
      }
      note={note}
    >
      <div className="h-56" role="img" aria-label={note}>
        <LazyChart>
          <BusiestBars rows={rows} max={max} hourly={view === 'hour'} />
        </LazyChart>
      </div>
    </ChartCard>
  );
}

/** AC-05.3: proporsi jemput kurir vs antar sendiri. */
function FulfillmentCard({ share, total }) {
  const slices = [
    { key: 'pickup', label: 'Jemput kurir', value: share.pickup, color: 'var(--color-chart-1)' },
    { key: 'dropoff', label: 'Antar sendiri', value: share.dropoff, color: 'var(--color-chart-2)' },
  ];
  const summary = `${formatPercent(share.pickup)} pesanan dijemput kurir, ${formatPercent(share.dropoff)} diantar sendiri.`;
  return (
    <ChartCard title="Jemput kurir vs antar sendiri" subtitle="Proporsi pesanan pada periode ini">
      <div className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col">
        <div className="relative size-44 shrink-0" role="img" aria-label={summary}>
          <LazyChart>
            <FulfillmentDonut slices={slices} />
          </LazyChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-h2 font-semibold">{formatPercent(share.pickup)}</span>
            <span className="text-xs text-muted-foreground">dijemput</span>
          </div>
        </div>
        <ul className="flex w-full flex-col gap-3">
          {slices.map((s) => (
            <li key={s.key} className="flex items-center gap-3 text-sm">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              <span className="flex-1 font-medium">{s.label}</span>
              <span className="text-muted-foreground">{Math.round(s.value * total)} pesanan</span>
              <span className="w-14 text-right font-semibold">{formatPercent(s.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

/** AC-05.2, BR-12: kontribusi pendapatan layanan tanpa ongkir. */
function TopServicesCard({ services }) {
  const total = services.reduce((sum, s) => sum + s.revenue_idr, 0) || 1;
  const shown = services.slice(0, TOP_ROWS);
  const rest = services.slice(TOP_ROWS);
  const rows = rest.length
    ? [
        ...shown,
        {
          code: 'OTHER',
          name: `Lainnya (${rest.length} layanan)`,
          pairs: rest.reduce((s, r) => s + r.pairs, 0),
          revenue_idr: rest.reduce((s, r) => s + r.revenue_idr, 0),
          other: true,
        },
      ]
    : shown;

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle subtitle="Pendapatan layanan tanpa ongkir">
        Layanan apa yang paling laris?
      </CardTitle>
      {/* ≥ md: tabel seperti Figma desktop */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="h-10 bg-accent text-left text-xs font-medium tracking-[0.06em] text-brand-900 uppercase">
            <th scope="col" className="rounded-l-md px-3 font-medium">
              Layanan
            </th>
            <th scope="col" className="px-3 text-right font-medium">
              Pasang
            </th>
            <th scope="col" className="px-3 text-right font-medium">
              Pendapatan
            </th>
            <th scope="col" className="w-[34%] rounded-r-md px-3 font-medium">
              Kontribusi
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const share = s.revenue_idr / total;
            return (
              <tr key={s.code} className="h-14 border-b border-border last:border-0">
                <td className="px-3">
                  <span className="flex items-center gap-3 font-medium">
                    <ServiceTile muted={s.other} />
                    {s.name}
                  </span>
                </td>
                <td className="px-3 text-right">{s.pairs}</td>
                <td className="px-3 text-right font-medium">{formatRupiah(s.revenue_idr)}</td>
                <td className="px-3">
                  <ShareBar share={share} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* < md: baris bertumpuk seperti Figma mobile */}
      <ul className="flex flex-col gap-4 md:hidden">
        {rows.map((s) => {
          const share = s.revenue_idr / total;
          return (
            <li key={s.code} className="flex flex-col gap-1.5">
              <p className="flex items-center justify-between gap-2 text-sm font-medium">
                {s.name}
                <span className="font-semibold">{formatPercent(share)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {s.pairs} pasang · {formatRupiah(s.revenue_idr)}
              </p>
              <ShareBar share={share} showLabel={false} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ServiceTile({ muted }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md',
        muted ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground',
      )}
      aria-hidden="true"
    >
      <Footprints className="size-4.5" />
    </span>
  );
}

function ShareBar({ share, showLabel = true }) {
  return (
    <span className="flex items-center gap-3">
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span
          className="block h-full rounded-full bg-chart-1"
          style={{ width: `${Math.max(share * 100, 2)}%` }}
        />
      </span>
      {showLabel && (
        <span className="w-12 text-right text-xs font-semibold">{formatPercent(share)}</span>
      )}
    </span>
  );
}

/** AC-05.6: durasi aktual vs estimasi final vs estimasi AI. */
function DurationCard({ duration }) {
  const bars = [
    { key: 'actual', label: 'Aktual', value: duration.avg_actual_days, color: 'bg-chart-1' },
    {
      key: 'final',
      label: 'Estimasi final',
      value: duration.avg_estimated_days,
      color: 'bg-chart-2',
    },
    { key: 'ai', label: 'Estimasi AI', value: duration.avg_ai_estimated_days, color: 'bg-chart-3' },
  ];
  const max = Math.max(...bars.map((b) => b.value ?? 0), 1);
  const diff = (duration.avg_estimated_days ?? 0) - (duration.avg_actual_days ?? 0);
  const chip =
    duration.avg_actual_days == null || duration.avg_estimated_days == null
      ? null
      : Math.abs(diff) < 0.05
        ? 'Estimasi rata-rata sama dengan aktual'
        : `Estimasi rata-rata ${formatNumber(Math.abs(diff))} hari ${diff > 0 ? 'lebih lama' : 'lebih cepat'}`;

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle subtitle="Rata-rata hari pengerjaan pesanan selesai">
        Seberapa akurat estimasi?
      </CardTitle>
      <p className="flex items-baseline gap-2">
        <span className="text-metric-lg">
          {duration.avg_actual_days == null ? '–' : formatNumber(duration.avg_actual_days)}
        </span>
        <span className="text-sm text-muted-foreground">hari aktual</span>
      </p>
      {chip && (
        <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {chip}
        </span>
      )}
      <ul className="flex flex-col gap-3">
        {bars.map((b) => (
          <li key={b.key} className="flex flex-col gap-1.5">
            <p className="flex justify-between text-sm">
              <span className="font-medium">{b.label}</span>
              <span className="font-semibold">
                {b.value == null ? 'Belum ada' : `${formatNumber(b.value)} hari`}
              </span>
            </p>
            <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <span
                className={cn('block h-full rounded-full', b.color)}
                style={{ width: `${((b.value ?? 0) / max) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

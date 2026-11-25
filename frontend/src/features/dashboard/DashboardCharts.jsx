import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
} from 'recharts';

// Hanya bagian yang memakai Recharts (±115 KB gzip). Dimuat lazy oleh DashboardPage agar kartu
// KPI tampil tanpa menunggu pustaka grafik.

/** Batang pesanan per hari/jam. Batang tertinggi diberi warna primer (AC-05.4). */
export function BusiestBars({ rows, max, hourly }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 24, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          interval={hourly ? 'preserveStartEnd' : 0}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
        />
        <Bar dataKey="orders" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {rows.map((r) => (
            <Cell
              key={r.key}
              fill={r.orders === max && max > 0 ? 'var(--color-primary)' : 'var(--color-muted)'}
            />
          ))}
          <LabelList
            dataKey="orders"
            position="top"
            content={({ x, y, width, value }) =>
              value === max && max > 0 ? (
                <text
                  x={x + width / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-brand-700 text-xs font-semibold"
                >
                  {value}
                </text>
              ) : null
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donat jemput vs antar sendiri (AC-05.3). */
export function FulfillmentDonut({ slices }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={slices}
          dataKey="value"
          innerRadius="68%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={false}
        >
          {slices.map((s) => (
            <Cell key={s.key} fill={s.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

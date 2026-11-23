import { Clock, Store, Truck } from 'lucide-react';
import { Money } from '@/features/public/Money';
import { useCatalog } from '@/hooks/useCatalog';
import { cn } from '@/lib/utils';

// Label panjang untuk web, pendek untuk ponsel (Figma 84:4180 web, 86:3854 ponsel).
const ROWS = [
  { icon: Truck, label: 'Jemput · Sidoarjo', area: 'sidoarjo' },
  { icon: Truck, label: 'Jemput · Surabaya', area: 'surabaya' },
  {
    icon: Store,
    label: 'Antar sendiri ke outlet',
    short: 'Antar sendiri',
    area: 'dropoff',
  },
  {
    icon: Clock,
    label: 'Jam kerja setiap hari',
    short: 'Jam kerja (WIB)',
    value: '09:00–18:00 WIB',
    shortValue: '09:00–18:00',
  },
];

/**
 * Daftar ongkir dan jam kerja (PG-1). `compact` = versi ponsel di hero (ikon 18, label pendek).
 * @param {{ compact?: boolean, className?: string }} props
 */
export function ShippingHours({ compact = false, className }) {
  const { shipping } = useCatalog();
  return (
    <dl className={cn('flex flex-col', className)}>
      {ROWS.map(({ icon: Icon, label, short, area, value, shortValue }) => (
        <div
          key={label}
          className={cn(
            'flex items-center justify-between gap-3 text-sm',
            compact ? 'py-2.5' : 'py-3',
          )}
        >
          <dt
            className={cn('flex items-center text-muted-foreground', compact ? 'gap-2.5' : 'gap-3')}
          >
            <Icon
              className={cn('shrink-0 text-primary', compact ? 'size-4.5' : 'size-5')}
              aria-hidden="true"
            />
            {compact ? (short ?? label) : label}
          </dt>
          <dd className="font-medium whitespace-nowrap text-brand-900">
            {area ? <Money value={shipping(area)} /> : compact ? shortValue : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

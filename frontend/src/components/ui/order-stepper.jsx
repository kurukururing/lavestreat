import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Stepper form pesanan (Figma StepItem 5:343, DESIGN 4 PG-2). Langkah sebelum `current` selesai
 * (centang), `current` aktif (cincin brand-200), sisanya berikutnya. Garis penghubung biru menuju
 * langkah yang sudah dicapai.
 * @param {{ steps: string[], current: number }} props `current` berbasis 0
 */
function OrderStepper({ steps, current, className }) {
  return (
    <ol aria-label="Langkah pemesanan" className={cn('flex items-start', className)}>
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
        return (
          <li
            key={label}
            aria-current={state === 'active' ? 'step' : undefined}
            className={cn('flex items-start', i > 0 && 'flex-1')}
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn('mt-3.75 h-0.5 flex-1', i <= current ? 'bg-primary' : 'bg-border')}
              />
            )}
            <span className="flex w-16 shrink-0 flex-col items-center gap-1">
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-sm font-medium',
                  state === 'upcoming'
                    ? 'border-[1.5px] border-input bg-card text-muted-foreground'
                    : 'bg-primary text-primary-foreground',
                  state === 'active' && 'ring-3 ring-brand-200',
                )}
              >
                {state === 'done' ? <Check className="size-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  state === 'active' ? 'font-semibold' : 'font-medium',
                  state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {label}
                {state === 'done' && <span className="sr-only"> (selesai)</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export { OrderStepper };

import { CircleX } from 'lucide-react';
import { STATUS_LABELS } from '@lavestreat/shared';

import { formatDateTime } from '@/lib/format';
import { STATUS_STYLES } from '@/lib/status';
import { cn } from '@/lib/utils';

/** Urutan linimasa lacak (DESIGN 4.1). `cancelled` tidak termasuk. */
const FLOW = ['pending_confirmation', 'received', 'processing', 'done', 'completed'];

/**
 * Linimasa status vertikal untuk `/lacak` (Figma TimelineStep 6:255, DESIGN 4.1). Status
 * sebelum `status` selesai, `status` aktif (cincin brand-200), sisanya "Belum". Pesanan
 * dibatalkan diganti satu kartu `danger-bg`. `times` opsional: PUB-03 belum mengirim waktu per
 * status, jadi baris waktu hanya tampil bila diberikan.
 * @param {{ status: string, times?: Partial<Record<string, string>> }} props
 */
function StatusTimeline({ status, times = {}, className }) {
  if (status === 'cancelled') {
    const at = times.cancelled;
    return (
      <div
        className={cn('flex items-start gap-3 rounded-md bg-danger-bg p-4 text-danger', className)}
      >
        <CircleX className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">Pesanan dibatalkan</p>
          {at && <p className="text-xs font-medium">{formatDateTime(at)} WIB</p>}
        </div>
      </div>
    );
  }

  const current = FLOW.indexOf(status);
  return (
    <ol aria-label="Status pesanan" className={cn('flex flex-col', className)}>
      {FLOW.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
        const last = i === FLOW.length - 1;
        const Icon = STATUS_STYLES[step].icon;
        const at = state === 'upcoming' ? null : times[step];
        return (
          <li
            key={step}
            aria-current={state === 'active' ? 'step' : undefined}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center self-stretch">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full',
                  state === 'upcoming'
                    ? 'border-[1.5px] border-border bg-muted text-muted-foreground'
                    : 'bg-primary text-primary-foreground',
                  state === 'active' && 'ring-4 ring-brand-200',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn('w-0.5 flex-1', state === 'done' ? 'bg-primary' : 'bg-border')}
                />
              )}
            </div>
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-0.5 pt-1',
                !last && 'pb-5',
                state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              <p className={cn('text-base', state === 'active' && 'font-medium')}>
                {STATUS_LABELS[step]}
                {state === 'done' && <span className="sr-only"> (sudah)</span>}
              </p>
              {(state === 'upcoming' || at) && (
                <p
                  className={cn(
                    'text-xs font-medium',
                    state !== 'upcoming' && 'text-muted-foreground',
                  )}
                >
                  {at ? formatDateTime(at) : 'Belum'}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { StatusTimeline };

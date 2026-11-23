import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Chip filter (Figma Chip 5:213, Type=Filter). Dipakai sebagai toggle: `aria-pressed`.
 * Terpilih: latar accent, border primary, ikon centang.
 */
function FilterChip({ selected = false, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:bg-muted disabled:opacity-50',
        selected
          ? 'border-primary bg-accent text-accent-foreground'
          : 'border-border bg-card text-foreground hover:bg-muted',
        className,
      )}
      {...props}
    >
      {selected && <Check className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

/**
 * Chip slot waktu (Figma Chip Type=Slot): label + keterangan jam. Dipakai di dalam
 * `role="radiogroup"`. Slot yang lewat: `disabled` dengan keterangan "Sudah lewat".
 */
function SlotChip({ selected = false, label, hint, className, ...props }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-md p-2 font-medium transition-colors outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:bg-muted disabled:opacity-50',
        selected
          ? 'border-2 border-primary bg-accent text-accent-foreground'
          : 'border border-border bg-card text-foreground hover:bg-muted',
        className,
      )}
      {...props}
    >
      <span className="text-sm">{label}</span>
      {hint && <span className={cn('text-xs', !selected && 'text-muted-foreground')}>{hint}</span>}
    </button>
  );
}

export { FilterChip, SlotChip };

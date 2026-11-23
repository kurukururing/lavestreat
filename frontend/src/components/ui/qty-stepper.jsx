import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Stepper jumlah (Figma QtyStepper 5:247). Tombol kurang nonaktif di `min`, tambah nonaktif di `max`.
 * `itemName` dipakai untuk label aksesibel ("Kurangi Easy Clean").
 */
function QtyStepper({ value, onChange, min = 0, max = 10, itemName, className }) {
  const btn =
    'flex size-11 items-center justify-center rounded-full text-foreground outline-none focus-visible:focus-ring disabled:opacity-35';
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center rounded-full border border-input bg-card',
        className,
      )}
      role="group"
      aria-label={itemName ? `Jumlah ${itemName}` : 'Jumlah'}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={itemName ? `Kurangi ${itemName}` : 'Kurangi'}
      >
        <Minus className="size-5" aria-hidden="true" />
      </button>
      <span className="w-11 text-center text-base font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={itemName ? `Tambah ${itemName}` : 'Tambah'}
      >
        <Plus className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export { QtyStepper };

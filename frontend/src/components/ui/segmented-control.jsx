import { cn } from '@/lib/utils';

/**
 * Segmented control (Figma SegmentItem 31:578): track pil muted, segmen terpilih putih + shadow-sm.
 * Dipakai untuk periode dasbor dan tab "Per hari / Per jam".
 * @param {{ options: {value: string, label: string}[], value: string, onChange: (v: string) => void, label: string }} props
 */
function SegmentedControl({ options, value, onChange, label, className }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-muted p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-11 shrink-0 rounded-full px-4 text-sm whitespace-nowrap transition-colors outline-none focus-visible:focus-ring',
              selected
                ? 'bg-card font-semibold text-foreground shadow-sm'
                : 'font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };

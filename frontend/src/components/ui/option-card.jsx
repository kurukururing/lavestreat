import { cn } from '@/lib/utils';

/**
 * Kartu pilihan besar berperilaku radio (Figma OptionCard 5:287), mis. "Dijemput kurir" / "Antar sendiri".
 * Bungkus beberapa OptionCard dengan `role="radiogroup"`.
 */
function OptionCard({ icon: Icon, title, description, selected = false, className, ...props }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg p-4 text-left transition-colors outline-none focus-visible:focus-ring',
        selected
          ? 'border-2 border-primary bg-accent'
          : 'border border-border bg-card hover:bg-muted',
        className,
      )}
      {...props}
    >
      {Icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-heading text-h3 text-foreground">{title}</span>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-primary' : 'border-input',
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
    </button>
  );
}

export { OptionCard };

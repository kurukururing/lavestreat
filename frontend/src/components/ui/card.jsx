import { cn } from '@/lib/utils';

// Kartu dasar: card, border, radius-lg (20), shadow-xs, padding 16/20 (DESIGN 6.4).
function Card({ className, as: Comp = 'section', ...props }) {
  return (
    <Comp
      data-slot="card"
      className={cn(
        'rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs md:p-5',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-start justify-between gap-3', className)} {...props} />;
}

/** Judul kartu (h3 Poppins). `subtitle` caption redup di bawahnya. */
function CardTitle({ className, subtitle, children, as: Comp = 'h2' }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <Comp className="font-heading text-h3">{children}</Comp>
      {subtitle && <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export { Card, CardHeader, CardTitle };

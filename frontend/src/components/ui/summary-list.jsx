import { cn } from '@/lib/utils';

/** Daftar label–nilai untuk kartu ringkasan pesanan dan lacak (Figma 89:4156, 90:5203). */
function SummaryList({ className, ...props }) {
  return <dl className={cn('flex flex-col gap-3', className)} {...props} />;
}

/**
 * Satu baris ringkasan. `emphasis` untuk subtotal/total: nilai 16 px berwarna judul.
 * @param {{ label: React.ReactNode, value: React.ReactNode, emphasis?: boolean }} props
 */
function SummaryRow({ label, value, emphasis = false, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 text-sm', className)}>
      <dt className="min-w-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'shrink-0 text-right font-medium',
          emphasis ? 'text-base text-brand-900' : 'text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Garis pemisah antarbagian ringkasan. */
function SummaryDivider() {
  return <hr className="border-border" />;
}

export { SummaryList, SummaryRow, SummaryDivider };

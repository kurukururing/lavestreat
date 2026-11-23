import { cn } from '@/lib/utils';

// Figma "Input" (5:166): tinggi 44, radius-md, 16 px. Fokus: border primary + ring 3 px brand-200.
const fieldBase =
  'w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--color-brand-200)] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-2 aria-invalid:border-danger';

/** `icon` (komponen lucide) tampil di kiri seperti Figma login dan form pesanan baru. */
function Input({ className, type = 'text', icon: Icon, ...props }) {
  const input = (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldBase, 'h-11', Icon && 'pl-10', className)}
      {...props}
    />
  );
  if (!Icon) return input;
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      {input}
    </div>
  );
}

export { Input, fieldBase };

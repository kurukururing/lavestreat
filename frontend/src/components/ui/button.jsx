import { cva } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

// Figma "Button" (4:145): pil, tinggi 44, padding 20, label 16 semibold.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-base font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,scale] outline-none active:scale-[0.98] focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'border border-border bg-card text-foreground hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground hover:shadow-sm',
        link: 'h-auto px-0 text-accent-foreground hover:underline',
      },
      size: {
        default: 'h-11 min-w-11 px-5',
        sm: 'h-11 min-w-11 px-4 text-sm',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

/**
 * Tombol aksi. `loading` menampilkan spinner, mengganti label dengan `loadingText`,
 * dan menonaktifkan tombol agar tidak terkirim ganda (AC-01.6, DESIGN 6.1).
 * Tombol ikon (`size="icon"`) wajib diberi `aria-label`.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText = 'Memproses…',
  disabled,
  children,
  ...props
}) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          {size === 'icon' ? <span className="sr-only">{loadingText}</span> : loadingText}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };

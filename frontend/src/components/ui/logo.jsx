import logoUrl from '@/assets/logo-lave.png';
import { cn } from '@/lib/utils';

/**
 * Logo LAVE STREAT (Figma Logo 70:286): tanda gambar di kotak putih + wordmark Poppins.
 * `tone="dark"` untuk permukaan navy (sidebar, footer), `light` untuk permukaan terang.
 */
function Logo({ tone = 'light', className }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md bg-card',
          tone === 'light' && 'border border-border',
        )}
      >
        <img src={logoUrl} alt="" className="size-7.5 object-contain" />
      </span>
      <span
        className={cn(
          'font-heading text-lg leading-6 font-bold tracking-[-0.01em] whitespace-nowrap',
          tone === 'dark' ? 'text-sidebar-foreground' : 'text-brand-900',
        )}
      >
        Lave Streat
      </span>
    </span>
  );
}

export { Logo };

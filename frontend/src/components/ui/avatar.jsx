import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

const SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-base' };

/** Avatar inisial tanpa foto (Figma Avatar 31:1073). Dekoratif: nama selalu tampil di dekatnya. */
function Avatar({ name, size = 'md', className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground',
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export { Avatar };

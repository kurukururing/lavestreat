import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Kolom pencarian pil (Figma SearchField 31:588). `label` wajib untuk pembaca layar. */
function SearchField({ label, className, inputClassName, ...props }) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-2.5 rounded-full border border-border bg-background px-4 transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--color-brand-200)]',
        className,
      )}
    >
      <Search className="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground',
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}

export { SearchField };

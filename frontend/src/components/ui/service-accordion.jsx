import { ChevronDown } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * Akordeon kategori layanan di langkah 1 form pesanan (Figma "Akordeon layanan" 179:7745).
 * Satu panel terbuka sekaligus dan bisa ditutup semua.
 */
function ServiceAccordion({ className, ...props }) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  );
}

/**
 * Satu kategori: ikon, judul, ringkasan harga, badge "N dipilih", lalu isi (grid `ItemRow`).
 * @param {{ value: string, icon: React.ComponentType, title: string, description?: string,
 *   selectedCount?: number }} props
 */
function ServiceAccordionItem({
  value,
  icon: Icon,
  title,
  description,
  selectedCount = 0,
  className,
  children,
}) {
  return (
    <AccordionPrimitive.Item
      value={value}
      className={cn(
        'group overflow-hidden rounded-2xl border border-border bg-card data-[state=open]:border-primary',
        className,
      )}
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="flex min-h-16 w-full items-center gap-3 p-3.5 text-left sm:px-5 sm:py-4 outline-none group-data-[state=open]:bg-accent focus-visible:focus-ring">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-heading text-h3 text-brand-900">{title}</span>
            {description && (
              <span className="font-sans text-sm text-muted-foreground">{description}</span>
            )}
          </span>
          {selectedCount > 0 && (
            <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
              {selectedCount} dipilih
            </span>
          )}
          <ChevronDown
            className="size-5 shrink-0 text-foreground transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="px-3 pt-3 pb-3.5 sm:px-5 sm:pt-4 sm:pb-5">
        <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

export { ServiceAccordion, ServiceAccordionItem };

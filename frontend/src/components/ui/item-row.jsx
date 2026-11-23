import { QtyStepper } from '@/components/ui/qty-stepper';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Kartu pemilih item (Figma ItemRow 5:321): tile 44 px + nama + keterangan di atas, harga dan
 * stepper jumlah di bawah. Terpilih bila `qty > 0`. Harga di sini hanya tampilan; total dihitung
 * server (AC-01.5).
 * @param {{ name: string, description?: string, price: number, unit?: string, image?: string,
 *   icon?: React.ComponentType, qty: number, onQtyChange: (qty: number) => void, max?: number }} props
 */
function ItemRow({
  name,
  description,
  price,
  unit = 'pasang',
  image,
  icon: Icon,
  qty,
  onQtyChange,
  max = 10,
  className,
}) {
  const selected = qty > 0;
  return (
    <div
      data-selected={selected}
      className={cn(
        'flex flex-col gap-3 rounded-lg px-4 py-3 transition-colors',
        selected ? 'border-2 border-primary bg-accent' : 'border border-border bg-card',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent text-accent-foreground">
          {image ? (
            <img src={image} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            Icon && <Icon className="size-5" aria-hidden="true" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 font-medium">
          <p className="text-base text-foreground">{name}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-medium whitespace-nowrap text-brand-700">
          {formatRupiah(price)}
          <span className="hidden sm:inline"> / {unit}</span>
        </p>
        <QtyStepper value={qty} onChange={onQtyChange} max={max} itemName={name} />
      </div>
    </div>
  );
}

export { ItemRow };

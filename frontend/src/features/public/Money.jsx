import { RotateCw } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/useCatalog';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Nominal rupiah dari katalog server. `undefined` = masih memuat (placeholder berdenyut),
 * `null` = tidak tersedia (galat atau item nonaktif).
 * @param {{ value: number | null | undefined, className?: string }} props
 */
export function Money({ value, className }) {
  if (value === undefined) {
    return (
      <span
        aria-label="Memuat"
        className={cn(
          'inline-block h-[0.9em] w-[4.5em] animate-pulse rounded-sm bg-brand-200/60 align-middle',
          className,
        )}
      />
    );
  }
  return <span className={className}>{value === null ? '—' : formatRupiah(value)}</span>;
}

/** Pemberitahuan bila katalog gagal dimuat, dengan tombol coba lagi (AGENTS aturan 12). */
export function CatalogError({ className }) {
  const { error, reload } = useCatalog();
  if (!error) return null;
  return (
    <Alert type="danger" title="Harga belum bisa dimuat." className={className}>
      <span className="flex flex-wrap items-center gap-x-3">
        Periksa koneksi lalu coba lagi.
        <Button variant="link" onClick={reload} className="text-danger">
          <RotateCw aria-hidden="true" />
          Coba lagi
        </Button>
      </span>
    </Alert>
  );
}

/** Ongkir satu area dari katalog server (BR-03), untuk disisipkan di kalimat. */
export function ShippingFee({ area }) {
  const { shipping } = useCatalog();
  return <Money value={shipping(area)} />;
}

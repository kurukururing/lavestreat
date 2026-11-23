import { cn } from '@/lib/utils';

/**
 * Bilah aksi lengket di bawah layar ponsel (Figma "Bilah aksi lengket" 77:2972, DESIGN 3 PG-2).
 * Hanya < lg; di desktop aksi ada di kartu samping. Halaman wajib memberi ruang bawah setinggi
 * bilah (mis. `pb-40 lg:pb-0`) agar isi terakhir tidak tertutup. Ruang aman iOS ditambahkan.
 */
function StickyActionBar({ className, children }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2.5 border-t border-border bg-card px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-up lg:hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

export { StickyActionBar };

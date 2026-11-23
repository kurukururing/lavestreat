import { Menu, Search } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { SearchField } from '@/components/ui/search-field';

const iconBtn =
  'flex size-11 shrink-0 items-center justify-center rounded-full text-foreground outline-none hover:bg-muted focus-visible:focus-ring';

/**
 * Topbar panel pemilik (Figma AD-2 Main, AD-M B). ≥ lg: kolom cari pil + nama pengguna.
 * < lg: tombol menu (buka drawer), logo, tombol cari, avatar.
 * Pencarian dikirim lewat `onSearch(q)` (AC-02.2, membuka Antrean).
 */
function AdminTopbar({ user, onOpenMenu, onSearch, onOpenSearch, className }) {
  function handleSubmit(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q')?.toString().trim();
    if (q) onSearch?.(q);
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-card px-3 lg:px-6',
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Buka menu"
        className={`${iconBtn} lg:hidden`}
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <span className="lg:hidden">
        <Logo />
      </span>

      <form role="search" onSubmit={handleSubmit} className="hidden w-90 lg:block">
        <SearchField
          name="q"
          label="Cari pesanan"
          placeholder="Cari ID pesanan, nama, atau nomor…"
          maxLength={80}
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Cari pesanan"
          className={`${iconBtn} lg:hidden`}
        >
          <Search className="size-5" aria-hidden="true" />
        </button>
        {user && (
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} size="sm" />
            <div className="hidden leading-tight lg:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">Pemilik</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export { AdminTopbar };

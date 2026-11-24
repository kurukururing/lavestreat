import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * Kerangka panel pemilik (DESIGN 3): ≥ lg sidebar tetap 240 px (ciut 72 px), topbar 64 px.
 * < lg sidebar menjadi drawer kiri. Isi halaman di `children`.
 * `mobileBack` ({ label, to }) mengganti topbar di layar kecil dengan kepala "← label"
 * seperti Figma detail pesanan mobile (50:2162).
 */
function AdminLayout({
  activePath,
  pendingCount,
  user,
  onLogout,
  onSearch,
  onOpenSearch,
  LinkComponent = 'a',
  mobileBack,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const shared = { activePath, pendingCount, user, onLogout, LinkComponent };

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#konten"
        className="sr-only z-50 rounded-md bg-card px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:focus-ring"
      >
        Lewati ke konten
      </a>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border lg:block',
          collapsed ? 'w-18' : 'w-60',
        )}
      >
        <AdminSidebar
          {...shared}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="bg-sidebar text-sidebar-foreground lg:hidden">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigasi panel pemilik</SheetDescription>
          <AdminSidebar {...shared} showUser onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn('flex min-h-dvh flex-col', collapsed ? 'lg:pl-18' : 'lg:pl-60')}>
        {mobileBack && (
          <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-card px-2 lg:hidden">
            <LinkComponent
              {...(LinkComponent === 'a' ? { href: mobileBack.to } : { to: mobileBack.to })}
              className="flex size-11 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:focus-ring"
              aria-label={`Kembali ke ${mobileBack.parent ?? 'halaman sebelumnya'}`}
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </LinkComponent>
            <p className="font-heading text-base font-semibold">{mobileBack.label}</p>
          </header>
        )}
        <AdminTopbar
          className={mobileBack ? 'hidden lg:flex' : undefined}
          user={user}
          onOpenMenu={() => setDrawerOpen(true)}
          onSearch={onSearch}
          onOpenSearch={onOpenSearch}
        />
        <main id="konten" tabIndex={-1} className="flex-1 px-4 py-5 outline-none md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Kepala halaman admin: judul h1, subjudul, dan slot aksi di kanan (Figma AD-2/AD-3). */
function PageHeader({ title, subtitle, actions, nowrap = false, className }) {
  return (
    <div
      className={cn(
        'mb-5 flex items-start justify-between gap-3',
        nowrap ? 'flex-nowrap' : 'flex-wrap',
        className,
      )}
    >
      <div className={cn('min-w-0', nowrap && 'flex-1')}>
        <h1 className="text-h1 lg:text-h1-lg">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export { AdminLayout, PageHeader };

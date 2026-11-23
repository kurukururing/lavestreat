import {
  ClipboardList,
  FilePlus,
  Info,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
} from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { CountBadge } from '@/components/ui/status-badge';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

// Rute PRD Bagian 8 (AD-2, AD-3, AD-5, AD-6, AD-8).
const MAIN_NAV = [
  { href: '/admin', label: 'Dasbor', icon: LayoutDashboard, exact: true },
  { href: '/admin/pesanan', label: 'Antrean pesanan', icon: ClipboardList, badge: true },
  { href: '/admin/pesanan/baru', label: 'Pesanan baru', icon: FilePlus, exact: true },
  { href: '/admin/pelanggan', label: 'Pelanggan', icon: Users },
];

/** Item `exact` aktif bila path sama persis; lainnya juga untuk rute anak, kecuali rute milik item `exact` lain. */
function isNavActive(item, path) {
  if (item.exact) return path === item.href;
  // "/admin/pesanan/baru" milik item Pesanan baru, bukan Antrean.
  const ownedByOther = MAIN_NAV.some((other) => other.exact && other.href === path);
  return path === item.href || (path.startsWith(`${item.href}/`) && !ownedByOther);
}

const itemBase =
  'flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm outline-none transition-colors focus-visible:focus-ring';

/**
 * Sidebar navy panel pemilik (Figma Sidebar 34:3212). `LinkComponent` diisi Link router
 * saat routing terpasang (W2-26); bawaan `<a>`.
 */
function AdminSidebar({
  activePath,
  pendingCount = 0,
  user,
  onLogout,
  onToggleCollapse,
  onNavigate,
  collapsed = false,
  showUser = false,
  LinkComponent = 'a',
  className,
}) {
  const linkProps = (href) => (LinkComponent === 'a' ? { href } : { to: href });

  return (
    <nav
      aria-label="Menu utama"
      className={cn(
        'flex h-full flex-col gap-1 bg-sidebar px-4 pt-3 pb-5 text-sidebar-foreground',
        collapsed && 'items-center px-3',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center justify-between px-1',
          collapsed && 'justify-center px-0',
        )}
      >
        {!collapsed && <Logo tone="dark" />}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'}
            aria-expanded={!collapsed}
            className="flex size-11 items-center justify-center rounded-full outline-none hover:bg-sidebar-accent focus-visible:focus-ring"
          >
            <PanelLeft className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {showUser && user && (
        <div className="mb-2 flex items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent p-3">
          <Avatar name={user.name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-sidebar-muted-foreground">Pemilik</p>
          </div>
        </div>
      )}

      {!collapsed && (
        <p className="flex h-8 items-center px-3 text-xs font-medium tracking-[0.06em] text-sidebar-muted-foreground uppercase">
          Menu utama
        </p>
      )}

      <ul className="flex w-full flex-col gap-1">
        {MAIN_NAV.map((item) => {
          const active = isNavActive(item, activePath);
          const Icon = item.icon;
          const showBadge = item.badge && pendingCount > 0;
          const badgeLabel = `${pendingCount} pesanan menunggu konfirmasi`;
          return (
            <li key={item.href}>
              <LinkComponent
                {...linkProps(item.href)}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  itemBase,
                  collapsed && 'relative w-11 justify-center px-0',
                  active
                    ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
                    : 'font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {showBadge &&
                  (collapsed ? (
                    <CountBadge
                      count={pendingCount}
                      label={badgeLabel}
                      className="absolute -top-1 -right-1"
                    />
                  ) : (
                    <CountBadge count={pendingCount} label={badgeLabel} />
                  ))}
              </LinkComponent>
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />
      <div className="h-px w-full bg-sidebar-border" />

      <LinkComponent
        {...linkProps('/admin/bantuan')}
        onClick={onNavigate}
        aria-current={activePath === '/admin/bantuan' ? 'page' : undefined}
        className={cn(
          itemBase,
          'font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'w-11 justify-center px-0',
        )}
      >
        <Info className="size-5 shrink-0" aria-hidden="true" />
        {collapsed ? <span className="sr-only">Bantuan</span> : 'Bantuan'}
      </LinkComponent>
      <button
        type="button"
        onClick={onLogout}
        className={cn(
          itemBase,
          'font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'w-11 justify-center px-0',
        )}
      >
        <LogOut className="size-5 shrink-0" aria-hidden="true" />
        {collapsed ? <span className="sr-only">Keluar</span> : 'Keluar'}
      </button>
    </nav>
  );
}

export { AdminSidebar };

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  Menu,
  Phone,
  Search,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PUBLIC_NAV } from '@/lib/business';
import { cn } from '@/lib/utils';

// Ikon menu ponsel per tautan (Figma 86:4186).
const MENU_ICONS = [Sparkles, ClipboardList, Truck, BadgeCheck, Phone];

/**
 * Header portal pembeli (Figma 89:3778 web, 86:3775 ponsel). ≥ lg: navigasi pil di tengah,
 * "Lacak" dan "Pesan Sekarang" di kanan. < lg: tombol ikon lacak dan menu layar penuh.
 * `mobile`: 'none' menyembunyikan header di ponsel (halaman punya header sendiri, mis. form
 * pesanan 76:2494); 'minimal' hanya logo + tombol "Lacak" (konfirmasi pesanan 78:3344);
 * 'order' logo + "Pesan Sekarang" (lacak 79:3275); 'back' panah kembali + `title` (privasi 81:3715).
 * @param {{ mobile?: 'default' | 'none' | 'minimal' | 'order' | 'back', title?: string }} props
 */
export function PublicHeader({ mobile = 'default', title }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Dibuka langsung (tanpa riwayat di aplikasi): panah kembali menuju beranda.
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-card transition-shadow duration-200 data-[scrolled=true]:shadow-sm',
        mobile === 'none' && 'hidden lg:block',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-312 items-center justify-between pr-2 pl-4 lg:h-18 lg:px-6">
        {mobile === 'back' && (
          <div className="flex min-w-0 items-center gap-1 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={back}
              aria-label="Kembali"
              className="-ml-3"
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <p className="truncate text-base font-medium text-brand-900">{title}</p>
          </div>
        )}
        <Link
          to="/"
          aria-label="Lave Streat, beranda"
          className={cn(
            'rounded-md focus-visible:focus-ring',
            mobile === 'back' && 'hidden lg:block',
          )}
        >
          <Logo />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 rounded-full bg-muted p-1">
            {PUBLIC_NAV.map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:focus-ring',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-card hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/lacak" className={buttonVariants({ variant: 'ghost' })}>
            <Search aria-hidden="true" />
            Lacak
          </Link>
          <Link to="/pesan" className={buttonVariants()}>
            <Truck aria-hidden="true" />
            Pesan Sekarang
          </Link>
        </div>

        {mobile === 'order' && (
          <Link
            to="/pesan"
            className={buttonVariants({ variant: 'secondary', className: 'lg:hidden' })}
          >
            Pesan Sekarang
          </Link>
        )}
        {mobile === 'minimal' && (
          <Link
            to="/lacak"
            className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'lg:hidden' })}
          >
            <Search aria-hidden="true" />
            Lacak
          </Link>
        )}
        <div className={cn('flex items-center lg:hidden', mobile !== 'default' && 'hidden')}>
          <Link
            to="/lacak"
            aria-label="Lacak pesanan"
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <Search aria-hidden="true" />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Buka menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              aria-describedby={undefined}
              className="w-full max-w-none bg-card"
            >
              <SheetTitle>Menu</SheetTitle>
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border pr-2 pl-4">
                <Logo />
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Tutup menu">
                    <X aria-hidden="true" />
                  </Button>
                </SheetClose>
              </div>
              <nav aria-label="Navigasi utama" className="overflow-y-auto p-4">
                <ul className="flex flex-col gap-2">
                  {PUBLIC_NAV.map((item, i) => {
                    const Icon = MENU_ICONS[i];
                    const active = isActive(item.to);
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-base font-medium outline-none focus-visible:focus-ring',
                            active ? 'bg-accent text-brand-900' : 'text-foreground hover:bg-muted',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-10 shrink-0 items-center justify-center rounded-md',
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground',
                            )}
                          >
                            <Icon className="size-5" aria-hidden="true" />
                          </span>
                          <span className="flex-1">{item.menuLabel ?? item.label}</span>
                          <ChevronRight className="size-4.5" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 flex flex-col gap-2.5 py-2">
                  <Link
                    to="/pesan"
                    onClick={() => setOpen(false)}
                    className={buttonVariants({ className: 'w-full' })}
                  >
                    <Truck aria-hidden="true" />
                    Pesan Sekarang
                  </Link>
                  <Link
                    to="/lacak"
                    onClick={() => setOpen(false)}
                    className={buttonVariants({ variant: 'secondary', className: 'w-full' })}
                  >
                    <Search aria-hidden="true" />
                    Lacak Pesanan
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

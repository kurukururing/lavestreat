import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useMatches } from 'react-router';

import { PageLoader } from '@/app/PageLoader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/utils';

/** Lebar konten portal: 1200 px di tengah (Figma padding 120 di 1440), gutter 16 (ponsel) / 24 (≥ lg). */
export function Container({ className, ...props }) {
  return <div className={cn('mx-auto w-full max-w-312 px-4 lg:px-6', className)} {...props} />;
}

/** Router tidak menggulir ke atas sendiri saat pindah halaman. */
function useScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}

/** Kerangka portal pembeli: header, isi, footer (PG-1 sampai PG-10). */
export function PublicLayout() {
  useScrollTop();
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  useReveal(mainRef);
  // Pemuatan pertama tidak memudar: animasi dari opacity 0 menunda LCP. Hanya pindah halaman.
  const [firstPath] = useState(pathname);
  const fadeIn = pathname !== firstPath;
  const handle = [...useMatches()].reverse().find((m) => m.handle)?.handle ?? {};
  useEffect(() => {
    document.title = handle.title ? `${handle.title} · LAVE STREAT` : 'LAVE STREAT';
  }, [handle.title]);

  return (
    // Bilah aksi lengket ponsel setinggi ±72 px menutupi footer bila tanpa ruang bawah.
    // `stickyBar: 'tall'`: bilah berisi ringkasan beberapa baris (form pesanan), butuh ruang lebih.
    <div
      className={cn(
        'flex min-h-dvh flex-col',
        handle.stickyBar && (handle.stickyBar === 'tall' ? 'pb-40 lg:pb-0' : 'pb-18 lg:pb-0'),
      )}
    >
      <a
        href="#konten"
        className="sr-only z-50 rounded-md bg-card px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus-visible:focus-ring"
      >
        Lewati ke konten
      </a>
      <PublicHeader mobile={handle.mobileHeader} title={handle.title} />
      <main id="konten" ref={mainRef} className="flex-1">
        {/* key: isi baru memudar masuk setiap pindah halaman. */}
        <div key={pathname} className={cn(fadeIn && 'animate-page-in')}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

/**
 * Judul halaman: breadcrumb, judul, dan keterangan (Figma 89:3832).
 * @param {{ crumbs?: { label: string, to?: string }[], title: string, description?: React.ReactNode }} props
 */
export function PageHeader({ crumbs = [], title, description, className, children }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {crumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {c.to ? (
                    <Link
                      to={c.to}
                      className="-my-3.5 inline-flex min-h-11 items-center rounded-sm hover:text-foreground focus-visible:focus-ring"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-h1 text-brand-900 lg:text-h1-lg">{title}</h1>
        {description && <p className="text-base text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

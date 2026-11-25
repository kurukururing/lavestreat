import { lazy, Suspense } from 'react';
import { createBrowserRouter, matchRoutes, Outlet } from 'react-router';

import { PageLoader } from '@/app/PageLoader';
import { PublicLayout } from '@/components/layout/PublicLayout';
// Halaman info publik kecil (±6 KB gzip) ikut bundel awal: kunjungan pertama ke halaman ini hemat
// satu putaran jaringan (±0,6 detik di 4G lambat). Form, lacak, dan admin tetap lazy.
import { ContactPage } from '@/pages/public/ContactPage';
import { GalleryPage } from '@/pages/public/GalleryPage';
import { HomePage } from '@/pages/public/HomePage';
import { HowItWorksPage } from '@/pages/public/HowItWorksPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { PrivacyPage } from '@/pages/public/PrivacyPage';
import { ServicesPage } from '@/pages/public/ServicesPage';

// Halaman dimuat terpisah agar Recharts dan form besar tidak ikut bundel awal (NFR-02).
// `preload` mengunduh potongannya lebih dulu (lihat `preloadRoute`).
const page = (load, name) =>
  Object.assign(
    lazy(() => load().then((m) => ({ default: m[name] }))),
    { preload: load },
  );
// Kerangka admin juga dimuat terpisah: pembeli tidak perlu mengunduh sidebar dan sesi admin.
const AuthProvider = page(() => import('@/features/auth/AuthProvider'), 'AuthProvider');
const AdminShell = page(() => import('@/app/AdminShell'), 'AdminShell');
const LoginPage = page(() => import('@/pages/admin/LoginPage'), 'LoginPage');
const DashboardPage = page(() => import('@/pages/admin/DashboardPage'), 'DashboardPage');
const OrderQueuePage = page(() => import('@/pages/admin/OrderQueuePage'), 'OrderQueuePage');
const NewOrderPage = page(() => import('@/pages/admin/NewOrderPage'), 'NewOrderPage');
const OrderDetailPage = page(() => import('@/pages/admin/OrderDetailPage'), 'OrderDetailPage');
const InvoicePage = page(() => import('@/pages/admin/InvoicePage'), 'InvoicePage');
const CustomersPage = page(() => import('@/pages/admin/CustomersPage'), 'CustomersPage');
const CustomerDetailPage = page(
  () => import('@/pages/admin/CustomerDetailPage'),
  'CustomerDetailPage',
);
const HelpPage = page(() => import('@/pages/admin/HelpPage'), 'HelpPage');
const OrderPage = page(() => import('@/pages/public/OrderPage'), 'OrderPage');
const OrderDonePage = page(() => import('@/pages/public/OrderDonePage'), 'OrderDonePage');
const TrackPage = page(() => import('@/pages/public/TrackPage'), 'TrackPage');
// Galeri komponen portal pembeli, hanya saat dev (tidak ikut build produksi).
const ComponentGallery = import.meta.env.DEV
  ? page(() => import('@/pages/dev/ComponentGallery'), 'ComponentGallery')
  : null;
const AdminNotFoundPage = page(
  () => import('@/pages/admin/AdminNotFoundPage'),
  'AdminNotFoundPage',
);

/**
 * Unduh semua potongan lazy untuk sebuah path sekaligus (kerangka admin, sesi, dan halaman),
 * bukan berantai satu per satu saat React merender lapis demi lapis.
 * @param {string} pathname
 */
export function preloadRoute(pathname) {
  for (const m of matchRoutes(router.routes, pathname) ?? []) {
    // Elemen bisa dibungkus Suspense (rute akar): cari komponen lazy di anak pertamanya juga.
    const el = m.route.element;
    for (const type of [el?.type, el?.props?.children?.type]) type?.preload?.().catch(() => {});
  }
}

/**
 * Prefetch saat ada niat membuka tautan (hover, sentuh, fokus papan ketik): unduhan tidak
 * berebut bandwidth dengan pemuatan awal, dan halaman sudah siap saat diklik.
 */
function preloadOnIntent(event) {
  const link = event.target.closest?.('a[href]');
  if (!link || link.origin !== location.origin || navigator.connection?.saveData) return;
  preloadRoute(link.pathname);
}

/** Rute PRD Bagian 8 (AD-1 sampai AD-8). `handle.title` mengisi judul tab. */
export const router = createBrowserRouter([
  {
    // Sesi admin (ADM-03) hanya diperiksa di rute admin, bukan setiap kunjungan pembeli.
    element: (
      <Suspense fallback={<PageLoader variant="admin" fullscreen />}>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </Suspense>
    ),
    children: [
      { path: '/admin/login', element: <LoginPage /> },
      {
        path: '/admin',
        element: <AdminShell />,
        children: [
          { index: true, element: <DashboardPage />, handle: { title: 'Dasbor' } },
          { path: 'pesanan', element: <OrderQueuePage />, handle: { title: 'Antrean pesanan' } },
          { path: 'pesanan/baru', element: <NewOrderPage />, handle: { title: 'Pesanan baru' } },
          {
            path: 'pesanan/:id',
            element: <OrderDetailPage />,
            handle: {
              title: 'Detail pesanan',
              mobileBack: {
                label: 'Detail pesanan',
                to: '/admin/pesanan',
                parent: 'Antrean pesanan',
              },
            },
          },
          {
            path: 'pesanan/:id/nota',
            element: <InvoicePage />,
            handle: {
              title: 'Nota',
              mobileBack: (params) => ({
                label: 'Nota',
                to: `/admin/pesanan/${params.id}`,
                parent: 'detail pesanan',
              }),
            },
          },
          { path: 'pelanggan', element: <CustomersPage />, handle: { title: 'Pelanggan' } },
          {
            path: 'pelanggan/:id',
            element: <CustomerDetailPage />,
            handle: {
              title: 'Pelanggan',
              mobileBack: { label: 'Pelanggan', to: '/admin/pelanggan', parent: 'Pelanggan' },
            },
          },
          { path: 'bantuan', element: <HelpPage />, handle: { title: 'Bantuan' } },
          {
            path: '*',
            element: <AdminNotFoundPage />,
            handle: { title: 'Halaman tidak ditemukan' },
          },
        ],
      },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      ...(ComponentGallery ? [{ path: 'dev/komponen', element: <ComponentGallery /> }] : []),
      // `stickyBar`: halaman punya bilah aksi lengket di ponsel, layout memberi ruang bawah.
      { index: true, element: <HomePage />, handle: { stickyBar: true } },
      { path: 'layanan', element: <ServicesPage />, handle: { title: 'Layanan & tarif' } },
      { path: 'cara-kerja', element: <HowItWorksPage />, handle: { title: 'Cara kerja' } },
      { path: 'galeri', element: <GalleryPage />, handle: { title: 'Galeri' } },
      { path: 'kontak', element: <ContactPage />, handle: { title: 'Kontak' } },
      // `mobileHeader`: 'none' = halaman memasang header ponselnya sendiri, 'minimal' = logo + Lacak.
      {
        path: 'pesan',
        element: <OrderPage />,
        handle: { title: 'Pesan', stickyBar: 'tall', mobileHeader: 'none' },
      },
      {
        path: 'pesan/selesai',
        element: <OrderDonePage />,
        handle: { title: 'Pesanan terkirim', mobileHeader: 'minimal' },
      },
      {
        path: 'lacak',
        element: <TrackPage />,
        handle: { title: 'Lacak pesanan', mobileHeader: 'order' },
      },
      {
        path: 'privasi',
        element: <PrivacyPage />,
        handle: { title: 'Privasi', mobileHeader: 'back' },
      },
      { path: '*', element: <NotFoundPage />, handle: { title: 'Halaman tidak ditemukan' } },
    ],
  },
]);

// Muat awal: potongan untuk URL sekarang diunduh paralel saat modul ini dievaluasi.
if (import.meta.env.MODE !== 'test') {
  preloadRoute(location.pathname);
  for (const type of ['pointerover', 'touchstart', 'focusin']) {
    document.addEventListener(type, preloadOnIntent, { passive: true });
  }
}

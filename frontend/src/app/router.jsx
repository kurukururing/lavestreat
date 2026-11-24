import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';

import { PageLoader } from '@/app/PageLoader';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HomePage } from '@/pages/public/HomePage';

// Halaman dimuat terpisah agar Recharts dan form besar tidak ikut bundel awal (NFR-02).
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
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
const ServicesPage = page(() => import('@/pages/public/ServicesPage'), 'ServicesPage');
const HowItWorksPage = page(() => import('@/pages/public/HowItWorksPage'), 'HowItWorksPage');
const GalleryPage = page(() => import('@/pages/public/GalleryPage'), 'GalleryPage');
const ContactPage = page(() => import('@/pages/public/ContactPage'), 'ContactPage');
const OrderPage = page(() => import('@/pages/public/OrderPage'), 'OrderPage');
const OrderDonePage = page(() => import('@/pages/public/OrderDonePage'), 'OrderDonePage');
const TrackPage = page(() => import('@/pages/public/TrackPage'), 'TrackPage');
const PrivacyPage = page(() => import('@/pages/public/PrivacyPage'), 'PrivacyPage');
const NotFoundPage = page(() => import('@/pages/public/NotFoundPage'), 'NotFoundPage');
// Galeri komponen portal pembeli, hanya saat dev (tidak ikut build produksi).
const ComponentGallery = import.meta.env.DEV
  ? page(() => import('@/pages/dev/ComponentGallery'), 'ComponentGallery')
  : null;
const AdminNotFoundPage = page(
  () => import('@/pages/admin/AdminNotFoundPage'),
  'AdminNotFoundPage',
);

/** Rute PRD Bagian 8 (AD-1 sampai AD-8). `handle.title` mengisi judul tab. */
export const router = createBrowserRouter([
  {
    // Sesi admin (ADM-03) hanya diperiksa di rute admin, bukan setiap kunjungan pembeli.
    element: (
      <Suspense fallback={<PageLoader fullscreen />}>
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

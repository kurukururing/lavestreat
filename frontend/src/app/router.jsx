import { lazy } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';

import { AdminShell } from '@/app/AdminShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { HomePage } from '@/pages/public/HomePage';
import { HomePlaceholder } from '@/pages/public/HomePlaceholder';

// Halaman dimuat terpisah agar Recharts dan form besar tidak ikut bundel awal (NFR-02).
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
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
      <AuthProvider>
        <Outlet />
      </AuthProvider>
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
      // Halaman PG-2 sampai PG-6 belum dibuat; sementara path lain ke halaman awal.
      { path: '*', element: <HomePlaceholder /> },
    ],
  },
]);

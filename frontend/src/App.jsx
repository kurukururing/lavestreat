import { lazy, Suspense } from 'react';
import { RouterProvider } from 'react-router/dom';

import { router } from '@/app/router';

// Notifikasi hanya muncul setelah aksi pengguna, jadi sonner (±33 KB) tidak perlu ikut bundel awal.
const Toaster = lazy(() => import('@/components/ui/sonner').then((m) => ({ default: m.Toaster })));

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </>
  );
}

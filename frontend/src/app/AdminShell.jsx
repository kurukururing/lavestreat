import { Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useMatches, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchField } from '@/components/ui/search-field';
import { useAuth } from '@/features/auth/auth-context';
import { usePendingCount } from '@/hooks/usePendingCount';
import { PageLoader } from '@/app/PageLoader';

/** Rute terlindungi `/admin/*` (AC-02.1): tanpa sesi diarahkan ke login. */
export function AdminShell() {
  const { status, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const pendingCount = usePendingCount(status === 'authed');
  const [searchOpen, setSearchOpen] = useState(false);

  const match = [...matches].reverse().find((m) => m.handle);
  const handle = match?.handle ?? {};
  const mobileBack =
    typeof handle.mobileBack === 'function' ? handle.mobileBack(match.params) : handle.mobileBack;

  useEffect(() => {
    document.title = handle.title ? `${handle.title} · LAVE STREAT` : 'LAVE STREAT';
  }, [handle.title]);

  // Selama sesi diperiksa, kerangka dan halaman sudah dirender agar permintaan data halaman berjalan
  // paralel dengan ADM-03 (hemat satu putaran jaringan). Aman: tanpa sesi server membalas 401 untuk
  // semua data admin, lalu status menjadi `guest` dan pengguna diarahkan ke login.
  if (status === 'guest') {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
    );
  }

  async function handleLogout() {
    await logout();
    toast.success('Anda sudah keluar.');
    navigate('/admin/login', { replace: true });
  }

  function search(q) {
    setSearchOpen(false);
    navigate(`/admin/pesanan?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <AdminLayout
        activePath={location.pathname}
        pendingCount={pendingCount}
        user={{ name: user?.username ?? '' }}
        onLogout={handleLogout}
        onSearch={search}
        onOpenSearch={() => setSearchOpen(true)}
        LinkComponent={Link}
        mobileBack={mobileBack}
      >
        <Suspense fallback={<PageLoader variant="admin" />}>
          <Outlet />
        </Suspense>
      </AdminLayout>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cari pesanan</DialogTitle>
            <DialogDescription>
              Cari dengan ID pesanan, nama, atau nomor WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <form
            role="search"
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get('q')?.toString().trim();
              if (q) search(q);
            }}
          >
            <SearchField name="q" label="Cari pesanan" maxLength={80} autoFocus />
            <Button type="submit">Cari</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

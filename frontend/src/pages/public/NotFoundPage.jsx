import { MapPin, Search } from 'lucide-react';
import { Link } from 'react-router';

import { Container } from '@/components/layout/PublicLayout';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** PG-5 Halaman tidak ditemukan (Figma 91:5202, 81:3652). */
export function NotFoundPage() {
  return (
    <Container className="flex justify-center pt-10 pb-16 lg:pt-16 lg:pb-24">
      <section className="flex w-full max-w-160 flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-10 text-center shadow-sm sm:px-10 lg:py-14">
        <MapPin className="size-8 text-warning" aria-hidden="true" />
        <p className="font-heading text-[2.5rem] leading-12 font-bold text-brand-900">404</p>
        <h1 className="text-h1 text-brand-900">Halaman tidak ditemukan</h1>
        <p className="max-w-96 text-base text-muted-foreground">
          Alamat yang Anda buka tidak ada. Kembali ke beranda untuk memesan atau melacak pesanan.
        </p>
        <div className="mt-3 flex w-full flex-col gap-3">
          <Link to="/" className={cn(buttonVariants(), 'w-full')}>
            Ke Beranda
          </Link>
          <Link to="/lacak" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
            <Search aria-hidden="true" />
            Lacak Pesanan
          </Link>
        </div>
      </section>
    </Container>
  );
}

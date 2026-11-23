import { Truck } from 'lucide-react';
import { Link } from 'react-router';

import { Container } from '@/components/layout/PublicLayout';
import { buttonVariants } from '@/components/ui/button';
import { ShippingHours } from '@/features/public/ShippingHours';
import { cn } from '@/lib/utils';

/**
 * Bagian "Ajakan & info" (Figma 84:4163 web, 86:4093 ponsel): kartu ajakan biru dan, di web,
 * kartu ongkir dan jam kerja. Di ponsel ongkir sudah tampil di hero, jadi kartunya disembunyikan.
 */
export function OrderCta({ className }) {
  return (
    <section aria-labelledby="ajakan-judul" className={cn('bg-accent pb-8 lg:pb-22', className)}>
      <Container className="flex flex-col gap-4 lg:flex-row">
        <div
          data-reveal
          className="flex flex-1 flex-col items-start gap-2.5 rounded-xl bg-primary px-5 py-5.5 text-primary-foreground lg:gap-3.5 lg:p-10"
        >
          <h2 id="ajakan-judul" className="text-h1 lg:text-h1-lg">
            Siap dijemput hari ini?
          </h2>
          <p className="text-sm lg:text-base">
            <span className="hidden lg:inline">
              Pilih layanan dan slot jemput dalam beberapa menit.{' '}
            </span>
            Pembayaran lewat QRIS di WhatsApp setelah pesanan dikonfirmasi.
          </p>
          <Link
            to="/pesan"
            className={buttonVariants({ variant: 'secondary', className: 'w-full lg:w-auto' })}
          >
            <Truck aria-hidden="true" />
            Pesan Sekarang
          </Link>
        </div>
        <div
          data-reveal
          className="hidden w-110 shrink-0 flex-col rounded-xl bg-background px-7 py-5 lg:flex"
        >
          <h3 className="sr-only">Ongkir dan jam kerja</h3>
          <ShippingHours className="flex-1 justify-between" />
        </div>
      </Container>
    </section>
  );
}

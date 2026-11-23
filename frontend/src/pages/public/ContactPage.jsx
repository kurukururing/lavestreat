import { AtSign, Clock, Mail, MapPin, MessageCircle, Store, Truck } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { IconCard, InfoSection, PageHero } from '@/features/public/InfoPage';
import { CatalogError, ShippingFee } from '@/features/public/Money';
import { OrderCta } from '@/features/public/OrderCta';
import { BUSINESS } from '@/lib/business';

// Tautan keluar saja: sistem tidak mengirim pesan dan tidak ada form kontak (PG-10).
const external = { target: '_blank', rel: 'noopener noreferrer' };
const newTab = <span className="sr-only"> (tab baru)</span>;
const textLink =
  'flex min-h-11 items-center rounded-sm text-base font-medium text-brand-700 hover:underline focus-visible:focus-ring';

const LOCATION = [
  { icon: MapPin, title: 'Alamat outlet', text: BUSINESS.address },
  { icon: Clock, title: 'Jam kerja', text: BUSINESS.hours },
  {
    icon: Truck,
    title: 'Area antar-jemput',
    text: (
      <>
        Sidoarjo (<ShippingFee area="sidoarjo" />) dan Surabaya (<ShippingFee area="surabaya" />)
        per pesanan
      </>
    ),
  },
  { icon: Store, title: 'Antar sendiri', text: 'Datang ke outlet pada jam kerja, tanpa ongkir' },
];

/** Kontak PG-10 (Figma 98:6003). Peta (98:6127) tidak ditampilkan karena FR-08 belum aktif. */
export function ContactPage() {
  return (
    <>
      <PageHero
        label="Kontak"
        title="Hubungi LAVE STREAT"
        description="Pertanyaan, perubahan, atau pembatalan pesanan dilayani lewat WhatsApp pada jam kerja."
        facts={[
          { value: '09:00–18:00', label: 'setiap hari, WIB', tone: 'inverse' },
          { value: '2 kota', label: 'Sidoarjo & Surabaya', tone: 'primary' },
        ]}
      />
      <InfoSection
        id="saluran-judul"
        eyebrow="Saluran"
        title="Pilih cara menghubungi kami"
        className="bg-accent"
      >
        <ul className="grid gap-3 lg:grid-cols-3 lg:gap-6">
          <IconCard
            icon={MessageCircle}
            eyebrow="WhatsApp"
            title={BUSINESS.whatsapp}
            text="Cara tercepat. Sebutkan ID pesanan bila sudah memesan."
          >
            <a
              href={BUSINESS.whatsappUrl}
              {...external}
              className={buttonVariants({ className: 'w-full' })}
            >
              <MessageCircle aria-hidden="true" />
              Chat WhatsApp{newTab}
            </a>
          </IconCard>
          <IconCard
            icon={Mail}
            eyebrow="Email"
            title={BUSINESS.email}
            text="Untuk pertanyaan kerja sama atau keperluan lain."
          >
            <a href={`mailto:${BUSINESS.email}`} className={textLink}>
              Kirim email
            </a>
          </IconCard>
          <IconCard
            icon={AtSign}
            eyebrow="Instagram"
            title={BUSINESS.instagram}
            text="Lihat hasil pengerjaan terbaru dari workshop."
          >
            <a href={BUSINESS.instagramUrl} {...external} className={textLink}>
              Buka Instagram{newTab}
            </a>
          </IconCard>
        </ul>
      </InfoSection>
      <InfoSection id="lokasi-judul" eyebrow="Lokasi" title="Outlet dan area layanan">
        <CatalogError />
        <ul className="grid gap-5 rounded-lg border border-border bg-card p-4 shadow-sm lg:grid-cols-2 lg:gap-x-12 lg:p-6">
          {LOCATION.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="flex min-w-0 flex-col gap-0.5 text-sm">
                <span className="font-medium text-brand-900">{title}</span>
                <span className="text-muted-foreground">{text}</span>
              </p>
            </li>
          ))}
        </ul>
      </InfoSection>
      <OrderCta />
    </>
  );
}

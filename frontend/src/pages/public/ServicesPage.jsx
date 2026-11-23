import { BadgeCheck, CircleCheck, Clock, Droplets, Package, Sparkles } from 'lucide-react';

import { IconCard, InfoSection, PageHero } from '@/features/public/InfoPage';
import { Money } from '@/features/public/Money';
import { OrderCta } from '@/features/public/OrderCta';
import { ServiceCatalog } from '@/features/public/ServiceCatalog';
import { useCatalog } from '@/hooks/useCatalog';

// Panduan memilih layanan, disalin dari Figma Hi-fi (97:5501).
const GUIDE = [
  {
    icon: Sparkles,
    title: 'Kotor ringan',
    text: 'Debu dan noda tipis di upper dan midsole. Pilih Easy Clean.',
  },
  {
    icon: Droplets,
    title: 'Kotor menyeluruh',
    text: 'Noda sampai insole dan tali. Pilih Deep Clean.',
  },
  {
    icon: CircleCheck,
    title: 'Sepatu putih kusam',
    text: 'Pilih White Clean. Tambah Unyellowing Treat bila sol menguning.',
  },
  {
    icon: Package,
    title: 'Suede atau nubuck',
    text: 'Pilih Suede Clean dengan sikat dan cairan khusus suede.',
  },
  {
    icon: BadgeCheck,
    title: 'Sepatu kulit',
    text: 'Pilih Leather Clean, dirawat dengan leather lotion.',
  },
  {
    icon: Clock,
    title: 'Butuh cepat',
    text: 'Express Clean selesai 1 hari. Fast Track memangkas estimasi menjadi 2 hari.',
  },
];

/** Layanan dan tarif PG-7 (Figma 97:5355). */
export function ServicesPage() {
  const { minPrice, serviceCount } = useCatalog();
  return (
    <>
      <PageHero
        label="Layanan & tarif"
        title="Perawatan untuk setiap jenis sepatu"
        description="Semua harga per pasang. Ongkir dihitung sekali per pesanan; antar sendiri ke outlet tanpa ongkir."
        facts={[
          { value: <Money value={minPrice} />, label: 'harga mulai per pasang', tone: 'inverse' },
          { value: '1–4 hari', label: 'estimasi pengerjaan', tone: 'primary' },
          {
            value:
              serviceCount === undefined ? (
                <Money value={undefined} />
              ) : (
                `${serviceCount ?? '—'} layanan`
              ),
            label: 'plus add-on dan produk',
            tone: 'card',
          },
        ]}
      />
      <ServiceCatalog />
      <InfoSection
        id="panduan-judul"
        eyebrow="Panduan"
        title="Bingung memilih? Mulai dari kondisi sepatu"
        className="bg-accent"
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {GUIDE.map((g) => (
            <IconCard key={g.title} {...g} />
          ))}
        </ul>
      </InfoSection>
      <OrderCta />
    </>
  );
}

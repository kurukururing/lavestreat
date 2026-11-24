import { MessageCircle, Search, Store, Truck } from 'lucide-react';

import { StatusBadge } from '@/components/ui/status-badge';
import { HowItWorks } from '@/features/public/HowItWorks';
import { IconCard, InfoSection, PageHero } from '@/features/public/InfoPage';
import { CatalogError, ShippingFee } from '@/features/public/Money';
import { OrderCta } from '@/features/public/OrderCta';

// Lima status yang terlihat pembeli (BR-08), urutan maju. `cancelled` tidak ditampilkan di sini.
const STATUSES = [
  { status: 'pending_confirmation', text: 'Pesanan masuk. Pemilik memeriksa detail dan jadwal.' },
  { status: 'received', text: 'Pesanan dikonfirmasi. Kurir menjemput atau Anda mengantar.' },
  { status: 'processing', text: 'Sepatu sedang dicuci. Estimasi selesai tampil di halaman lacak.' },
  { status: 'done', text: 'Foto sebelum–sesudah dan nota bisa dilihat dan diunduh.' },
  { status: 'completed', text: 'Sepatu sudah kembali ke tangan Anda.' },
];

const PRACTICAL = [
  {
    icon: Truck,
    title: 'Dijemput kurir',
    text: (
      <>
        Sidoarjo <ShippingFee area="sidoarjo" />, Surabaya <ShippingFee area="surabaya" />. Ongkir
        sekali per pesanan.
      </>
    ),
  },
  { icon: Store, title: 'Antar sendiri', text: 'Bawa sepatu ke outlet di Sidoarjo, tanpa ongkir.' },
  {
    icon: MessageCircle,
    title: 'Bayar setelah dikonfirmasi',
    text: 'Pembayaran lewat QRIS di WhatsApp. Tidak ada pembayaran di situs.',
  },
  // Figma memakai contoh 6 karakter; ID sebenarnya 8 karakter (Q-07).
  {
    icon: Search,
    title: 'Lacak dengan ID',
    text: 'Simpan ID seperti LS-7K3M9QA2 untuk melihat status kapan saja.',
  },
];

/** Cara kerja PG-8 (Figma 97:5806). */
export function HowItWorksPage() {
  return (
    <>
      <PageHero
        label="Cara kerja"
        title="Dari pesan sampai sepatu kembali"
        description="Tanpa akun dan tanpa bayar di situs. Pesan, simpan ID pesanan, lalu pantau prosesnya."
        facts={[
          { value: '3 langkah', label: 'pesan, jemput, pantau', tone: 'inverse' },
          { value: '09:00–18:00', label: 'setiap hari, WIB', tone: 'primary' },
        ]}
      />
      <HowItWorks />
      <InfoSection
        id="status-judul"
        eyebrow="Status pesanan"
        title="Lima status yang akan Anda lihat"
        description="Status berubah saat pemilik memperbarui pesanan. Buka halaman Lacak dengan ID pesanan untuk melihatnya."
        className="bg-accent"
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {STATUSES.map((s, i) => (
            <li
              key={s.status}
              data-reveal
              className="flex flex-col items-start gap-3 rounded-lg border border-border bg-background p-4 lg:p-6"
            >
              <p className="text-xs font-medium text-muted-foreground">Langkah {i + 1}</p>
              <StatusBadge
                status={s.status}
                className="h-8 gap-1.5 px-2.5 text-sm [&_svg]:size-4"
              />
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </InfoSection>
      <InfoSection
        id="praktis-judul"
        eyebrow="Antar-jemput & pembayaran"
        title="Praktis dari rumah"
      >
        <CatalogError />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {PRACTICAL.map((p) => (
            <IconCard key={p.title} {...p} />
          ))}
        </ul>
      </InfoSection>
      <OrderCta />
    </>
  );
}

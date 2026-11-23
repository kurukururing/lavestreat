import { ArrowRight, ClipboardList, Search, Truck } from 'lucide-react';

import { Container } from '@/components/layout/PublicLayout';
import { SectionHeading } from '@/components/ui/section-heading';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Pilih layanan & jadwal',
    text: 'Pilih layanan, jumlah pasang, dan slot jemput. Total termasuk ongkir tampil sebelum dikirim.',
    short: 'Total termasuk ongkir tampil sebelum dikirim.',
  },
  {
    icon: Truck,
    title: 'Kurir menjemput',
    text: 'Pemilik mengonfirmasi pesanan, lalu kurir mengambil sepatu di alamat Anda.',
    short: 'Setelah dikonfirmasi, kurir datang ke alamat Anda.',
  },
  {
    icon: Search,
    title: 'Pantau & terima',
    text: 'Lacak status dengan ID pesanan, lihat foto sebelum–sesudah, dan unduh nota.',
    short: 'Lacak dengan ID, lihat foto, unduh nota.',
  },
];

/** Bagian "Cara kerja" tiga langkah (Figma 84:3893), dipakai di Beranda (PG-1) dan Cara kerja (PG-8). */
export function HowItWorks() {
  return (
    <section aria-labelledby="cara-judul" className="bg-accent py-9 lg:py-22">
      <Container className="flex flex-col gap-5 lg:gap-10">
        <SectionHeading
          id="cara-judul"
          eyebrow="Cara kerja"
          title="Tiga langkah, sepatu kembali bersih"
        />
        {/* Ponsel: daftar bernomor. Web: tiga kartu dengan panah. */}
        <ol className="flex flex-col gap-4 lg:hidden">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="font-heading text-h3 text-brand-900">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.short}</p>
              </div>
            </li>
          ))}
        </ol>
        <ol className="hidden items-center gap-4 lg:flex">
          {STEPS.map((s, i) => (
            <li key={s.title} className="contents">
              {i > 0 && <ArrowRight className="size-6 shrink-0 text-primary" aria-hidden="true" />}
              <article className="flex min-w-0 flex-1 flex-col gap-3.5 self-stretch rounded-xl bg-background p-6">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-display-lg text-accent" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <s.icon className="size-6" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="font-heading text-h2 text-brand-900">
                  <span className="sr-only">Langkah {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </article>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

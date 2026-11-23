import { useState } from 'react';

import { BeforeAfterShowcase } from '@/features/public/BeforeAfterShowcase';
import { InfoSection, PageHero } from '@/features/public/InfoPage';
import { OrderCta } from '@/features/public/OrderCta';
import { cn } from '@/lib/utils';

// Foto statis milik tim, bukan foto pesanan (PG-9). Nama file: <slug>-sebelum.jpg / -sesudah.jpg.
const photos = import.meta.glob('../../assets/galeri/*.jpg', { eager: true, import: 'default' });
const photo = (slug, side) => photos[`../../assets/galeri/${slug}-${side}.jpg`];

// Urutan dan tag dari Figma Hi-fi (130:6284).
const RESULTS = [
  { slug: 'diadora', name: 'Diadora', services: ['Medium Clean', 'White Clean'] },
  { slug: 'koi', name: 'Koi Putih Pink', services: ['Deep Clean', 'White Clean'] },
  { slug: 'warrior', name: 'Warrior Pink', services: ['Deep Clean'] },
  { slug: 'nb-white-silver', name: 'NB White Silver', services: ['White Clean'] },
  { slug: 'skechers', name: 'Skechers Colorful', services: ['Deep Clean'] },
  { slug: 'sovela', name: 'Sovela', services: ['Deep Clean'] },
  { slug: 'sovela-biru', name: 'Sovela Biru', services: ['Deep Clean'] },
  { slug: 'koii', name: 'Koii White Pink', services: ['White Clean'] },
  { slug: 'nerdy-suede', name: 'Nerdy Suede', services: ['Suede Clean'] },
  { slug: 'sovela-putih', name: 'Sovela Putih', services: ['Deep Clean', 'White Clean'] },
  { slug: 'nb-740', name: 'NB 740', services: ['Medium Clean', 'White Clean'] },
  { slug: 'air-walk', name: 'Air Walk', services: ['Deep Clean'] },
];

// Kategori dan jumlahnya dihitung dari data, urut terbanyak (sama dengan urutan Figma).
const counts = {};
for (const r of RESULTS) for (const s of r.services) counts[s] = (counts[s] ?? 0) + 1;
const CATEGORIES = [
  ['Semua', RESULTS.length],
  ...Object.entries(counts).sort((a, b) => b[1] - a[1]),
];

const photoLabel =
  'absolute top-2 left-2 rounded-full px-3 py-1.5 text-xs font-medium tracking-[0.06em] uppercase';

function ResultCard({ slug, name, services }) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 pt-3 pb-4 shadow-sm">
      <div className="flex gap-2">
        {[
          ['sebelum', 'Sebelum', 'bg-inverse text-inverse-foreground'],
          ['sesudah', 'Sesudah', 'bg-primary text-primary-foreground'],
        ].map(([side, label, tone]) => (
          <div key={side} className="relative h-50 min-w-0 flex-1 overflow-hidden rounded-md">
            <img
              src={photo(slug, side)}
              alt={`${name} ${side} dicuci`}
              loading="lazy"
              className="size-full object-cover"
            />
            <span className={cn(photoLabel, tone)} aria-hidden="true">
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 px-1">
        <h3 className="font-heading text-h3 text-brand-900">{name}</h3>
        <ul className="flex flex-wrap gap-1.5" aria-label="Layanan">
          {services.map((s) => (
            <li
              key={s}
              className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-brand-700"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Galeri PG-9 (Figma 98:5700). Filter kategori di klien, tanpa rute per kategori. */
export function GalleryPage() {
  const [category, setCategory] = useState('Semua');
  const shown =
    category === 'Semua' ? RESULTS : RESULTS.filter((r) => r.services.includes(category));

  return (
    <>
      <PageHero
        label="Galeri"
        title="Hasil kerja kami, sebelum dan sesudah"
        description="Foto asli dari workshop LAVE STREAT. Geser pembanding untuk melihat perbedaannya."
        facts={[
          {
            value: `${RESULTS.length} hasil`,
            label: 'dokumentasi sebelum–sesudah',
            tone: 'inverse',
          },
          { value: 'Foto asli', label: 'dari workshop kami', tone: 'primary' },
        ]}
      />
      <BeforeAfterShowcase />
      <InfoSection
        id="galeri-judul"
        eyebrow="Galeri hasil"
        title="Hasil pengerjaan per kategori layanan"
        description="Pilih kategori untuk menyaring hasil. Pada setiap kartu, foto kiri sebelum dan foto kanan sesudah."
        className="bg-accent"
      >
        <div
          role="group"
          aria-label="Kategori layanan"
          className="relative -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0"
        >
          {CATEGORIES.map(([name, count]) => {
            const active = name === category;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(name)}
                className={cn(
                  'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap outline-none focus-visible:focus-ring',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-brand-900 hover:bg-muted',
                )}
              >
                {name}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs text-brand-700',
                    active ? 'bg-card' : 'bg-accent',
                  )}
                >
                  <span className="sr-only">, </span>
                  {count}
                  <span className="sr-only"> hasil</span>
                </span>
              </button>
            );
          })}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {shown.map((r) => (
            <ResultCard key={r.slug} {...r} />
          ))}
        </ul>
        {/* Figma punya "Muat lebih banyak" (41 hasil); foto yang tersedia baru 12, jadi semuanya tampil. */}
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Menampilkan {shown.length} dari {RESULTS.length} hasil
        </p>
        <p className="rounded-md bg-accent px-4 py-3 text-sm text-brand-700">
          Pemesan bisa melihat foto sebelum–sesudah sepatunya sendiri di halaman Lacak setelah
          status Selesai.
        </p>
      </InfoSection>
      <OrderCta />
    </>
  );
}

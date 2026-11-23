import { useState } from 'react';

import diadoraBefore from '@/assets/galeri/diadora-sebelum.jpg';
import diadoraAfter from '@/assets/galeri/diadora-sesudah.jpg';
import koiBefore from '@/assets/galeri/koi-sebelum.jpg';
import koiAfter from '@/assets/galeri/koi-sesudah.jpg';
import warriorBefore from '@/assets/galeri/warrior-sebelum.jpg';
import warriorAfter from '@/assets/galeri/warrior-sesudah.jpg';
import { Container } from '@/components/layout/PublicLayout';
import { BeforeAfterSlider } from '@/components/ui/before-after';
import { cn } from '@/lib/utils';

// Foto statis milik tim dari workshop, bukan foto pesanan (PG-9).
const SHOES = [
  {
    name: 'Diadora',
    services: 'Medium + White Clean',
    before: diadoraBefore,
    after: diadoraAfter,
  },
  { name: 'Koi Putih Pink', services: 'Deep + White Clean', before: koiBefore, after: koiAfter },
  { name: 'Warrior Pink', services: 'Deep Clean', before: warriorBefore, after: warriorAfter },
];

/**
 * Bagian "Bukti pengerjaan" (Figma 149:7470 web, 149:7666 ponsel): pembanding geser dan pilihan
 * sepatu. Web: daftar pilihan di kiri. Ponsel: pembanding di atas, tiga gambar kecil di bawah.
 */
export function BeforeAfterShowcase({ className }) {
  const [index, setIndex] = useState(0);
  const shoe = SHOES[index];

  const options = SHOES.map((s, i) => {
    const selected = i === index;
    return (
      <li key={s.name} className="min-w-0 flex-1 lg:flex-none">
        <button
          type="button"
          onClick={() => setIndex(i)}
          aria-pressed={selected}
          className={cn(
            'flex w-full flex-col gap-1.5 rounded-2xl border-2 p-1.5 text-left outline-none focus-visible:focus-ring lg:flex-row lg:items-center lg:gap-3 lg:p-2.5',
            selected ? 'border-primary bg-card' : 'border-transparent hover:bg-card/60',
          )}
        >
          <img
            src={s.before}
            alt=""
            loading="lazy"
            className="h-16 w-full rounded-md object-cover lg:size-14 lg:shrink-0"
          />
          <span className="flex min-w-0 flex-col font-medium">
            <span className="text-center text-xs text-brand-900 lg:text-left lg:text-base">
              {s.name}
            </span>
            <span className="hidden text-xs text-muted-foreground lg:block">{s.services}</span>
          </span>
        </button>
      </li>
    );
  });

  return (
    <section aria-labelledby="bukti-judul" className={cn('bg-sand py-9 lg:py-22', className)}>
      <Container className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex flex-col gap-4 lg:w-100 lg:shrink-0">
          <div className="flex flex-col gap-1.5 lg:gap-4">
            <p className="text-xs font-medium tracking-[0.06em] text-brand-700 uppercase">
              Bukti pengerjaan
            </p>
            <h2 id="bukti-judul" className="text-h1 text-brand-900 lg:text-h1-lg">
              Geser untuk membandingkan<span className="hidden lg:inline"> hasilnya</span>
            </h2>
            <p className="hidden text-base text-muted-foreground lg:block">
              Foto asli dari workshop kami. Pilih sepatu di bawah untuk melihat kondisi sebelum dan
              sesudah perawatan.
            </p>
          </div>
          <ul aria-label="Pilih sepatu" className="hidden flex-col gap-4 lg:flex">
            {options}
          </ul>
        </div>
        <BeforeAfterSlider
          key={shoe.name}
          className="h-65 aspect-auto rounded-lg lg:h-115 lg:min-w-0 lg:flex-1 lg:rounded-xl"
          before={{ src: shoe.before, alt: `${shoe.name} sebelum dicuci` }}
          after={{ src: shoe.after, alt: `${shoe.name} sesudah dicuci (${shoe.services})` }}
        />
        <ul aria-label="Pilih sepatu" className="flex gap-2.5 lg:hidden">
          {options}
        </ul>
      </Container>
    </section>
  );
}

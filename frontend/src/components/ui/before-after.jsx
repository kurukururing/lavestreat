import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

import { cn } from '@/lib/utils';

const label =
  'pointer-events-none absolute top-4 rounded-full px-3 py-1.5 text-xs font-medium tracking-[0.06em] uppercase';

/**
 * Pembanding geser sebelum–sesudah (Figma 149:7470 web, 149:7666 ponsel). Foto sesudah ditumpuk
 * di atas dan dipotong dari kiri sesuai posisi gagang. Kontrolnya `input range` asli agar bisa
 * digeser dengan papan ketik (panah kiri/kanan) dan dibacakan pembaca layar.
 * @param {{ before: { src: string, alt: string }, after: { src: string, alt: string } }} props
 */
function BeforeAfterSlider({ before, after, className }) {
  const [pos, setPos] = useState(50);
  return (
    <div
      className={cn(
        'relative aspect-4/3 overflow-hidden rounded-xl shadow-lg select-none lg:aspect-auto lg:h-115',
        className,
      )}
    >
      <img src={before.src} alt={before.alt} className="absolute inset-0 size-full object-cover" />
      <img
        src={after.src}
        alt={after.alt}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      />
      <span className={cn(label, 'left-4 bg-inverse text-inverse-foreground')}>Sebelum</span>
      <span className={cn(label, 'right-4 bg-primary text-primary-foreground')}>Sesudah</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Geser untuk membandingkan foto sebelum dan sesudah"
        aria-valuetext={`${pos}% foto sesudah tersembunyi`}
        className="peer absolute inset-0 z-10 size-full cursor-ew-resize opacity-0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-card"
        style={{ left: `${pos}%` }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 flex size-12 -translate-1/2 items-center justify-center rounded-full bg-card text-brand-900 shadow-md peer-focus-visible:focus-ring"
        style={{ left: `${pos}%` }}
      >
        <ChevronLeft className="size-4.5" />
        <ChevronRight className="size-4.5" />
      </span>
    </div>
  );
}

function PhotoTile({ photo, kind }) {
  const text = kind === 'before' ? 'Sebelum' : 'Sesudah';
  if (!photo) {
    return (
      <div className="flex h-45 flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed border-input bg-muted text-sm text-muted-foreground">
        <ImageOff className="size-5" aria-hidden="true" />
        <span>
          <span className="sr-only">{text}: </span>Foto belum tersedia
        </span>
      </div>
    );
  }
  return (
    <figure className="relative h-45 overflow-hidden rounded-md">
      <img src={photo.src} alt={photo.alt} loading="lazy" className="size-full object-cover" />
      <figcaption
        className={cn(
          'absolute top-2 left-2 rounded-full px-2 py-1 text-xs font-medium tracking-[0.06em] uppercase',
          kind === 'before'
            ? 'bg-inverse text-inverse-foreground'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {text}
      </figcaption>
    </figure>
  );
}

/**
 * Dua foto berdampingan di `/lacak` (DESIGN 6.8): ponsel bertumpuk, ≥ sm dua kolom. Foto yang
 * belum ada diganti kotak putus-putus "Foto belum tersedia".
 * @param {{ before?: { src: string, alt: string } | null, after?: { src: string, alt: string } | null }} props
 */
function BeforeAfterPair({ before, after, className }) {
  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)}>
      <PhotoTile photo={before} kind="before" />
      <PhotoTile photo={after} kind="after" />
    </div>
  );
}

export { BeforeAfterSlider, BeforeAfterPair };

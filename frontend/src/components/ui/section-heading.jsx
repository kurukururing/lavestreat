import { cn } from '@/lib/utils';

/**
 * Judul bagian Beranda: eyebrow huruf kapital biru, judul Poppins, keterangan opsional
 * (Figma 149:7441–7443, "CARA KERJA", "LAYANAN & TARIF").
 * @param {{ eyebrow?: string, title: React.ReactNode, description?: React.ReactNode, id?: string }} props
 */
function SectionHeading({ eyebrow, title, description, id, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {eyebrow && (
        <p className="text-xs font-medium tracking-[0.06em] text-brand-700 uppercase">{eyebrow}</p>
      )}
      <h2 id={id} className="text-h1 text-brand-900 lg:text-h1-lg">
        {title}
      </h2>
      {description && <p className="text-base text-muted-foreground">{description}</p>}
    </div>
  );
}

export { SectionHeading };

import { Link } from 'react-router';

import { Container } from '@/components/layout/PublicLayout';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/lib/utils';

const FACT_TONE = {
  inverse: 'bg-inverse text-inverse-foreground [&_span+span]:text-inverse-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  card: 'border border-border bg-card text-brand-900 [&_span+span]:text-muted-foreground',
};

/**
 * Hero halaman informasi PG-7 sampai PG-10 (Figma "Hero halaman" 97:5381): breadcrumb, label,
 * judul, keterangan, dan 2–3 kartu fakta. Figma hanya punya versi web; ponsel menumpuk kolom.
 * @param {{ label: string, title: string, description: string,
 *   facts: { value: React.ReactNode, label: string, tone: keyof typeof FACT_TONE }[] }} props
 */
export function PageHero({ label, title, description, facts }) {
  return (
    <section
      aria-labelledby="halaman-judul"
      className="bg-accent lg:bg-linear-to-b lg:from-accent lg:to-background"
    >
      <Container className="flex flex-col gap-5 py-7 lg:flex-row lg:items-center lg:gap-12 lg:py-16">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3.5">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <li>
                <Link to="/" className="rounded-sm hover:text-foreground focus-visible:focus-ring">
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{label}</li>
            </ol>
          </nav>
          <p className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-brand-700">
            {label}
          </p>
          <h1 id="halaman-judul" className="text-h1 text-brand-900 lg:text-h1-lg">
            {title}
          </h1>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:flex lg:shrink-0">
          {facts.map((f) => (
            <li
              key={f.label}
              className={cn(
                'flex flex-col gap-1 rounded-lg p-4 odd:last:col-span-2 lg:p-5',
                facts.length > 2 ? 'lg:w-49' : 'lg:w-55',
                FACT_TONE[f.tone],
              )}
            >
              <span className="font-heading text-h2 lg:font-sans lg:text-metric-lg">{f.value}</span>
              <span className="text-sm">{f.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * Bagian berjudul halaman informasi (Figma "Bagian · …": padding 80, jarak judul–isi 32).
 * @param {{ id: string, eyebrow: string, title: string, description?: string }} props
 */
export function InfoSection({ id, eyebrow, title, description, className, children }) {
  return (
    <section aria-labelledby={id} className={cn('py-9 lg:py-20', className)}>
      <Container className="flex flex-col gap-5 lg:gap-8">
        <SectionHeading
          id={id}
          eyebrow={eyebrow}
          title={title}
          description={description}
          className="lg:max-w-200 [&>p:last-child]:lg:max-w-180"
        />
        {children}
      </Container>
    </section>
  );
}

/** Kartu ikon 44 px + judul + teks (Figma "Kartu · …" 97:5930). `children` tampil di bawah teks. */
export function IconCard({ icon: Icon, eyebrow, title, text, className, children }) {
  return (
    <li
      data-reveal
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm lg:p-6',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-md bg-accent text-primary">
        <Icon className="size-5.5" aria-hidden="true" />
      </span>
      {eyebrow && (
        <p className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}
      <h3 className="font-heading text-h3 text-brand-900">{title}</h3>
      <p className="flex-1 text-sm text-muted-foreground">{text}</p>
      {children}
    </li>
  );
}

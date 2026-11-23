import { Clock, Droplets, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router';

import deepCleanSrc from '@/assets/beranda/deep-clean.jpg';
import suedeCleanSrc from '@/assets/beranda/suede-clean.jpg';
import whiteCleanSrc from '@/assets/beranda/white-clean.jpg';
import { Container } from '@/components/layout/PublicLayout';
import { buttonVariants } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { CatalogError, Money } from '@/features/public/Money';
import { useCatalog } from '@/hooks/useCatalog';
import { cn } from '@/lib/utils';

// Keterangan singkat per layanan, disalin dari Figma Hi-fi (84:3942).
const DESC = {
  DEEP: 'Upper, midsole, outsole, insole, dan tali sepatu dicuci menyeluruh.',
  WHITE: 'Bodi dan midsole putih kembali cerah',
  SUEDE: 'Suede & nubuck dengan suede lotion',
  EASY: 'Pembersihan ringan upper dan midsole',
  MEDIUM: 'Bagian luar lebih bersih dan segar',
  LEATHER: 'Bahan kulit dengan leather lotion',
};

/** Tombol "+" bulat ke form pesanan dengan layanan terpilih (Figma "Tambah" 84:3972). */
function AddLink({ code, name }) {
  return (
    <Link
      to="/pesan"
      state={{ service: code }}
      aria-label={`Pesan ${name}`}
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground outline-none hover:bg-border focus-visible:focus-ring"
    >
      <Plus className="size-4.5" aria-hidden="true" />
    </Link>
  );
}

/** Baris nama + harga web, atau "Rp / pasang" saja di ponsel. */
function PriceRow({ code, name }) {
  const { price } = useCatalog();
  return (
    <>
      <p className="text-xs text-muted-foreground lg:hidden">
        <Money value={price(code)} /> / pasang
      </p>
      <div className="hidden items-center justify-between lg:flex">
        <p className="font-heading text-h2 text-brand-900">
          <Money value={price(code)} />
        </p>
        <AddLink code={code} name={name} />
      </div>
    </>
  );
}

function PhotoServiceCard({ code, name, src }) {
  return (
    <article
      data-reveal
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:-translate-y-0.5 hover:shadow-md"
    >
      <img src={src} alt="" loading="lazy" className="h-27.5 w-full object-cover lg:h-37.5" />
      <div className="flex flex-1 flex-col gap-0.5 p-3 lg:gap-1.5 lg:px-4.5 lg:py-4">
        <h3 className="font-sans text-sm font-medium text-brand-900 lg:font-heading lg:text-h3">
          {name}
        </h3>
        <p className="hidden flex-1 text-xs font-medium text-muted-foreground lg:block">
          {DESC[code]}
        </p>
        <PriceRow code={code} name={name} />
      </div>
    </article>
  );
}

function IconServiceCard({ code, name, icon: Icon, className }) {
  return (
    <article
      data-reveal
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-card p-3 lg:gap-2.5 lg:p-5 hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-accent text-primary lg:size-10">
        <Icon className="size-4.5 lg:size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-1 flex-col gap-0.5 lg:gap-2.5">
        <h3 className="font-sans text-sm font-medium text-brand-900 lg:font-heading lg:text-h3">
          {name}
        </h3>
        <p className="hidden flex-1 text-xs font-medium text-muted-foreground lg:block">
          {DESC[code]}
        </p>
        <PriceRow code={code} name={name} />
      </div>
    </article>
  );
}

/**
 * Daftar harga ringkas (Layanan lain, Add-on, Produk perawatan).
 * @param {{ title: string, rows: { code: string, name: string, note: string, webOnly?: boolean }[] }} props
 */
function PriceList({ title, rows, className }) {
  const { price } = useCatalog();
  return (
    <article
      data-reveal
      className={cn('rounded-lg px-4 py-3 font-medium lg:px-5 lg:py-4', className)}
    >
      <h3 className="font-sans text-xs tracking-[0.06em] text-brand-700 uppercase">{title}</h3>
      <dl>
        {rows.map((r) => (
          <div
            key={r.code}
            className={cn(
              'flex items-start justify-between gap-3 border-t border-border py-2.5 first-of-type:mt-3',
              r.webOnly && 'hidden lg:flex',
            )}
          >
            <dt className="min-w-0">
              <span className="block text-sm text-brand-900">{r.name}</span>
              <span className="block text-xs text-muted-foreground">{r.note}</span>
            </dt>
            <dd className="text-sm whitespace-nowrap text-brand-900">
              <Money value={price(r.code)} />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/** Bagian "Layanan & tarif" (Figma 84:3942), dipakai di Beranda (PG-1) dan Layanan (PG-7). */
export function ServiceCatalog() {
  const { price } = useCatalog();
  return (
    <section aria-labelledby="layanan-judul" className="py-9 lg:py-22">
      <Container className="flex flex-col gap-4 lg:gap-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionHeading
            id="layanan-judul"
            eyebrow="Layanan & tarif"
            title="Pilih perawatan sesuai kondisi sepatu"
          />
          <p className="hidden text-sm text-muted-foreground lg:block">
            Harga per pasang · estimasi 1–4 hari
          </p>
        </div>

        <CatalogError />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <article
            data-reveal
            className="relative col-span-2 flex h-55 flex-col items-start justify-end gap-1.5 overflow-hidden rounded-lg p-4 lg:h-80 lg:p-6"
          >
            <img
              src={deepCleanSrc}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute inset-0 photo-scrim" aria-hidden="true" />
            <p className="relative rounded-full bg-highlight px-3 py-1.5 text-xs font-medium text-brand-900">
              Paling lengkap
            </p>
            <h3 className="relative font-heading text-h2 text-inverse-foreground lg:text-h1-lg">
              Deep Clean
            </h3>
            <p className="relative hidden text-sm text-inverse-muted-foreground lg:block">
              {DESC.DEEP}
            </p>
            <div className="relative flex w-full items-center justify-between gap-3">
              <p className="text-base font-medium text-inverse-foreground lg:font-heading lg:text-h2">
                <Money value={price('DEEP')} /> / pasang
              </p>
              <Link
                to="/pesan"
                state={{ service: 'DEEP' }}
                aria-label="Pesan Deep Clean"
                className={buttonVariants()}
              >
                <Plus aria-hidden="true" />
                Pesan
              </Link>
            </div>
          </article>
          <PhotoServiceCard code="WHITE" name="White Clean" src={whiteCleanSrc} />
          <PhotoServiceCard code="SUEDE" name="Suede Clean" src={suedeCleanSrc} />
          <IconServiceCard code="EASY" name="Easy Clean" icon={Droplets} />
          <IconServiceCard code="MEDIUM" name="Medium Clean" icon={Droplets} />
          <IconServiceCard code="LEATHER" name="Leather Clean" icon={Sparkles} />
          <IconServiceCard code="EXPRESS" name="Express Clean" icon={Clock} className="lg:hidden" />
          <PriceList
            title="Layanan lain"
            className="col-span-2 border border-border bg-accent lg:col-span-1 lg:border-0"
            rows={[
              { code: 'BOOTS', name: 'Boots Clean', note: 'Sepatu boots' },
              { code: 'KIDS', name: 'Kids Shoes', note: 'Sepatu anak' },
              { code: 'EXPRESS', name: 'Express Clean', note: 'Selesai 1 hari', webOnly: true },
            ]}
          />
          <PriceList
            title="Add-on (per pasang)"
            className="col-span-2 border border-border bg-accent lg:bg-card"
            rows={[
              { code: 'UNYELLOWING', name: 'Unyellowing Treat', note: '+2 hari kerja' },
              {
                code: 'FASTTRACK',
                name: 'Fast Track',
                note: 'Estimasi 2 hari · tidak bisa digabung Express',
              },
            ]}
          />
          <PriceList
            title="Produk perawatan"
            className="col-span-2 border border-border bg-accent lg:bg-card"
            rows={[
              { code: 'SHOE_CLEANER', name: 'Shoe Cleaner', note: 'Botol 100 ml' },
              { code: 'SHOE_REFRESHER', name: 'Shoe Refresher', note: 'Botol 100 ml' },
            ]}
          />
        </div>
      </Container>
    </section>
  );
}

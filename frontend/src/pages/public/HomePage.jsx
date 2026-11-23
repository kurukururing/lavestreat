import { useState } from 'react';
import {
  BadgeCheck,
  CircleCheck,
  Clock,
  Droplets,
  MapPin,
  Search,
  Sparkles,
  Tag,
  Truck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import heroSrc from '@/assets/beranda/hero-sepatu.jpg';
import teknisiSrc from '@/assets/beranda/teknisi.jpg';
import { Container } from '@/components/layout/PublicLayout';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeading } from '@/components/ui/section-heading';
import { StickyActionBar } from '@/components/ui/sticky-action-bar';
import { BeforeAfterShowcase } from '@/features/public/BeforeAfterShowcase';
import { HowItWorks } from '@/features/public/HowItWorks';
import { Money } from '@/features/public/Money';
import { OrderCta } from '@/features/public/OrderCta';
import { ServiceCatalog } from '@/features/public/ServiceCatalog';
import { ShippingHours } from '@/features/public/ShippingHours';
import { useCatalog } from '@/hooks/useCatalog';

const FEATURES = [
  {
    icon: Sparkles,
    title: '100% manual',
    text: 'Tanpa mesin cuci otomatis yang bisa merusak lem dan jahitan.',
  },
  {
    icon: Droplets,
    title: 'Sesuai material',
    text: 'Leather lotion untuk kulit, suede lotion untuk suede.',
  },
  {
    icon: Truck,
    title: 'Antar-jemput',
    text: 'Kurir ke rumah atau kantor di Sidoarjo dan Surabaya.',
  },
  {
    icon: BadgeCheck,
    title: 'Foto before-after',
    text: 'Lihat hasilnya di halaman lacak setelah selesai.',
  },
];

// Angka dari Figma Hi-fi (keputusan 22 Nov 2026: tanpa label dummy di UI).
const STATS = [
  { value: '23', label: 'pesanan terlayani', short: 'pesanan' },
  { value: '5', label: 'jenis treatment', short: 'treatment' },
  { value: '3', label: 'anggota tim', short: 'anggota tim' },
];

/** Form lacak cepat di hero. ID dibawa lewat state navigasi agar tidak tercatat di URL. */
function QuickTrack() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      setError('Masukkan ID pesanan.');
      return;
    }
    navigate('/lacak', { state: { code: value } });
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex w-full flex-col gap-2.5 rounded-lg border border-border bg-card p-4 shadow-md lg:px-5 lg:py-4.5"
    >
      <label htmlFor="lacak-cepat" className="text-sm font-medium text-brand-900">
        Sudah pesan? Lacak dengan ID<span className="hidden lg:inline"> pesanan</span>
      </label>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Input
            id="lacak-cepat"
            icon={Search}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError('');
            }}
            placeholder="LS-7K3M9QA2"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'lacak-cepat-galat' : undefined}
          />
        </div>
        <Button type="submit">Cari</Button>
      </div>
      {error && (
        <p id="lacak-cepat-galat" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

function Hero() {
  const { minPrice, shipping } = useCatalog();
  return (
    <section
      aria-labelledby="hero-judul"
      className="bg-accent lg:bg-linear-to-b lg:from-accent lg:to-background"
    >
      <Container className="flex flex-col gap-4.5 py-7 lg:flex-row lg:items-center lg:gap-14 lg:py-16">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-4.5 lg:gap-6">
          <p className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-accent-foreground lg:bg-accent">
            <MapPin className="size-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Jasa cuci sepatu · </span>Sidoarjo & Surabaya
          </p>
          <h1
            id="hero-judul"
            className="font-heading text-display text-brand-900 lg:text-display-lg"
          >
            Sepatu bersih lagi, tanpa keluar rumah.
          </h1>
          <p className="text-base text-muted-foreground">
            <span className="lg:hidden">
              Pesan dari ponsel, kurir menjemput, pantau status dan foto hasilnya dengan ID pesanan.
            </span>
            <span className="hidden lg:inline">
              Pesan dari ponsel, kurir menjemput, dan Anda bisa memantau status serta foto hasilnya
              cukup dengan ID pesanan.
            </span>
          </p>
          <div className="hidden gap-3 lg:flex">
            <Link to="/pesan" className={buttonVariants({ className: 'shadow-glow' })}>
              <Truck aria-hidden="true" />
              Pesan Sekarang
            </Link>
            <Link to="/layanan" className={buttonVariants({ variant: 'secondary' })}>
              <Tag aria-hidden="true" />
              Lihat tarif
            </Link>
          </div>
          <QuickTrack />
        </div>

        <div className="flex flex-col gap-4.5 lg:flex-row lg:gap-3">
          <div className="relative flex h-52.5 items-end overflow-hidden rounded-lg p-4 lg:h-109 lg:w-85 lg:rounded-xl lg:p-5">
            <img
              src={heroSrc}
              alt="Sepatu kets putih biru di atas alas, dikelilingi percikan air"
              fetchPriority="high"
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute inset-0 photo-scrim" aria-hidden="true" />
            <p className="relative flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-brand-900">
              <CircleCheck className="size-3.5 text-primary" aria-hidden="true" />
              100% dikerjakan manual
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 lg:flex lg:w-52 lg:flex-col">
            <li className="flex h-30.5 flex-col gap-2.5 rounded-lg bg-inverse p-4 lg:h-34.25 lg:justify-between lg:gap-0 lg:p-4.5">
              <Clock className="size-5 text-highlight lg:size-5.5" aria-hidden="true" />
              <p className="flex flex-col">
                <span className="font-heading text-h2 text-inverse-foreground">1–4 hari</span>
                <span className="text-xs font-medium text-inverse-muted-foreground">
                  estimasi pengerjaan
                </span>
              </p>
            </li>
            <li className="flex flex-col gap-2.5 rounded-lg bg-primary p-4 text-primary-foreground lg:h-34.25 lg:justify-between lg:gap-0 lg:p-4.5">
              <Sparkles className="size-5 lg:size-5.5" aria-hidden="true" />
              <p className="flex flex-col">
                <span className="font-heading text-h2">
                  <span className="hidden lg:inline">Mulai </span>
                  <Money value={minPrice} />
                </span>
                <span className="text-xs font-medium">
                  <span className="lg:hidden">harga mulai, </span>per pasang
                </span>
              </p>
            </li>
            <li className="hidden h-34.25 flex-col justify-between rounded-lg border border-border bg-card p-4.5 lg:flex">
              <Truck className="size-5.5 text-primary" aria-hidden="true" />
              <p className="flex flex-col">
                <span className="font-heading text-h2 text-brand-900">Dijemput kurir</span>
                <span className="text-xs font-medium text-muted-foreground">
                  Sidoarjo <Money value={shipping('sidoarjo')} /> · Surabaya{' '}
                  <Money value={shipping('surabaya')} />
                </span>
              </p>
            </li>
          </ul>
          <div className="rounded-lg border border-border bg-card px-4 py-1.5 lg:hidden">
            <h2 className="sr-only">Ongkir dan jam kerja</h2>
            <ShippingHours compact />
          </div>
        </div>
      </Container>
    </section>
  );
}

function WhyUs() {
  return (
    <section aria-labelledby="kenapa-judul" className="bg-accent py-9 lg:py-22">
      <Container className="flex flex-col gap-4 lg:gap-10">
        <SectionHeading
          id="kenapa-judul"
          eyebrow="Kenapa LAVE STREAT"
          title="Dikerjakan tangan, bukan mesin"
        />
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="hidden h-115 w-72 shrink-0 flex-col justify-between rounded-xl bg-inverse p-7 lg:flex">
            <p className="text-sm font-medium text-inverse-muted-foreground">
              Angka kami sejauh ini
            </p>
            {STATS.map((s) => (
              <p key={s.label} className="flex flex-col">
                <span className="font-heading text-display-lg text-inverse-foreground">
                  {s.value}
                </span>
                <span className="text-sm text-inverse-muted-foreground">{s.label}</span>
              </p>
            ))}
          </div>
          <figure className="relative flex h-60 items-end overflow-hidden rounded-lg p-4 lg:h-115 lg:w-95 lg:shrink-0 lg:rounded-xl lg:p-5">
            <img
              src={teknisiSrc}
              alt="Teknisi workshop Lave Streat tersenyum di depan rak sepatu"
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute inset-0 photo-scrim" aria-hidden="true" />
            <figcaption className="relative hidden text-sm font-medium text-inverse-foreground lg:block">
              Teknisi workshop Lave Streat
            </figcaption>
            <ul className="relative flex w-full gap-2 lg:hidden">
              {STATS.map((s) => (
                <li
                  key={s.label}
                  className="flex min-w-0 flex-1 flex-col rounded-md bg-card px-2.5 py-2"
                >
                  <span className="font-heading text-h2 text-brand-900">{s.value}</span>
                  <span className="text-xs font-medium text-muted-foreground">{s.short}</span>
                </li>
              ))}
            </ul>
          </figure>
          <ul className="grid flex-1 grid-cols-2 gap-3 lg:gap-4">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="flex flex-col gap-2.5 rounded-lg bg-background p-3.5 lg:h-55.5 lg:p-5"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-card text-primary lg:size-11">
                  <f.icon className="size-4.5 lg:size-5.5" aria-hidden="true" />
                </span>
                <span className="hidden flex-1 lg:block" aria-hidden="true" />
                <h3 className="font-sans text-sm font-medium text-brand-900 lg:font-heading lg:text-h3">
                  {f.title}
                </h3>
                <p className="hidden text-sm text-muted-foreground lg:block">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/** Beranda portal pembeli PG-1 (Figma 84:3749 web, 86:3768 ponsel). */
export function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ServiceCatalog />
      <BeforeAfterShowcase />
      <WhyUs />
      <OrderCta />
      <StickyActionBar className="flex-row">
        <Link to="/lacak" className={buttonVariants({ variant: 'secondary', className: 'w-29' })}>
          <Search aria-hidden="true" />
          Lacak
        </Link>
        <Link to="/pesan" className={buttonVariants({ className: 'flex-1' })}>
          <Truck aria-hidden="true" />
          Pesan Sekarang
        </Link>
      </StickyActionBar>
    </>
  );
}

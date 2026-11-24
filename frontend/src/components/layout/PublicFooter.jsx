import { AtSign, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router';

import { Logo } from '@/components/ui/logo';
import { BUSINESS } from '@/lib/business';
import { cn } from '@/lib/utils';

const EXPLORE = [
  { label: 'Layanan & tarif', to: '/layanan' },
  { label: 'Cara kerja', to: '/cara-kerja' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Lacak pesanan', to: '/lacak' },
];

const link =
  'rounded-sm text-sm text-inverse-muted-foreground outline-none hover:text-inverse-foreground focus-visible:focus-ring';

// Ponsel (Figma 86:4112): kolom dilebur jadi satu daftar ikon tanpa judul; Jelajahi disembunyikan.
function Column({ title, className, children }) {
  return (
    <div className={cn('contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-2.5', className)}>
      <h2 className="sr-only font-sans text-xs font-medium tracking-[0.06em] text-inverse-foreground uppercase lg:not-sr-only">
        {title}
      </h2>
      {children}
    </div>
  );
}

function IconLine({ icon: Icon, children }) {
  return (
    <p className="flex items-start gap-2 text-sm text-inverse-muted-foreground">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** Footer navy portal pembeli (Figma 89:3795). Tautan Privasi wajib (SEC-14). */
export function PublicFooter() {
  return (
    <footer className="bg-inverse text-inverse-foreground">
      <div className="mx-auto flex w-full max-w-312 flex-col gap-3 px-4 py-7 lg:gap-7 lg:px-6 lg:py-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:gap-12">
          <div className="flex flex-col gap-3 lg:w-85 lg:shrink-0">
            <Logo tone="dark" />
            <p className="text-sm text-inverse-muted-foreground">
              <span className="lg:hidden">{BUSINESS.taglineShort}</span>
              <span className="hidden lg:inline">{BUSINESS.tagline}</span>
            </p>
          </div>
          <Column title="Jelajahi" className="hidden">
            <ul className="flex flex-col gap-2.5">
              {EXPLORE.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>
          <Column title="Lokasi">
            <IconLine icon={MapPin}>{BUSINESS.address}</IconLine>
            <IconLine icon={Clock}>{BUSINESS.hours}</IconLine>
          </Column>
          <Column title="Kontak">
            <IconLine icon={Phone}>WhatsApp {BUSINESS.whatsapp}</IconLine>
            <IconLine icon={Mail}>{BUSINESS.email}</IconLine>
            <IconLine icon={AtSign}>{BUSINESS.instagram}</IconLine>
          </Column>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          <p className="text-inverse-muted-foreground">© 2026 Lave Streat · data dummy</p>
          <Link
            to="/privasi"
            className="-my-3.5 inline-flex min-h-11 items-center rounded-sm text-inverse-link outline-none hover:underline focus-visible:focus-ring"
          >
            Privasi
          </Link>
        </div>
      </div>
    </footer>
  );
}

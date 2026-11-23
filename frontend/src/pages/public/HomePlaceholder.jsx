import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

// Sementara sampai portal pembeli (PG-1 sampai PG-6) dikerjakan.
export function HomePlaceholder() {
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-screen-sm flex-col items-start justify-center gap-4 p-4">
      <Logo />
      <h1 className="text-h1">LAVE STREAT</h1>
      <p className="text-muted-foreground">
        Prototype dengan data dummy. Portal pembeli sedang disiapkan.
      </p>
      <Link to="/admin" className={buttonVariants()}>
        Masuk panel pemilik
      </Link>
    </section>
  );
}

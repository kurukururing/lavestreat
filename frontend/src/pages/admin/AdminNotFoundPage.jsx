import { Link } from 'react-router';
import { SearchX } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export function AdminNotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title="Halaman tidak ditemukan"
        description="Alamat yang Anda buka tidak ada di panel pemilik."
        action={
          <Link to="/admin" className={buttonVariants()}>
            Ke dasbor
          </Link>
        }
      />
    </Card>
  );
}

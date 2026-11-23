import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

// Figma "Alert" (6:167). Danger memakai role="alert" agar dibacakan pembaca layar.
const TYPES = {
  info: { icon: Info, className: 'bg-accent text-accent-foreground' },
  success: { icon: CircleCheck, className: 'bg-success-bg text-success' },
  warning: { icon: TriangleAlert, className: 'bg-warning-bg text-warning' },
  danger: { icon: CircleAlert, className: 'bg-danger-bg text-danger' },
  loading: { icon: LoaderCircle, className: 'bg-accent text-accent-foreground' },
};

/**
 * Pemberitahuan inline. `title` opsional (baris tebal), `children` isi.
 * @param {{ type?: 'info'|'success'|'warning'|'danger'|'loading', title?: React.ReactNode }} props
 */
function Alert({ type = 'info', title, children, className, ...props }) {
  const { icon: Icon, className: tone } = TYPES[type];
  return (
    <div
      role={type === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md px-4 py-3 text-sm', tone, className)}
      {...props}
    >
      <Icon
        className={cn('mt-0.5 size-5 shrink-0', type === 'loading' && 'animate-spin')}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

/** Bar "Menyiapkan layanan…" saat API atau layanan AI masih bangun (NFR-04, EC-19). */
function ColdStartNotice({ className }) {
  return (
    <Alert type="loading" className={className}>
      Menyiapkan layanan…
    </Alert>
  );
}

export { Alert, ColdStartNotice };

import { STATUS_LABELS } from '@lavestreat/shared';

import { STATUS_STYLES } from '@/lib/status';
import { cn } from '@/lib/utils';

/**
 * Badge status pesanan. Menerima nilai database (`done` = "Selesai", `completed` = "Diambil/Diantar").
 * @param {{ status: keyof typeof STATUS_STYLES, className?: string }} props
 */
function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status];
  if (!style) return null;
  const Icon = style.icon;
  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap',
        style.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Pil hitungan "Menunggu konfirmasi" di sidebar (Figma CountBadge 6:125). */
function CountBadge({ count, label, className }) {
  return (
    <span
      aria-label={label}
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-warning-bg px-1.5 text-xs font-semibold text-warning',
        className,
      )}
    >
      {count}
    </span>
  );
}

export { StatusBadge, CountBadge };

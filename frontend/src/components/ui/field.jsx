import { cloneElement, useId } from 'react';
import { CircleAlert } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Label di atas, kontrol, lalu teks bantu atau galat di bawah (DESIGN 6.2, Figma Input 5:166).
 * Galat memakai ikon + teks, bukan hanya warna border. `children` adalah satu elemen kontrol
 * (Input, Textarea, SelectTrigger) yang diberi id dan atribut aria secara otomatis.
 */
function Field({ label, helper, error, className, children }) {
  const id = useId();
  const messageId = `${id}-msg`;
  const hasMessage = Boolean(error || helper);
  const control = cloneElement(children, {
    id: children.props.id ?? id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': hasMessage ? messageId : undefined,
  });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={children.props.id ?? id}>{label}</Label>
      {control}
      {error ? (
        <p
          id={messageId}
          role="alert"
          className="flex items-center gap-1 text-xs font-medium text-danger"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p id={messageId} className="text-xs font-medium text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export { Field };

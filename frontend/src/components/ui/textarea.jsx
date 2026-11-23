import { fieldBase } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, 'min-h-24 py-3', className)}
      {...props}
    />
  );
}

export { Textarea };

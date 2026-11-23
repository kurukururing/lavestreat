import { CircleAlert, CircleCheck } from 'lucide-react';
import { Toaster as Sonner } from 'sonner';

// Figma "Toast" (6:185): kartu putih, border, shadow-md. Berhasil hilang 4 detik (DESIGN 6.5).
function Toaster(props) {
  return (
    <Sonner
      position="top-center"
      duration={4000}
      icons={{
        success: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
        error: <CircleAlert className="size-5 text-danger" aria-hidden="true" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            '!rounded-md !border !border-border !bg-card !px-4 !py-3 !text-sm !font-medium !text-foreground !shadow-md',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

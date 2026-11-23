import { useRef } from 'react';
import { CircleCheck, ImagePlus, LoaderCircle, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Area unggah (Figma UploadArea 6:259). Hanya memilih berkas; validasi, kompres, dan unggah
 * dilakukan pemanggil lewat `onFiles` (DESIGN 6.6).
 */
function UploadArea({ onFiles, hint, multiple = true, disabled = false, className }) {
  const inputRef = useRef(null);
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed border-primary bg-brand-50 px-4 py-6 text-center',
        disabled && 'opacity-50',
        className,
      )}
    >
      <ImagePlus className="size-6 text-accent-foreground" aria-hidden="true" />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex h-11 items-center rounded-md border border-border bg-card px-4 text-base font-semibold text-foreground outline-none hover:bg-muted focus-visible:focus-ring disabled:pointer-events-none"
      >
        Pilih foto
      </button>
      {hint && <p className="text-xs font-medium text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/**
 * Status unggah per berkas (Figma UploadItem 6:329, EC-15).
 * @param {{ name: string, status: 'waiting'|'uploading'|'success'|'failed', progress?: number, sizeLabel?: string, onRetry?: () => void }} props
 */
function UploadItem({ name, status, progress = 0, sizeLabel, onRetry, className }) {
  const failed = status === 'failed';
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border bg-card p-3',
        failed ? 'border-danger' : 'border-border',
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
        <ImagePlus className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1" aria-live="polite">
        <p className="truncate text-sm font-medium">{name}</p>
        {status === 'waiting' && <p className="text-xs text-muted-foreground">Menunggu…</p>}
        {status === 'uploading' && (
          <>
            <p className="text-xs text-muted-foreground">Mengunggah {Math.round(progress)}%</p>
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Mengunggah ${name}`}
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
        {status === 'success' && (
          <p className="text-xs font-medium text-success">
            Berhasil{sizeLabel ? ` · ${sizeLabel}` : ''}
          </p>
        )}
        {failed && <p className="text-xs font-medium text-danger">Gagal mengunggah</p>}
      </div>
      {(status === 'waiting' || status === 'uploading') && (
        <LoaderCircle
          className="size-5 shrink-0 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      )}
      {status === 'success' && (
        <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
      )}
      {failed && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium text-accent-foreground outline-none hover:bg-muted focus-visible:focus-ring"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Ulang
        </button>
      )}
    </div>
  );
}

/**
 * Slot foto 4:3 (Figma PhotoSlot 6:350). Tanpa `src`: kotak putus-putus "Foto belum tersedia" (DESIGN 6.8).
 */
function PhotoSlot({ label, src, alt, className }) {
  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      {label && <figcaption className="text-sm font-medium">{label}</figcaption>}
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="aspect-4/3 w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted p-2 text-center text-xs text-muted-foreground">
          <ImagePlus className="size-5" aria-hidden="true" />
          Foto belum tersedia
        </div>
      )}
    </figure>
  );
}

export { UploadArea, UploadItem, PhotoSlot };

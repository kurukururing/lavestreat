import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deletePhoto, photoUrl, uploadPhoto } from '@/api/admin';
import { errorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UploadItem } from '@/components/ui/photo-upload';
import { PHOTO_MAX_BYTES, PHOTO_TYPES, formatBytes, shrinkPhoto } from '@/lib/image';
import { isFinal } from '@/lib/status';
import { cn, newId } from '@/lib/utils';

const GROUPS = [
  { kind: 'before_customer', label: 'Dari pembeli · hanya admin', max: 3, readOnly: true },
  { kind: 'before', label: 'Sebelum cuci', max: 5 },
  { kind: 'after', label: 'Sesudah cuci', max: 5 },
];

/**
 * Foto pesanan (FR-03, AC-03.1 sampai AC-03.3). Unggah satu berkas per permintaan agar status
 * per berkas jelas (EC-15). Dikunci setelah Diambil/Diantar atau Dibatalkan.
 */
export function PhotosCard({ order, onPhotosChange, className }) {
  const locked = isFinal(order.status);
  const [uploads, setUploads] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const patchUpload = (key, patch) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));

  async function send(upload) {
    patchUpload(upload.key, { status: 'uploading', progress: 0 });
    try {
      const file = await shrinkPhoto(upload.file);
      const res = await uploadPhoto(order.id, upload.kind, file, (progress) =>
        patchUpload(upload.key, { progress }),
      );
      onPhotosChange((photos) => [...photos, ...res.photos]);
      setUploads((list) => list.filter((u) => u.key !== upload.key));
      toast.success('Foto diunggah.');
    } catch (err) {
      patchUpload(upload.key, { status: 'failed', message: errorMessage(err) });
    }
  }

  function handleFiles(kind, files, free) {
    const accepted = [];
    for (const file of files) {
      if (!PHOTO_TYPES.includes(file.type)) {
        toast.error(`${file.name}: format harus JPEG, PNG, atau WebP.`);
      } else if (file.size > PHOTO_MAX_BYTES) {
        toast.error(`${file.name}: ukuran lebih dari 5 MB.`);
      } else accepted.push(file);
    }
    if (accepted.length > free)
      toast.error(`Maksimal 5 foto per jenis. ${accepted.length - free} foto dilewati.`);
    const batch = accepted
      .slice(0, free)
      .map((file) => ({ key: newId(), kind, file, status: 'waiting', progress: 0 }));
    setUploads((list) => [...list, ...batch]);
    // Berurutan agar tidak membebani server free tier.
    batch.reduce((chain, u) => chain.then(() => send(u)), Promise.resolve());
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deletePhoto(order.id, toDelete.id);
      onPhotosChange((photos) => photos.filter((p) => p.id !== toDelete.id));
      toast.success('Foto dihapus.');
      setToDelete(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Foto gagal dihapus.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      <CardTitle
        subtitle={
          order.status === 'done' || order.status === 'completed'
            ? 'Sebelum dan sesudah tampil di halaman lacak pembeli dan di nota.'
            : 'JPEG/PNG/WebP, maks. 5 per jenis. EXIF dihapus otomatis.'
        }
      >
        Foto
      </CardTitle>
      <div className="flex flex-col gap-5 md:flex-row md:flex-wrap md:gap-6">
        {GROUPS.map((group) => {
          const photos = order.photos.filter((p) => p.kind === group.kind);
          const busy = uploads.filter((u) => u.kind === group.kind && u.status !== 'failed').length;
          const free = group.max - photos.length - busy;
          const canUpload = !group.readOnly && !locked && free > 0;
          if (group.readOnly && photos.length === 0) return null;
          return (
            <section key={group.kind} className="flex flex-col gap-2" aria-label={group.label}>
              <h3 className="flex items-center gap-2 text-sm font-medium">
                {group.label}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {photos.length} / {group.max}
                </span>
              </h3>
              <ul className="flex flex-wrap gap-2">
                {photos.map((photo, i) => (
                  <li key={photo.id} className="relative">
                    <a
                      href={photoUrl(order.id, photo.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-md outline-none focus-visible:focus-ring"
                    >
                      <img
                        src={photoUrl(order.id, photo.id)}
                        alt={`${group.label} ${i + 1}`}
                        loading="lazy"
                        className="h-28 w-32 rounded-md bg-muted object-cover"
                      />
                    </a>
                    {!group.readOnly && !locked && (
                      <button
                        type="button"
                        onClick={() => setToDelete({ ...photo, label: `${group.label} ${i + 1}` })}
                        className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-full bg-card/90 text-danger shadow-sm outline-none hover:bg-card focus-visible:focus-ring"
                        aria-label={`Hapus ${group.label.toLowerCase()} ${i + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
                {canUpload && (
                  <UploadSlot
                    onFiles={(files) => handleFiles(group.kind, files, free)}
                    label={group.label}
                  />
                )}
              </ul>
            </section>
          );
        })}
      </div>
      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2">
          {uploads.map((u) => (
            <li key={u.key}>
              <UploadItem
                name={u.file.name}
                status={u.status}
                progress={u.progress}
                sizeLabel={formatBytes(u.file.size)}
                onRetry={() => send(u)}
              />
              {u.status === 'failed' && u.message && (
                <p className="mt-1 text-xs text-danger">{u.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {locked && (
        <p className="text-xs font-medium text-muted-foreground">
          Foto tidak dapat diubah setelah pesanan{' '}
          {order.status === 'cancelled' ? 'dibatalkan' : 'diambil/diantar'}.
        </p>
      )}

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus foto?</DialogTitle>
            <DialogDescription>{toDelete?.label} akan dihapus permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              loading={deleting}
              loadingText="Menghapus…"
            >
              Hapus foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function UploadSlot({ onFiles, label }) {
  const inputRef = useRef(null);
  return (
    <li>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-28 w-32 flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed border-input bg-muted text-xs font-medium text-muted-foreground outline-none hover:border-primary hover:text-accent-foreground focus-visible:focus-ring"
        aria-label={`Unggah foto ${label.toLowerCase()}`}
      >
        <ImagePlus className="size-5" aria-hidden="true" />
        Unggah foto
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </li>
  );
}

import { useState } from 'react';
import { STATUS_LABELS } from '@lavestreat/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

/**
 * Dialog dengan satu isian teks wajib: batal (5–200, AC-02.6) dan koreksi mundur (wajib, ≤ 200).
 * Isian dikosongkan setiap kali dialog dibuka ulang (komponen dalam dipasang ulang).
 */
function ReasonDialog({ open, onOpenChange, ...props }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <ReasonForm onCancel={() => onOpenChange(false)} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function ReasonForm({
  title,
  description,
  label,
  helper,
  min,
  submitLabel,
  destructive,
  onSubmit,
  onCancel,
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return setError(`${label} wajib diisi.`);
    if (value.length < min) return setError(`Minimal ${min} karakter.`);
    setSaving(true);
    const ok = await onSubmit(value);
    if (!ok) setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <Field label={label} helper={helper} error={error}>
        <Textarea
          rows={3}
          maxLength={200}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          autoFocus
        />
      </Field>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Kembali
        </Button>
        <Button
          type="submit"
          variant={destructive ? 'destructive' : 'primary'}
          loading={saving}
          loadingText="Menyimpan…"
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CancelDialog({ open, onOpenChange, code, onSubmit }) {
  return (
    <ReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Batalkan pesanan ${code}?`}
      description="Pesanan yang dibatalkan tidak dapat diaktifkan lagi. Alasan tercatat di riwayat."
      label="Alasan pembatalan"
      helper="Wajib, 5–200 karakter."
      min={5}
      submitLabel="Batalkan Pesanan"
      destructive
      onSubmit={onSubmit}
    />
  );
}

export function RevertDialog({ open, onOpenChange, to, onSubmit }) {
  return (
    <ReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Mundur ke ${STATUS_LABELS[to] ?? ''}?`}
      description={`Koreksi status satu langkah. Catatan wajib dan tercatat di riwayat.${to === 'processing' ? ' Waktu selesai akan dikosongkan.' : ''}`}
      label="Catatan koreksi"
      helper="Maksimal 200 karakter."
      min={1}
      submitLabel="Simpan koreksi"
      onSubmit={onSubmit}
    />
  );
}

/** AC-02.10: `updated_at` usang. Satu-satunya jalan keluar adalah memuat ulang data. */
export function ConflictDialog({ open, onReload }) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Pesanan diubah di tempat lain</DialogTitle>
          <DialogDescription>
            Data yang Anda lihat sudah usang. Muat ulang untuk melihat versi terbaru, lalu ulangi
            perubahan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onReload}>Muat Ulang</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const WARNING_TEXT = {
  missing_before_photo: 'Foto sebelum',
  missing_after_photo: 'Foto sesudah',
};

/** AC-03.5: konfirmasi unduh nota saat foto before atau after belum ada. */
export function MissingPhotoDialog({ warnings, onOpenChange, onConfirm }) {
  const names = (warnings ?? []).map((w) => WARNING_TEXT[w] ?? w);
  return (
    <Dialog open={Boolean(warnings?.length)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Foto belum lengkap</DialogTitle>
          <DialogDescription>
            {names.join(' dan ')} belum diunggah. Nota akan memuat kotak “Foto belum tersedia”.
            Tetap unduh?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Kembali
          </Button>
          <Button onClick={onConfirm}>Tetap Unduh</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

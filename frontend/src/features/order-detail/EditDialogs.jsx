import { useState } from 'react';

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
import { ItemsEditor, ScheduleFields } from '@/features/order-form/OrderFormFields';
import { toItemsBody, validateItems, validateSchedule } from '@/features/order-form/order-form';

/** Bungkus dialog form; isi dipasang ulang setiap dibuka agar nilai awal selalu dari pesanan. */
function EditDialog({ open, onOpenChange, title, description, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && children}
      </DialogContent>
    </Dialog>
  );
}

function Footer({ onCancel, saving }) {
  return (
    <DialogFooter>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
        Kembali
      </Button>
      <Button type="submit" loading={saving} loadingText="Menyimpan…">
        Simpan perubahan
      </Button>
    </DialogFooter>
  );
}

/** Ubah item (ADM-07 `items`). Total dihitung ulang server dari katalog (AC-02.7). */
export function ItemsEditDialog({ open, onOpenChange, order, onSave }) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ubah item"
      description="Harga dan total dihitung ulang dari katalog saat disimpan."
    >
      <ItemsForm order={order} onSave={onSave} onCancel={() => onOpenChange(false)} />
    </EditDialog>
  );
}

function ItemsForm({ order, onSave, onCancel }) {
  const [items, setItems] = useState(() =>
    order.items.map((l) => ({ key: l.id, catalog_code: l.catalog_code, qty: l.qty })),
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const found = validateItems(items);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const serverErrors = await onSave({ items: toItemsBody(items) });
    if (serverErrors) {
      setErrors(serverErrors);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <ItemsEditor items={items} onChange={setItems} errors={errors} />
      <Footer onCancel={onCancel} saving={saving} />
    </form>
  );
}

/** Ubah jadwal, metode, alamat, dan catatan pembeli (ADM-07). */
export function ScheduleEditDialog({ open, onOpenChange, order, onSave }) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ubah jadwal & metode"
      description="Ongkir dihitung ulang server sesuai area."
    >
      <ScheduleForm order={order} onSave={onSave} onCancel={() => onOpenChange(false)} />
    </EditDialog>
  );
}

function ScheduleForm({ order, onSave, onCancel }) {
  const [value, setValue] = useState(() => ({
    fulfillment: order.fulfillment,
    area: order.area,
    scheduled_date: order.scheduled_date,
    scheduled_slot: order.scheduled_slot,
    address_text: order.address_text ?? '',
  }));
  const [notes, setNotes] = useState(order.customer_notes ?? '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const found = validateSchedule(value);
    // Jadwal lama yang sudah lewat boleh dipertahankan; hanya tanggal yang diubah yang dicek.
    if (value.scheduled_date === order.scheduled_date) delete found.scheduled_date;
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const pickup = value.fulfillment === 'pickup';
    const serverErrors = await onSave({
      fulfillment: value.fulfillment,
      area: pickup ? value.area : null,
      address_text: pickup ? value.address_text.trim() : null,
      scheduled_date: value.scheduled_date,
      scheduled_slot: value.scheduled_slot,
      customer_notes: notes.trim() || null,
    });
    if (serverErrors) {
      setErrors(serverErrors);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <ScheduleFields value={value} onChange={setValue} errors={errors} />
      <Field label="Catatan pembeli" helper="Maksimal 500 karakter." error={errors.customer_notes}>
        <Textarea
          rows={2}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <Footer onCancel={onCancel} saving={saving} />
    </form>
  );
}

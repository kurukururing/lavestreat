import { CalendarDays, Footprints, Plus, Store, Trash2, Truck } from 'lucide-react';
import { SLOTS } from '@lavestreat/shared';

import { Button } from '@/components/ui/button';
import { SlotChip } from '@/components/ui/chip';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { OptionCard } from '@/components/ui/option-card';
import { QtyStepper } from '@/components/ui/qty-stepper';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AREAS, MAX_ADVANCE_DAYS, ORDERABLE, catalogName } from '@/features/order-form/order-form';
import { Money } from '@/features/public/Money';
import { useCatalog } from '@/hooks/useCatalog';
import { addDays, todayJakarta } from '@/lib/format';
import { cn, newId } from '@/lib/utils';

/** Penanda field hasil AI yang perlu diperiksa (FR-07, AC-07.3): border putus-putus + "Periksa". */
export function CheckFlag({ show, children, hint }) {
  if (!show) return children;
  return (
    <div className="flex flex-col gap-1.5 rounded-md border-[1.5px] border-dashed border-warning p-2">
      {children}
      <p className="text-xs font-medium text-warning">
        <span className="mr-1 rounded-sm bg-warning-bg px-1.5 py-0.5 font-semibold">Periksa</span>
        {hint ?? 'Belum terbaca dari chat, isi manual.'}
      </p>
    </div>
  );
}

/**
 * Daftar item: pilih katalog, jumlah 1–10, harga baris, hapus (Figma 45:1819 kartu "Item").
 * @param {{ items: { key: string, catalog_code: string, qty: number }[], onChange: Function, errors?: Record<string,string>, flagged?: boolean }} props
 */
export function ItemsEditor({ items, onChange, errors = {}, flagged = false }) {
  const { price, lineTotal } = useCatalog();
  const update = (key, patch) =>
    onChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  const used = new Set(items.map((i) => i.catalog_code));

  return (
    <CheckFlag show={flagged} hint="Item belum terbaca dari chat, pilih manual.">
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div
            key={item.key}
            className="flex flex-wrap items-end gap-3 border-b border-border pb-3 last:border-0 sm:flex-nowrap"
          >
            <Field
              label={`Item ${i + 1}`}
              error={errors[`items[${i}].catalog_code`]}
              className="min-w-0 basis-full sm:flex-1"
            >
              <Select
                value={item.catalog_code || undefined}
                onValueChange={(v) => update(item.key, { catalog_code: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih layanan" />
                </SelectTrigger>
                <SelectContent>
                  {['service', 'addon'].map((type) => (
                    <SelectGroup key={type}>
                      <SelectLabel>{type === 'service' ? 'Layanan' : 'Tambahan'}</SelectLabel>
                      {ORDERABLE.filter((c) => c.type === type).map((c) => (
                        <SelectItem
                          key={c.code}
                          value={c.code}
                          disabled={used.has(c.code) && c.code !== item.catalog_code}
                        >
                          {c.name} · <Money value={price(c.code)} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <QtyStepper
              value={item.qty}
              min={1}
              max={10}
              onChange={(qty) => update(item.key, { qty })}
              itemName={catalogName(item.catalog_code) || `item ${i + 1}`}
            />
            <p className="ml-auto flex h-11 min-w-24 items-center justify-end font-semibold">
              <Money value={item.catalog_code ? lineTotal(item.catalog_code, item.qty) : 0} />
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={items.length === 1}
              onClick={() => onChange(items.filter((it) => it.key !== item.key))}
              aria-label={`Hapus item ${i + 1}`}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
        {errors.items && <p className="text-xs font-medium text-danger">{errors.items}</p>}
        <Button
          type="button"
          variant="link"
          className="w-fit"
          disabled={items.length >= ORDERABLE.length}
          onClick={() => onChange([...items, { key: newId(), catalog_code: '', qty: 1 }])}
        >
          <Plus aria-hidden="true" />
          Tambah item
        </Button>
      </div>
    </CheckFlag>
  );
}

/**
 * Metode, area, tanggal, slot, dan alamat (BR-03, BR-05, AC-01.4).
 * `value`: `{ fulfillment, area, scheduled_date, scheduled_slot, address_text }`.
 * `flagged`: set nama field yang perlu diperiksa setelah isi otomatis AI.
 */
export function ScheduleFields({ value, onChange, errors = {}, flagged = new Set() }) {
  const today = todayJakarta();
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <CheckFlag show={flagged.has('fulfillment')}>
        <div role="radiogroup" aria-label="Metode" className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            icon={Truck}
            title="Dijemput kurir"
            description="Ongkir sesuai area"
            selected={value.fulfillment === 'pickup'}
            onClick={() => set({ fulfillment: 'pickup' })}
          />
          <OptionCard
            icon={Store}
            title="Antar sendiri"
            description="Tanpa ongkir"
            selected={value.fulfillment === 'dropoff'}
            onClick={() => set({ fulfillment: 'dropoff', area: null })}
          />
        </div>
      </CheckFlag>
      {errors.fulfillment && (
        <p className="text-xs font-medium text-danger">{errors.fulfillment}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {value.fulfillment === 'pickup' && (
          <CheckFlag show={flagged.has('area')} hint="Area tidak disebut di chat.">
            <Field label="Area" error={errors.area}>
              <Select value={value.area ?? undefined} onValueChange={(area) => set({ area })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih area" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CheckFlag>
        )}
        <CheckFlag show={flagged.has('scheduled_date')} hint="Tanggal belum pasti dari chat.">
          <Field label="Tanggal" error={errors.scheduled_date}>
            <Input
              type="date"
              icon={CalendarDays}
              min={today}
              max={addDays(today, MAX_ADVANCE_DAYS)}
              value={value.scheduled_date ?? ''}
              onChange={(e) => set({ scheduled_date: e.target.value })}
            />
          </Field>
        </CheckFlag>
      </div>

      <CheckFlag show={flagged.has('scheduled_slot')}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Slot</legend>
          <div role="radiogroup" aria-label="Slot" className="flex gap-2">
            {SLOTS.map((s) => (
              <SlotChip
                key={s.code}
                label={s.label}
                hint={`${s.start}–${s.end}`}
                selected={value.scheduled_slot === s.code}
                onClick={() => set({ scheduled_slot: s.code })}
              />
            ))}
          </div>
          {errors.scheduled_slot && (
            <p className="text-xs font-medium text-danger">{errors.scheduled_slot}</p>
          )}
        </fieldset>
      </CheckFlag>

      {value.fulfillment === 'pickup' && (
        <Field
          label="Alamat penjemputan"
          helper="Wajib bila dijemput · 10–300 karakter"
          error={errors.address_text}
        >
          <Textarea
            rows={3}
            maxLength={300}
            value={value.address_text ?? ''}
            onChange={(e) => set({ address_text: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}

/** Ikon petak kecil untuk baris item (Figma tabel item). */
export function ItemTile({ className }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <Footprints className="size-4.5" />
    </span>
  );
}

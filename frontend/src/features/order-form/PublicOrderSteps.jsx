import { useRef } from 'react';
import { CalendarDays, FileText, MapPin, Phone, Store, Truck, User } from 'lucide-react';
import { CATALOG, SLOTS } from '@lavestreat/shared';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { SlotChip } from '@/components/ui/chip';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ItemRow } from '@/components/ui/item-row';
import { OptionCard } from '@/components/ui/option-card';
import { UploadArea, UploadItem } from '@/components/ui/photo-upload';
import { ServiceAccordion, ServiceAccordionItem } from '@/components/ui/service-accordion';
import { SummaryDivider, SummaryList, SummaryRow } from '@/components/ui/summary-list';
import { Textarea } from '@/components/ui/textarea';
import { AREAS, MAX_ADVANCE_DAYS, slotPassed } from '@/features/order-form/order-form';
import {
  CATEGORIES,
  DESC,
  IMAGES,
  addMoney,
  byCode,
  methodText,
  shippingLabel,
  slotText,
  unitOf,
  wording,
} from '@/features/order-form/public-order';
import { Money } from '@/features/public/Money';
import { useCatalog } from '@/hooks/useCatalog';
import { addDays, formatDateLongWeekday, formatRupiah, todayJakarta } from '@/lib/format';
import { cn } from '@/lib/utils';

/* ---------- Langkah 1: layanan ---------- */

export function StepItems({ qty, onChange, defaultOpen }) {
  const { price, minPrice } = useCatalog();
  const pairs = CATALOG.filter((c) => c.type === 'service').reduce(
    (s, c) => s + (qty[c.code] ?? 0),
    0,
  );
  const maxFor = (code) => (byCode[code].type === 'addon' ? Math.min(10, pairs) : 10);

  return (
    <section aria-labelledby="judul-langkah" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="judul-langkah" className="text-h2 text-brand-900">
          Pilih layanan
        </h2>
        <p className="text-sm text-muted-foreground">
          Buka kategori lalu atur jumlah pasang (1–10). Add-on dan produk opsional.
        </p>
      </div>
      <ServiceAccordion defaultValue={defaultOpen}>
        {CATEGORIES.map((cat) => {
          // Item nonaktif di server (harga `null` setelah katalog termuat) tidak ditawarkan.
          const codes = cat.codes.filter((code) => price(code) !== null || minPrice === null);
          const min = codes.map(price).filter((p) => typeof p === 'number');
          const from =
            ['addon', 'product'].includes(cat.value) || !min.length
              ? ''
              : ` · mulai ${formatRupiah(Math.min(...min))}`;
          return (
            <ServiceAccordionItem
              key={cat.value}
              value={cat.value}
              icon={cat.icon}
              title={cat.title}
              description={cat.short + from}
              selectedCount={codes.filter((c) => qty[c] > 0).length}
            >
              {codes.map((code) => (
                <ItemRow
                  key={code}
                  name={byCode[code].name}
                  description={DESC[code]}
                  price={<Money value={price(code)} />}
                  unit={unitOf(code)}
                  image={IMAGES[code]}
                  icon={cat.icon}
                  qty={qty[code] ?? 0}
                  max={maxFor(code)}
                  onQtyChange={(n) => onChange({ ...qty, [code]: n })}
                />
              ))}
            </ServiceAccordionItem>
          );
        })}
      </ServiceAccordion>
    </section>
  );
}

/* ---------- Langkah 2: metode ---------- */

export function StepMethod({ value, onChange, errors, orderType }) {
  const { shipping } = useCatalog();
  const w = wording(orderType);
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="judul-langkah" className="flex flex-col gap-3">
        <h2 id="judul-langkah" className="text-h2 text-brand-900">
          {w.question}
        </h2>
        <div role="radiogroup" aria-label="Metode" className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            icon={Truck}
            title={w.pickup}
            description={w.pickupDesc}
            selected={value.fulfillment === 'pickup'}
            onClick={() => onChange({ ...value, fulfillment: 'pickup' })}
          />
          <OptionCard
            icon={Store}
            title={w.dropoff}
            description={w.dropoffDesc}
            selected={value.fulfillment === 'dropoff'}
            onClick={() => onChange({ fulfillment: 'dropoff', area: null })}
          />
        </div>
        {errors.fulfillment && <ErrorText>{errors.fulfillment}</ErrorText>}
      </section>

      {value.fulfillment === 'pickup' && (
        <section aria-labelledby="judul-area" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="judul-area" className="text-h2 text-brand-900">
              {w.area}
            </h2>
            <p className="text-sm text-muted-foreground">Ongkir dihitung sekali per pesanan.</p>
          </div>
          <div role="radiogroup" aria-label={w.area} className="grid gap-3 sm:grid-cols-2">
            {AREAS.map((a) => (
              <OptionCard
                key={a.value}
                icon={MapPin}
                title={a.label}
                description={
                  <>
                    Ongkir <Money value={shipping(a.value)} />
                  </>
                }
                selected={value.area === a.value}
                onClick={() => onChange({ ...value, area: a.value })}
              />
            ))}
          </div>
          {errors.area && <ErrorText>{errors.area}</ErrorText>}
        </section>
      )}
    </div>
  );
}

function ErrorText({ children }) {
  return (
    <p role="alert" className="text-xs font-medium text-danger">
      {children}
    </p>
  );
}

/* ---------- Langkah 3: data & jadwal ---------- */

/**
 * @param {{ value: object, onChange: Function, fulfillment: 'pickup'|'dropoff', errors: Record<string,string>,
 *   photos: { id: string, name: string, status: string, size?: string, error?: string }[],
 *   onAddPhotos: (files: File[]) => void, onRemovePhoto: (id: string) => void, photoDetail?: string }} props
 */
export function StepData({
  value,
  onChange,
  fulfillment,
  orderType,
  errors,
  photos,
  onAddPhotos,
  onRemovePhoto,
  photoDetail,
}) {
  const set = (patch) => onChange({ ...value, ...patch });
  const pickerRef = useRef(null);
  const today = todayJakarta();
  const passed = SLOTS.filter((s) => slotPassed(s.code, value.scheduled_date));
  const okPhotos = photos.filter((p) => p.status !== 'failed').length;
  const w = wording(orderType);
  // Pesanan produk saja tanpa foto before-after (AC-09.2).
  const withPhotos = orderType !== 'product_only';

  return (
    <div className="flex flex-col gap-6">
      <Card as="section" aria-labelledby="judul-langkah" className="flex flex-col gap-4 md:p-6">
        <CardTitle as="h2" subtitle="Dipakai pemilik untuk konfirmasi lewat WhatsApp">
          <span id="judul-langkah">Data pemesan</span>
        </CardTitle>
        <Field label="Nama lengkap" helper="2–80 karakter" error={errors['customer.name']}>
          <Input
            icon={User}
            autoComplete="name"
            maxLength={80}
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field
          label="Nomor WhatsApp"
          helper="Format 08…, 628…, atau +628…"
          error={errors['customer.phone']}
        >
          <Input
            icon={Phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={value.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
        </Field>
        <Field label="Email (opsional)" error={errors['customer.email']}>
          <Input
            type="email"
            autoComplete="email"
            maxLength={120}
            placeholder="nama@contoh.com"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </Field>
        {/* Honeypot (GAP-11): tersembunyi dari pengguna, bot yang mengisinya mendapat 201 palsu. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={value.website}
              onChange={(e) => set({ website: e.target.value })}
            />
          </label>
        </div>
      </Card>

      <Card as="section" className="flex flex-col gap-4 md:p-6">
        <CardTitle as="h2">
          {fulfillment === 'pickup' ? w.pickupSchedule : w.dropoffSchedule}
        </CardTitle>
        <Field
          label="Tanggal"
          helper="Hari ini sampai 30 hari ke depan"
          error={errors.scheduled_date}
        >
          <Input
            type="date"
            icon={CalendarDays}
            min={today}
            max={addDays(today, MAX_ADVANCE_DAYS)}
            value={value.scheduled_date}
            onChange={(e) => {
              const date = e.target.value;
              // Slot terpilih yang ternyata sudah lewat pada tanggal baru dikosongkan.
              set({
                scheduled_date: date,
                scheduled_slot: slotPassed(value.scheduled_slot, date) ? '' : value.scheduled_slot,
              });
            }}
          />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Slot waktu</legend>
          <div role="radiogroup" aria-label="Slot waktu" className="flex gap-2">
            {SLOTS.map((s) => {
              const gone = passed.includes(s);
              return (
                <SlotChip
                  key={s.code}
                  label={s.label}
                  hint={gone ? 'Sudah lewat' : `${s.start}–${s.end}`}
                  disabled={gone}
                  selected={value.scheduled_slot === s.code}
                  onClick={() => set({ scheduled_slot: s.code })}
                />
              );
            })}
          </div>
          {errors.scheduled_slot ? (
            <ErrorText>{errors.scheduled_slot}</ErrorText>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">
              {passed.length
                ? `Slot ${passed.map((s) => s.label).join(' dan ')} sudah lewat untuk hari ini, jadi tidak bisa dipilih.`
                : 'Slot yang sudah lewat pada hari ini tidak bisa dipilih.'}
            </p>
          )}
        </fieldset>
      </Card>

      {fulfillment === 'pickup' && (
        <Card as="section" className="flex flex-col gap-4 md:p-6">
          <CardTitle as="h2" subtitle={w.addressNote}>
            {w.address}
          </CardTitle>
          <Field label="Alamat" helper={w.addressHelper} error={errors.address_text}>
            <Textarea
              rows={3}
              maxLength={300}
              autoComplete="street-address"
              placeholder="Nama jalan, nomor rumah, patokan"
              value={value.address_text}
              onChange={(e) => set({ address_text: e.target.value })}
            />
          </Field>
        </Card>
      )}

      <Card as="section" className="flex flex-col gap-4 md:p-6">
        <CardTitle as="h2" subtitle="Opsional">
          {withPhotos ? 'Catatan & foto' : 'Catatan'}
        </CardTitle>
        <Field label="Catatan" helper="Maksimal 500 karakter" error={errors.customer_notes}>
          <Input
            maxLength={500}
            placeholder={withPhotos ? 'Contoh: noda minyak di midsole' : undefined}
            value={value.customer_notes}
            onChange={(e) => set({ customer_notes: e.target.value })}
          />
        </Field>
        {withPhotos && (
          <UploadArea
            inputRef={pickerRef}
            onFiles={onAddPhotos}
            disabled={okPhotos >= 3}
            hint="Maks. 3 foto, JPEG/PNG/WebP, 5 MB"
          />
        )}
        {withPhotos && photos.length > 0 && (
          <ul className="flex flex-col gap-2" aria-label="Foto dipilih">
            {photos.map((p) => (
              <li key={p.id}>
                <UploadItem
                  name={p.name}
                  status={p.status}
                  sizeLabel={p.size}
                  errorText={p.error}
                  onRetry={() => {
                    onRemovePhoto(p.id);
                    pickerRef.current?.click();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        {withPhotos && (photoDetail || errors.photos) && (
          <p
            className={cn(
              'text-xs font-medium',
              errors.photos ? 'text-danger' : 'text-muted-foreground',
            )}
          >
            {errors.photos ?? photoDetail}
          </p>
        )}
      </Card>
    </div>
  );
}

/* ---------- Langkah 4: ringkasan ---------- */

function ReviewCard({ title, onEdit, editLabel, children }) {
  return (
    <Card as="section" className="flex flex-col gap-3">
      <CardHeader>
        <CardTitle as="h3">{title}</CardTitle>
        {onEdit && (
          <Button variant="link" className="h-auto text-sm" onClick={onEdit} aria-label={editLabel}>
            Ubah
          </Button>
        )}
      </CardHeader>
      {children}
    </Card>
  );
}

/** Baris ikon + teks + keterangan (Figma 89:4970 "Metode & jadwal"). */
export function InfoRow({ icon: Icon, children, sub }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="text-sm font-medium break-words text-foreground">{children}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function StepReview({
  lines,
  method,
  orderType,
  data,
  photoCount,
  subtotal,
  shipping,
  onEdit,
}) {
  const notes = data.customer_notes.trim();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <h2 id="judul-langkah" className="text-h2 text-brand-900">
          Periksa pesanan Anda
        </h2>
        <p className="text-sm text-muted-foreground">Pastikan semua benar sebelum mengirim.</p>
      </div>

      <ReviewCard
        title={orderType === 'product_only' ? 'Produk' : 'Layanan'}
        onEdit={() => onEdit(0)}
        editLabel="Ubah item pesanan"
      >
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.code} className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col">
                <p className="text-sm font-medium">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  {l.type === 'addon' && 'Add-on · '}
                  {l.qty} {unitOf(l.code)} × <Money value={l.price} />
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium">
                <Money value={typeof l.price === 'number' ? l.price * l.qty : l.price} />
              </p>
            </li>
          ))}
        </ul>
      </ReviewCard>

      <ReviewCard
        title="Metode & jadwal"
        onEdit={() => onEdit(1)}
        editLabel="Ubah metode dan jadwal"
      >
        <InfoRow icon={method.fulfillment === 'pickup' ? Truck : Store}>
          {methodText(method, orderType)}
        </InfoRow>
        <InfoRow icon={CalendarDays} sub={slotText(data.scheduled_slot)}>
          {formatDateLongWeekday(data.scheduled_date)}
        </InfoRow>
        {method.fulfillment === 'pickup' && (
          <InfoRow icon={MapPin}>{data.address_text.trim()}</InfoRow>
        )}
      </ReviewCard>

      <ReviewCard title="Data pemesan" onEdit={() => onEdit(2)} editLabel="Ubah data pemesan">
        <InfoRow
          icon={User}
          sub={[data.phone.trim(), data.email.trim()].filter(Boolean).join(' · ')}
        >
          {data.name.trim()}
        </InfoRow>
        {(notes || photoCount > 0) && (
          <InfoRow
            icon={FileText}
            sub={photoCount > 0 ? `${photoCount} foto terlampir` : undefined}
          >
            {notes ? `Catatan: ${notes}` : 'Tanpa catatan'}
          </InfoRow>
        )}
      </ReviewCard>

      <ReviewCard title="Rincian biaya">
        <SummaryList>
          <SummaryRow label="Subtotal" value={<Money value={subtotal} />} />
          <SummaryRow label={shippingLabel(method, orderType)} value={<Money value={shipping} />} />
          <SummaryDivider />
          <SummaryRow
            label="Total"
            value={<Money value={addMoney(subtotal, shipping)} />}
            emphasis
          />
        </SummaryList>
      </ReviewCard>

      <Alert type="info">Pembayaran melalui QRIS di WhatsApp setelah pesanan dikonfirmasi.</Alert>
    </div>
  );
}

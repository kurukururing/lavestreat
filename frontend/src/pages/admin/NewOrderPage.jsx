import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CircleCheck, Phone, Sparkles, TriangleAlert, User } from 'lucide-react';
import { toast } from 'sonner';

import { createOrder, parseChat, previewEstimate } from '@/api/admin';
import { errorCode, errorMessage, fieldErrors } from '@/api/client';
import { PageHeader } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { QtyStepper } from '@/components/ui/qty-stepper';
import { Textarea } from '@/components/ui/textarea';
import { CheckFlag, ItemsEditor, ScheduleFields } from '@/features/order-form/OrderFormFields';
import {
  AREA_LABELS,
  catalogName,
  toItemsBody,
  validateItems,
  validateSchedule,
} from '@/features/order-form/order-form';
import { CatalogError, Money } from '@/features/public/Money';
import { useCatalog } from '@/hooks/useCatalog';
import { notifyOrdersChanged } from '@/hooks/usePendingCount';
import { cn } from '@/lib/utils';

const PHONE_RE = /^(\+?62|0)8\d{7,12}$/;
// Nominal `undefined` (memuat) atau `null` (galat) ikut terbawa ke jumlah.
const addMoney = (a, b) => (a == null ? a : b == null ? b : a + b);
const newItem = () => ({ key: crypto.randomUUID(), catalog_code: '', qty: 1 });

const EMPTY_SCHEDULE = {
  fulfillment: null,
  area: null,
  scheduled_date: '',
  scheduled_slot: null,
  address_text: '',
};

/** Aturan batas atas layanan cepat (AUDIT D-04) untuk keterangan pratinjau. */
function capNote(items) {
  const codes = items.map((i) => i.catalog_code);
  const extra = codes.includes('UNYELLOWING') ? 2 : 0;
  const plus = extra ? ' + Unyellowing' : '';
  if (codes.includes('EXPRESS')) return `Dibatasi aturan Express${plus} (maks. ${1 + extra} hari).`;
  if (codes.includes('FASTTRACK'))
    return `Dibatasi aturan Fast Track${plus} (maks. ${2 + extra} hari).`;
  return null;
}

/** AD-6 Pesanan baru manual (Figma 45:1819, FR-02 AC-02.9, FR-04 AC-04.1, FR-07). */
export function NewOrderPage() {
  const navigate = useNavigate();
  const { lineTotal, shipping: shippingFee } = useCatalog();
  const [items, setItems] = useState(() => [newItem()]);
  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [chat, setChat] = useState('');
  const [parsing, setParsing] = useState(false);
  const [flagged, setFlagged] = useState(null);

  const [preview, setPreview] = useState({ status: 'idle' });
  const [estimate, setEstimate] = useState({ days: null, source: null });

  const validItems = items.filter((i) => i.catalog_code);
  const previewKey = JSON.stringify([
    toItemsBody(validItems),
    schedule.fulfillment,
    schedule.scheduled_date,
  ]);

  // Pratinjau estimasi AI (ADM-11) setelah isian item berhenti berubah. Tidak menyimpan apa pun.
  useEffect(() => {
    if (!validItems.length) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      setPreview({ status: 'loading' });
      previewEstimate({
        items: toItemsBody(validItems),
        fulfillment: schedule.fulfillment ?? undefined,
        scheduled_date: schedule.scheduled_date || undefined,
      }).then(
        (res) => {
          if (!active) return;
          setPreview({ status: 'ok', ai: res.ai_estimate_days, suggested: res.suggested_days });
          setEstimate((e) =>
            e.source === 'manual' || e.source === 'baseline'
              ? e
              : { days: res.suggested_days, source: 'ai' },
          );
        },
        (err) => {
          if (!active) return;
          // Estimasi AI dari isian sebelumnya tidak berlaku lagi untuk item yang baru.
          setEstimate((e) => (e.source === 'ai' ? { days: null, source: null } : e));
          setPreview({
            status: 'error',
            baseline:
              errorCode(err) === 'AI_UNAVAILABLE'
                ? err.response?.data?.fallback?.baseline_days
                : null,
          });
        },
      );
    }, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `previewKey` mewakili isian
  }, [previewKey]);

  // Subtotal hanya perkiraan dari katalog server; total final dihitung server (AC-01.5).
  const subtotal = validItems.map((i) => lineTotal(i.catalog_code, i.qty)).reduce(addMoney, 0);
  const dropoff = schedule.fulfillment === 'dropoff';
  const shippingKnown = dropoff || (schedule.fulfillment === 'pickup' && Boolean(schedule.area));
  const shipping = dropoff ? 0 : shippingFee(schedule.area);

  async function fillFromChat() {
    const text = chat.trim();
    if (!text) {
      setErrors((e) => ({ ...e, chat: 'Tempel teks chat dulu.' }));
      return;
    }
    setParsing(true);
    try {
      const res = await parseChat(text);
      const f = res.fields;
      if (f.items?.length) setItems(f.items.map((i) => ({ ...newItem(), ...i })));
      setSchedule((s) => ({
        ...s,
        fulfillment: f.fulfillment ?? s.fulfillment,
        area: f.area ?? s.area,
        scheduled_date: f.scheduled_date ?? s.scheduled_date,
        scheduled_slot: f.scheduled_slot ?? s.scheduled_slot,
      }));
      setCustomer((c) => ({
        name: f.customer?.name ?? c.name,
        phone: f.customer?.phone ?? c.phone,
      }));
      if (f.customer_notes) setNotes(f.customer_notes);
      setFlagged(new Set(res.uncertain_fields));
      setErrors({});
      toast.success('Form terisi dari chat. Periksa sebelum menyimpan.');
    } catch (err) {
      toast.error(
        errorCode(err) === 'AI_UNAVAILABLE'
          ? 'Layanan AI tidak tersedia, isi form secara manual.'
          : errorMessage(err, 'Teks gagal dibaca. Isi form secara manual.'),
      );
    } finally {
      setParsing(false);
    }
  }

  function validate() {
    const found = { ...validateItems(items), ...validateSchedule(schedule) };
    const name = customer.name.trim();
    if (name.length < 2 || name.length > 80) found['customer.name'] = 'Nama 2 sampai 80 karakter.';
    if (!PHONE_RE.test(customer.phone.replace(/[\s-]/g, '')))
      found['customer.phone'] = 'Nomor WhatsApp tidak valid. Contoh 081200000000.';
    return found;
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Periksa kembali isian yang ditandai.');
      return;
    }
    setSaving(true);
    const pickup = schedule.fulfillment === 'pickup';
    try {
      const order = await createOrder({
        order_type: 'treatment',
        source: flagged ? 'admin_ai_chat' : 'admin_manual',
        customer: { name: customer.name.trim(), phone: customer.phone.replace(/[\s-]/g, '') },
        items: toItemsBody(items),
        fulfillment: schedule.fulfillment,
        area: pickup ? schedule.area : null,
        address_text: pickup ? schedule.address_text.trim() : null,
        scheduled_date: schedule.scheduled_date,
        scheduled_slot: schedule.scheduled_slot,
        customer_notes: notes.trim() || null,
        estimated_days: estimate.days,
        estimate_source: estimate.days ? estimate.source : null,
        ai_estimate_days: preview.status === 'ok' ? preview.ai : null,
      });
      notifyOrdersChanged();
      toast.success(`Pesanan ${order.code} dibuat dengan status Diterima.`);
      navigate(`/admin/pesanan/${order.id}`);
    } catch (err) {
      const fields = fieldErrors(err);
      if (Object.keys(fields).length) setErrors(fields);
      toast.error(errorMessage(err, 'Pesanan gagal disimpan.'));
      setSaving(false);
    }
  }

  const flaggedCount = flagged?.size ?? 0;
  const flags = flagged ?? new Set();
  const note = capNote(validItems);

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title="Pesanan baru"
        subtitle="Pesanan manual langsung berstatus Diterima"
        actions={
          <>
            <Link to="/admin/pesanan" className={buttonVariants({ variant: 'secondary' })}>
              Batal
            </Link>
            <Button type="submit" loading={saving} loadingText="Menyimpan…">
              Simpan pesanan
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 border-brand-200 bg-brand-50">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-accent-foreground">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <CardTitle subtitle="Tempel chat WhatsApp, AI mengisi form untuk Anda periksa.">
                Isi otomatis dari teks chat
              </CardTitle>
            </div>
            <Alert type="warning">
              Hanya tempel teks contoh (dummy). Teks dikirim ke layanan AI pihak ketiga.
            </Alert>
            <Field
              label="Teks chat WhatsApp"
              helper="Maksimal 2000 karakter. Teks diperlakukan sebagai data, bukan perintah."
              error={errors.chat}
            >
              <Textarea
                rows={4}
                maxLength={2000}
                value={chat}
                onChange={(e) => {
                  setChat(e.target.value);
                  setErrors(({ chat: _c, ...rest }) => rest);
                }}
                placeholder="Contoh: Halo kak, mau cuci 2 pasang Deep Clean, dijemput di Sidoarjo besok pagi atas nama Budi"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={fillFromChat}
                loading={parsing}
                loadingText="Membaca chat…"
              >
                <Sparkles aria-hidden="true" />
                Isi dengan AI
              </Button>
              {flagged && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                    flaggedCount ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success',
                  )}
                  role="status"
                >
                  {flaggedCount ? (
                    <TriangleAlert className="size-3.5" aria-hidden="true" />
                  ) : (
                    <CircleCheck className="size-3.5" aria-hidden="true" />
                  )}
                  Form terisi{flaggedCount ? ` · ${flaggedCount} field perlu diisi manual` : ''}
                </span>
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <CardTitle subtitle="Qty 1–10 pasang per item">Item</CardTitle>
            <ItemsEditor
              items={items}
              onChange={setItems}
              errors={errors}
              flagged={flags.has('items')}
            />
          </Card>

          <Card className="flex flex-col gap-4">
            <CardTitle>Metode &amp; jadwal</CardTitle>
            <ScheduleFields
              value={schedule}
              onChange={setSchedule}
              errors={errors}
              flagged={flags}
            />
          </Card>

          <Card className="flex flex-col gap-4">
            <CardTitle>Data pembeli</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <CheckFlag show={flags.has('customer.name')} hint="Nama belum terbaca dari chat.">
                <Field label="Nama" error={errors['customer.name']}>
                  <Input
                    icon={User}
                    maxLength={80}
                    autoComplete="off"
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                  />
                </Field>
              </CheckFlag>
              <CheckFlag show={flags.has('customer.phone')} hint="Nomor belum terbaca dari chat.">
                <Field label="Nomor WhatsApp" error={errors['customer.phone']}>
                  <Input
                    icon={Phone}
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    autoComplete="off"
                    placeholder="081200000000"
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                  />
                </Field>
              </CheckFlag>
            </div>
            <Field
              label="Catatan"
              helper="Opsional. Maksimal 500 karakter."
              error={errors.customer_notes}
            >
              <Textarea
                rows={2}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card className="flex flex-col gap-3">
            <h2 className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
              Estimasi AI · pratinjau
            </h2>
            <p className="flex items-center gap-2">
              <span className="text-metric-lg">
                {estimate.days ? `${estimate.days} hari` : '–'}
              </span>
              {estimate.days && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    estimate.source === 'ai'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {estimate.source === 'ai' && <Sparkles className="size-3.5" aria-hidden="true" />}
                  {estimate.source === 'ai' ? 'AI' : estimate.source}
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {preview.status === 'loading'
                ? 'Menghitung estimasi…'
                : preview.status === 'error'
                  ? 'Estimasi otomatis tidak tersedia, isi manual.'
                  : validItems.length
                    ? `${note ? `${note} ` : ''}Pratinjau tidak menyimpan apa pun.`
                    : 'Pilih item untuk melihat estimasi.'}
            </p>
            {preview.status === 'error' && preview.baseline && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEstimate({ days: preview.baseline, source: 'baseline' })}
              >
                Gunakan saran baseline: {preview.baseline} hari
              </Button>
            )}
            <div className="flex items-center gap-3 border-t border-border pt-3">
              <QtyStepper
                value={estimate.days ?? 1}
                min={1}
                max={14}
                onChange={(days) => setEstimate({ days, source: 'manual' })}
                itemName="estimasi hari"
              />
              <span className="text-sm text-muted-foreground">hari (1–14)</span>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <CardTitle>Ringkasan biaya</CardTitle>
            <CatalogError />
            <dl className="flex flex-col gap-2 text-sm">
              {validItems.map((i) => (
                <div key={i.key} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {catalogName(i.catalog_code)} × {i.qty}
                  </dt>
                  <dd>
                    <Money value={lineTotal(i.catalog_code, i.qty)} />
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">
                  Ongkir
                  {schedule.area && schedule.fulfillment === 'pickup'
                    ? ` (${AREA_LABELS[schedule.area]})`
                    : ''}
                </dt>
                <dd>
                  {!shippingKnown ? (
                    schedule.fulfillment === 'pickup' ? (
                      'Pilih area dulu'
                    ) : (
                      'Pilih metode dulu'
                    )
                  ) : shipping === 0 ? (
                    'Gratis'
                  ) : (
                    <Money value={shipping} />
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <dt className="font-medium">Total sementara</dt>
                <dd className="text-lg font-semibold">
                  <Money value={addMoney(subtotal, shippingKnown ? shipping : 0)} />
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              {shippingKnown ? '' : 'Belum termasuk ongkir. '}Total final dihitung server saat
              disimpan.
            </p>
          </Card>
        </div>
      </div>
    </form>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useBlocker, useLocation, useNavigate } from 'react-router';

import { errorCode, errorMessage, fieldErrors } from '@/api/client';
import { createOrder } from '@/api/public';
import { Container, PageHeader } from '@/components/layout/PublicLayout';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrderStepper } from '@/components/ui/order-stepper';
import { StickyActionBar } from '@/components/ui/sticky-action-bar';
import { SummaryDivider, SummaryList, SummaryRow } from '@/components/ui/summary-list';
import {
  LAST_ORDER_KEY,
  orderTypeOf,
  publicItemsError,
  validateCustomer,
  validateSchedule,
} from '@/features/order-form/order-form';
import {
  StepData,
  StepItems,
  StepMethod,
  StepReview,
} from '@/features/order-form/PublicOrderSteps';
import {
  CATEGORIES,
  addMoney,
  shippingLabel,
  useOrderLines,
  useShippingFee,
  wording,
} from '@/features/order-form/public-order';
import { CatalogError, Money } from '@/features/public/Money';
import { PHOTO_MAX_BYTES, PHOTO_TYPES, formatBytes, shrinkPhoto } from '@/lib/image';
import { newId } from '@/lib/utils';

const STEPS = ['Layanan', 'Metode', 'Data', 'Ringkasan'];
const INTRO = [
  'Pilih layanan, add-on, dan produk.',
  'Pilih cara sepatu sampai ke kami.',
  'Isi data pemesan dan pilih jadwal.',
  'Periksa lagi sebelum mengirim pesanan.',
];
const MAX_PHOTOS = 3;

const EMPTY_DATA = {
  name: '',
  phone: '',
  email: '',
  scheduled_date: '',
  scheduled_slot: '',
  address_text: '',
  customer_notes: '',
  website: '',
};

/** Langkah tempat field galat server berada, agar pembeli diarahkan ke isian yang salah. */
const stepOfField = (field) =>
  field.startsWith('items') ? 0 : ['fulfillment', 'area'].includes(field) ? 1 : 2;

/** PG-2 Form pemesanan (`/pesan`, Figma Web-03 89:3771 sampai 89:4970). */
export function OrderPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  // Tombol "Pesan" di katalog membawa layanan terpilih (`state.service`).
  const preset = state?.service;
  // Langkah disimpan di riwayat browser agar tombol Back memundurkan langkah, bukan keluar form.
  const step = Math.min(Math.max(state?.step ?? 0, 0), STEPS.length - 1);
  const [qty, setQty] = useState(() => (preset ? { [preset]: 1 } : {}));
  const [method, setMethod] = useState({ fulfillment: null, area: null });
  const [data, setData] = useState(EMPTY_DATA);
  const [photos, setPhotos] = useState([]);
  const [photoDetail, setPhotoDetail] = useState('');
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Galat server yang harus tampil setelah pindah ke langkah field yang salah.
  const pending = useRef(null);

  const { lines, subtotal } = useOrderLines(qty);
  const shipping = useShippingFee(method);
  const total = addMoney(subtotal, shipping);
  const orderType = orderTypeOf(qty);
  const w = wording(orderType);

  useEffect(() => {
    const p = pending.current;
    pending.current = null;
    setErrors(p?.errors ?? {});
    setBanner(p?.message ?? '');
    window.scrollTo(0, 0);
  }, [step]);

  // Isi form hanya ada di memori: setelah muat ulang di tengah alur, mulai lagi dari langkah 1.
  const lost = step > 0 && lines.length === 0;
  useEffect(() => {
    if (lost) navigate('/pesan', { replace: true, state: {} });
  }, [lost, navigate]);

  // Mundur atau keluar dari langkah Data memunculkan peringatan (Back browser, panah, Kembali).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      step === 2 &&
      !submitting &&
      currentLocation.pathname === '/pesan' &&
      (nextLocation.pathname !== '/pesan' || (nextLocation.state?.step ?? 0) < 2),
  );
  const leavingForm = blocker.location && blocker.location.pathname !== '/pesan';

  /** Pindah langkah lewat riwayat: maju menambah entri, mundur kembali sebanyak selisihnya. */
  function go(target) {
    if (target > step) navigate('/pesan', { state: { ...state, step: target } });
    else if (target < step) navigate(target - step);
  }

  function fail(nextErrors, message) {
    setErrors(nextErrors);
    setBanner(message);
    window.scrollTo(0, 0);
  }

  function validate(at) {
    if (at === 0) {
      const msg = publicItemsError(qty);
      return msg ? { errors: { items: msg }, message: msg } : null;
    }
    if (at === 1) {
      const e = {};
      if (!method.fulfillment)
        e.fulfillment = `Pilih ${w.pickup.toLowerCase()} atau ${w.dropoff.toLowerCase()}.`;
      if (method.fulfillment === 'pickup' && !method.area)
        e.area = `Pilih ${w.area.toLowerCase()}.`;
      return Object.keys(e).length ? { errors: e, message: '' } : null;
    }
    if (at === 2) {
      const e = { ...validateCustomer(data), ...validateSchedule({ ...method, ...data }) };
      delete e.fulfillment;
      delete e.area;
      const n = Object.keys(e).length;
      return n ? { errors: e, message: `Periksa ${n} isian yang ditandai di bawah.` } : null;
    }
    return null;
  }

  function next() {
    const problem = validate(step);
    if (problem) return fail(problem.errors, problem.message);
    go(step + 1);
  }

  async function addPhotos(picked) {
    let slots = MAX_PHOTOS - photos.filter((p) => p.status !== 'failed').length;
    const added = picked.map((file) => {
      const id = newId();
      const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
      if (!PHOTO_TYPES.includes(file.type)) {
        return {
          id,
          name: file.name,
          status: 'failed',
          error: 'Tidak didukung',
          detail: `File ${ext ? `.${ext}` : 'ini'} tidak didukung. Gunakan JPEG, PNG, atau WebP (maks. 5 MB).`,
        };
      }
      if (file.size > PHOTO_MAX_BYTES) {
        return {
          id,
          name: file.name,
          status: 'failed',
          error: 'Lebih dari 5 MB',
          detail: 'Ukuran foto maksimal 5 MB per file.',
        };
      }
      if (slots <= 0) {
        return {
          id,
          name: file.name,
          status: 'failed',
          error: 'Melebihi 3 foto',
          detail: 'Maksimal 3 foto per pesanan.',
        };
      }
      slots -= 1;
      return { id, name: file.name, status: 'waiting', file };
    });
    setPhotos((list) => [...list, ...added]);
    const lastFail = added.filter((p) => p.status === 'failed').pop();
    setPhotoDetail(lastFail?.detail ?? '');
    for (const p of added.filter((x) => x.file)) {
      const small = await shrinkPhoto(p.file);
      setPhotos((list) =>
        list.map((x) =>
          x.id === p.id
            ? { ...x, file: small, status: 'success', size: formatBytes(small.size) }
            : x,
        ),
      );
    }
  }

  function removePhoto(id) {
    setPhotos((list) => list.filter((p) => p.id !== id));
    setPhotoDetail('');
  }

  async function submit() {
    setSubmitting(true);
    setBanner('');
    const body = {
      order_type: orderType,
      items: lines.map((l) => ({ catalog_code: l.code, qty: l.qty })),
      fulfillment: method.fulfillment,
      area: method.fulfillment === 'pickup' ? method.area : null,
      scheduled_date: data.scheduled_date,
      scheduled_slot: data.scheduled_slot,
      customer: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim() || null,
      },
      address_text: method.fulfillment === 'pickup' ? data.address_text.trim() : null,
      lat: null,
      lng: null,
      customer_notes: data.customer_notes.trim() || null,
      website: data.website,
    };
    // Pesanan produk saja tanpa foto (AC-09.2).
    const ready =
      orderType === 'product_only'
        ? []
        : photos.filter((p) => p.status === 'success').map((p) => p.file);
    try {
      // Kunci baru untuk setiap percobaan pengiriman (AC-01.6).
      const order = await createOrder(body, ready, newId());
      const summary = {
        order,
        lines: lines.map(({ code, name, qty: n, price }) => ({ code, name, qty: n, price })),
        method,
        order_type: orderType,
        scheduled_date: data.scheduled_date,
        scheduled_slot: data.scheduled_slot,
      };
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(summary));
      } catch {
        // Penyimpanan sesi bisa ditolak (mode privat); konfirmasi tetap tampil lewat state.
      }
      navigate('/pesan/selesai', { state: summary });
    } catch (err) {
      setSubmitting(false);
      const code = errorCode(err);
      if (code === 'VALIDATION_ERROR' || code === 'UPLOAD_INVALID') {
        const fields = fieldErrors(err);
        if (code === 'UPLOAD_INVALID') fields.photos = errorMessage(err);
        const first = Object.keys(fields)[0];
        const message = errorMessage(err, 'Periksa kembali isian pesanan.');
        if (!first) return fail(fields, message);
        pending.current = { errors: fields, message };
        return go(stepOfField(first));
      }
      fail({}, errorMessage(err, 'Pesanan belum terkirim. Coba lagi.'));
    }
  }

  const last = step === STEPS.length - 1;
  const back = () => (step === 0 ? navigate('/') : go(step - 1));
  if (lost) return null;
  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={back} disabled={submitting}>
        Kembali
      </Button>
      <Button
        className="flex-1"
        onClick={last ? submit : next}
        loading={submitting}
        loadingText="Mengirim…"
      >
        {last ? 'Kirim Pesanan' : 'Lanjutkan'}
      </Button>
    </div>
  );

  // Isi ringkasan samping mengikuti Figma per langkah.
  const totalRow =
    step === 0
      ? { label: 'Subtotal', value: subtotal }
      : step === 3
        ? { label: 'Total', value: total }
        : { label: 'Estimasi total', value: method.fulfillment ? total : subtotal };

  const methodRows = step === 1 && method.fulfillment && (
    <>
      <SummaryRow label="Subtotal" value={<Money value={subtotal} />} />
      <SummaryRow label={shippingLabel(method, orderType)} value={<Money value={shipping} />} />
    </>
  );

  return (
    <>
      {/* Header ponsel form (Figma 76:2494): panah kembali, judul, dan langkah. Header portal
          biasa disembunyikan di ponsel lewat `handle.mobileHeader` rute ini. */}
      <div className="sticky top-0 z-40 flex h-16 items-center gap-1 border-b border-border bg-card pr-4 pl-1 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={back}
          disabled={submitting}
          aria-label="Kembali"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-heading text-h3 text-brand-900">Pesan cuci sepatu</p>
          <p className="text-xs text-muted-foreground">
            Langkah {step + 1} dari {STEPS.length}
          </p>
        </div>
      </div>
      <Container className="flex flex-col gap-4 pt-4 pb-16 lg:gap-8 lg:pt-12 lg:pb-24">
        <PageHeader
          className="hidden lg:flex"
          crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Pesan' }]}
          title="Pesan cuci sepatu"
          description={
            <span aria-live="polite">
              Langkah {step + 1} dari {STEPS.length} · {INTRO[step]}
            </span>
          }
        />
        <div className="lg:rounded-lg lg:border lg:border-border lg:bg-card lg:px-8 lg:py-5">
          <OrderStepper steps={STEPS} current={step} />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_384px]">
          <div className="flex min-w-0 flex-col gap-6">
            <CatalogError />
            {banner && <Alert type="danger">{banner}</Alert>}
            {step === 0 && (
              <StepItems
                qty={qty}
                onChange={setQty}
                defaultOpen={CATEGORIES.find((c) => c.codes.includes(preset))?.value ?? 'regular'}
              />
            )}
            {step === 1 && (
              <StepMethod
                value={method}
                onChange={setMethod}
                errors={errors}
                orderType={orderType}
              />
            )}
            {step === 2 && (
              <StepData
                value={data}
                onChange={setData}
                fulfillment={method.fulfillment}
                orderType={orderType}
                errors={errors}
                photos={photos}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
                photoDetail={photoDetail}
              />
            )}
            {step === 3 && (
              <StepReview
                lines={lines}
                method={method}
                orderType={orderType}
                data={data}
                photoCount={photos.filter((p) => p.status === 'success').length}
                subtotal={subtotal}
                shipping={shipping}
                onEdit={go}
              />
            )}
          </div>

          <aside className="hidden flex-col gap-4 lg:flex" aria-label="Ringkasan pesanan">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-h3 text-brand-900">Ringkasan pesanan</h2>
              <SummaryList>
                {step < 3 &&
                  lines.map((l) => (
                    <SummaryRow
                      key={l.code}
                      label={`${l.name} × ${l.qty}`}
                      value={
                        <Money value={typeof l.price === 'number' ? l.price * l.qty : l.price} />
                      }
                    />
                  ))}
                {step < 3 && lines.length > 0 && <SummaryDivider />}
                {methodRows}
                <SummaryRow
                  label={totalRow.label}
                  value={<Money value={totalRow.value} />}
                  emphasis
                />
              </SummaryList>
              <SummaryDivider />
              {actions}
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-brand-50 px-5 py-4 text-sm">
              <p className="font-medium text-brand-900">Ada pertanyaan?</p>
              <p className="text-muted-foreground">
                Hubungi LAVE STREAT lewat WhatsApp. Pesanan tidak bisa diubah sendiri setelah
                dikirim.
              </p>
            </div>
          </aside>
        </div>

        <StickyActionBar>
          <SummaryList className="gap-1.5">
            {methodRows}
            <SummaryRow label={totalRow.label} value={<Money value={totalRow.value} />} emphasis />
          </SummaryList>
          {actions}
        </StickyActionBar>
      </Container>

      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {leavingForm ? 'Tinggalkan form pesanan?' : 'Kembali ke langkah Metode?'}
            </DialogTitle>
            <DialogDescription>
              {leavingForm
                ? 'Isian yang sudah Anda masukkan akan hilang dan pesanan belum terkirim.'
                : 'Data pemesan dan jadwal yang sudah diisi tetap tersimpan saat Anda kembali ke langkah ini.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => blocker.reset?.()}>
              Tetap di sini
            </Button>
            <Button onClick={() => blocker.proceed?.()}>
              {leavingForm ? 'Tinggalkan' : 'Kembali'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

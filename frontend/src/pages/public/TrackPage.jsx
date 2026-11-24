import { useEffect, useState } from 'react';
import { ChevronRight, Download, FileText, MessageCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router';

import { fetchPublicInvoice, getPublicOrder } from '@/api/public';
import { errorCode } from '@/api/client';
import { Container, PageHeader } from '@/components/layout/PublicLayout';
import { Alert, ColdStartNotice } from '@/components/ui/alert';
import { BeforeAfterPair } from '@/components/ui/before-after';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusTimeline } from '@/components/ui/status-timeline';
import { SummaryDivider, SummaryList, SummaryRow } from '@/components/ui/summary-list';
import { methodText } from '@/features/order-form/public-order';
import { Money } from '@/features/public/Money';
import { useApi } from '@/hooks/useApi';
import { BUSINESS } from '@/lib/business';
import { saveBlob } from '@/lib/download';
import { formatDate, formatDateLongWeekday, formatSlot } from '@/lib/format';

// Pesan AC-01.9: format salah dan tidak ditemukan identik; teks dari server bila ada.
const NOT_FOUND = 'ID pesanan tidak ditemukan. Periksa kembali.';
const RATE_LIMITED = 'Terlalu banyak percobaan, coba lagi beberapa menit lagi.';
const CARD = 'flex flex-col gap-3 rounded-lg border border-border bg-card p-4';

/** Pesan status di kartu ID pesanan (Figma 90:4937, 90:5065, 90:5203, 90:5339). */
const STATUS_NOTE = {
  pending_confirmation: {
    type: 'warning',
    title: 'Menunggu konfirmasi pemilik',
    text: 'Pesanan Anda sedang diperiksa pemilik.',
  },
  received: {
    type: 'info',
    title: 'Pesanan sudah diterima',
    text: 'Pemilik sudah mengonfirmasi pesanan Anda.',
  },
  processing: {
    type: 'info',
    title: 'Sepatu Anda sedang dicuci',
    text: 'Buka halaman ini lagi untuk melihat perkembangannya.',
  },
  done: {
    type: 'success',
    title: 'Sepatu Anda sudah selesai',
    text: 'Sepatu sudah dicuci dan siap diantar atau diambil.',
  },
  completed: {
    type: 'success',
    title: 'Pesanan sudah diambil atau diantar',
    text: 'Terima kasih sudah memakai LAVE STREAT.',
  },
  cancelled: {
    type: 'danger',
    title: 'Pesanan dibatalkan',
    text: 'Hubungi LAVE STREAT di WhatsApp bila ada pertanyaan.',
  },
};

/**
 * Form pencarian ID: kartu besar saat belum ada hasil, baris ringkas di atas hasil. Galat
 * disembunyikan begitu pembeli mengubah isian; tombol nonaktif selama kena batas (AC-01.10).
 */
function TrackForm({ initial, onSubmit, error, limited = false, compact = false }) {
  const [value, setValue] = useState(initial);
  const [edited, setEdited] = useState(false);
  const shown = edited ? null : error;
  const submit = (e) => {
    e.preventDefault();
    setEdited(false);
    if (value.trim()) onSubmit(value.trim());
  };
  const input = (
    <Input
      icon={Search}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        setEdited(true);
      }}
      placeholder="Contoh: LS-7K3M9QW2"
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      aria-label={compact ? 'ID pesanan' : undefined}
      aria-invalid={shown && !limited ? true : undefined}
    />
  );
  const button = (
    <Button type="submit" disabled={limited && !edited} className={compact ? '' : 'w-full'}>
      Cari
    </Button>
  );
  const limitAlert = limited && shown && <Alert type="danger">{shown}</Alert>;

  if (compact) {
    return (
      <form onSubmit={submit} role="search" className="flex w-full flex-col gap-2 lg:w-100">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">{input}</div>
          {button}
        </div>
        {limitAlert}
      </form>
    );
  }
  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-md"
    >
      <Field
        label="ID pesanan"
        error={limited ? null : shown}
        helper="Tidak peka huruf besar/kecil, boleh tanpa “LS-”."
      >
        {input}
      </Field>
      {limitAlert}
      {button}
    </form>
  );
}

/** Kartu hasil: ringkasan item, jadwal, metode, dan total (tanpa kontak, AC-01.8). */
function SummaryCard({ order }) {
  return (
    <section aria-labelledby="judul-ringkasan" className={CARD}>
      <h2 id="judul-ringkasan" className="font-heading text-h3 text-brand-900">
        Ringkasan
      </h2>
      <SummaryList>
        <SummaryRow label="Nama" value={order.customer_name_masked} />
        {order.items.map((it) => (
          <SummaryRow key={it.name} label={it.name} value={`× ${it.qty}`} />
        ))}
        <SummaryRow
          label="Jadwal"
          value={`${formatDate(order.scheduled_date)} · ${formatSlot(order.scheduled_slot)}`}
        />
        <SummaryRow label="Metode" value={methodText(order, order.order_type)} />
        <SummaryDivider />
        <SummaryRow label="Total" value={<Money value={order.total_idr} />} emphasis />
      </SummaryList>
    </section>
  );
}

/** EC-22: perubahan dan pembatalan hanya lewat WhatsApp. */
function ContactCard() {
  return (
    <a
      href={BUSINESS.whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted focus-visible:focus-ring"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <MessageCircle className="size-5" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        <span className="font-medium text-brand-900">Ingin mengubah atau membatalkan?</span>
        <span className="text-accent-foreground">Hubungi LAVE STREAT di WhatsApp</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </a>
  );
}

function EstimateCard({ order }) {
  const pending = order.status === 'pending_confirmation';
  return (
    <section aria-labelledby="judul-estimasi" className={CARD}>
      <h2
        id="judul-estimasi"
        className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase"
      >
        Estimasi selesai
      </h2>
      {order.estimated_days == null ? (
        <>
          <p className="font-heading text-h3 text-foreground">Belum tersedia</p>
          {pending && (
            <p className="text-xs font-medium text-muted-foreground">
              Estimasi muncul setelah pesanan dikonfirmasi.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-h1 text-brand-900">
              ±{order.estimated_days} hari
            </span>
            <span className="text-sm text-muted-foreground">
              perkiraan {formatDateLongWeekday(order.estimated_done_date)}
            </span>
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            Dihitung dari tanggal pesanan diterima.
          </p>
        </>
      )}
    </section>
  );
}

/** Foto before-after dan nota (AC-01.11): terkunci sampai status Selesai. */
function ResultsCard({ order }) {
  const [loading, setLoading] = useState(false);
  const pick = (kind) => {
    const p = order.photos.find((x) => x.kind === kind);
    const label = kind === 'before' ? 'sebelum' : 'sesudah';
    return p && { src: p.url, alt: `Foto sepatu ${label} dicuci` };
  };

  async function download() {
    setLoading(true);
    try {
      saveBlob(await fetchPublicInvoice(order.code), `nota-${order.code}.pdf`);
      toast.success('Nota diunduh.');
    } catch {
      toast.error('Nota gagal diunduh. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const button = (
    <Button
      variant={order.invoice_available ? 'primary' : 'secondary'}
      disabled={!order.invoice_available}
      loading={loading}
      loadingText="Mengunduh…"
      onClick={download}
      className="w-full"
    >
      <Download aria-hidden="true" />
      {order.invoice_available ? 'Unduh Nota (PDF)' : 'Unduh Nota'}
    </Button>
  );

  if (!order.invoice_available) {
    return (
      <section aria-labelledby="judul-foto" className={CARD}>
        <h2 id="judul-foto" className="font-heading text-h3 text-brand-900">
          Foto & nota
        </h2>
        <p className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          Foto sebelum-sesudah dan nota tersedia setelah status Selesai.
        </p>
        {button}
      </section>
    );
  }
  return (
    <section aria-labelledby="judul-foto" className={CARD}>
      <div>
        <h2 id="judul-foto" className="font-heading text-h3 text-brand-900">
          Foto sebelum & sesudah
        </h2>
        <p className="text-xs font-medium text-muted-foreground">Foto dari pemilik</p>
      </div>
      <BeforeAfterPair before={pick('before')} after={pick('after')} className="grid-cols-2" />
      {button}
    </section>
  );
}

function TrackResult({ order }) {
  const note = STATUS_NOTE[order.status];
  const cancelled = order.status === 'cancelled';
  const finished = ['done', 'completed'].includes(order.status);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_384px] lg:gap-6">
      <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
        <section aria-labelledby="judul-id" className={CARD}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                ID pesanan
              </p>
              <h2 id="judul-id" className="font-heading text-h2 break-all text-brand-900">
                {order.code}
              </h2>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-base text-foreground">Halo, {order.customer_name_masked}</p>
          <Alert type={note.type} title={note.title}>
            <span className="text-xs">{note.text}</span>
          </Alert>
        </section>
        {!cancelled && !finished && <EstimateCard order={order} />}
        {!cancelled && (
          <section aria-labelledby="judul-status" className={CARD}>
            <h2 id="judul-status" className="font-heading text-h3 text-brand-900">
              Status pesanan
            </h2>
            <StatusTimeline status={order.status} />
          </section>
        )}
        {!cancelled && order.status !== 'pending_confirmation' && <ResultsCard order={order} />}
      </div>
      <div className="flex flex-col gap-4">
        <SummaryCard order={order} />
        <ContactCard />
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 lg:grid-cols-[1fr_384px] lg:gap-6">
      <div className={CARD}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-14 w-full" />
      </div>
      <div className={CARD}>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/** Lebih dari 3 detik memuat dianggap server sedang bangun (EC-19). */
function useSlow(active) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(() => setSlow(true), 3000);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [active]);
  return slow;
}

/**
 * PG-4 Lacak pesanan (`/lacak?id=…`, Figma 90:4770 sampai 90:4857). ID di query string agar
 * hasil tetap tampil saat dimuat ulang dan Back browser kembali ke pencarian sebelumnya.
 */
export function TrackPage() {
  const [params, setParams] = useSearchParams();
  const code = params.get('id')?.trim() ?? '';
  const { data, error, loading, reload } = useApi(
    () => (code ? getPublicOrder(code) : Promise.resolve(null)),
    [code],
  );
  const slow = useSlow(Boolean(code) && loading);
  const search = (value) => (value === code ? reload() : setParams({ id: value }));

  const failure = code && !loading && error ? errorCode(error) : null;
  const order = code && !loading && !error ? data : null;
  const formError =
    failure === 'NOT_FOUND' ? NOT_FOUND : failure === 'RATE_LIMITED' ? RATE_LIMITED : null;
  const serverDown = failure && !formError;

  if (order || (code && loading) || serverDown) {
    return (
      <Container className="flex flex-col gap-4 pt-6 pb-16 lg:gap-6 lg:pt-12 lg:pb-24">
        <PageHeader
          crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Lacak pesanan' }]}
          title="Lacak pesanan"
          className="lg:flex-nowrap"
        >
          <TrackForm key={code} initial={code} onSubmit={search} compact />
        </PageHeader>
        {slow && <ColdStartNotice />}
        {loading && <ResultSkeleton />}
        {serverDown && (
          <div className="rounded-lg border border-border bg-card">
            <ErrorState onRetry={reload} />
          </div>
        )}
        {order && <TrackResult order={order} />}
      </Container>
    );
  }

  return (
    <Container className="grid items-start gap-6 pt-6 pb-16 lg:grid-cols-[1fr_400px] lg:gap-8 lg:pt-12 lg:pb-24">
      <section
        aria-labelledby="judul-lacak"
        className="flex flex-col gap-4 rounded-xl border border-border bg-brand-50 px-4 py-6 lg:p-8"
      >
        {!formError && (
          <span className="flex size-12 items-center justify-center rounded-md bg-card text-warning">
            <Search className="size-6" aria-hidden="true" />
          </span>
        )}
        <h1 id="judul-lacak" className="text-h1 text-brand-900 lg:text-h1-lg">
          Lacak pesanan
        </h1>
        <p className="text-base text-muted-foreground">
          Masukkan ID pesanan untuk melihat status, estimasi, foto, dan nota.
        </p>
        <TrackForm
          key={code}
          initial={code}
          onSubmit={search}
          error={formError}
          limited={failure === 'RATE_LIMITED'}
        />
      </section>
      <aside className="flex flex-col gap-3">
        <Alert type="info">
          ID ada di halaman konfirmasi setelah memesan, atau dikirim pemilik lewat WhatsApp.
        </Alert>
        <div className="hidden flex-col gap-1 rounded-lg bg-accent p-4 text-sm lg:flex">
          <p className="font-medium text-brand-900">Di mana ID pesanan saya?</p>
          <p className="text-muted-foreground">
            ID tertera di halaman konfirmasi setelah memesan, contoh LS-7K3M9QW2. Simpan ID ini
            untuk melacak.
          </p>
        </div>
      </aside>
    </Container>
  );
}

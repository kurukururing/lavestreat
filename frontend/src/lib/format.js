import { SLOTS } from '@lavestreat/shared';

/**
 * Format rupiah tanpa desimal, titik pemisah ribuan: 15000 → "Rp15.000" (DESIGN 10).
 * @param {number} amount bilangan bulat rupiah
 * @returns {string}
 */
export function formatRupiah(amount) {
  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.abs(Math.trunc(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${digits}`;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Tanggal "1 Des 2026". Tanggal kalender (`YYYY-MM-DD`) tidak digeser zona waktu;
 * timestamp ISO dihitung dalam Asia/Jakarta (BR-05).
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  const isDateOnly = typeof value === 'string' && DATE_ONLY.test(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: isDateOnly ? 'UTC' : 'Asia/Jakarta',
  }).format(new Date(value));
}

/**
 * Label slot jadwal: "morning" → "PAGI". Kode tak dikenal dikembalikan apa adanya.
 * @param {string} code
 * @param {{ withTime?: boolean }} [options] `withTime` menambah jam: "PAGI 09:00–12:00"
 */
export function formatSlot(code, { withTime = false } = {}) {
  const slot = SLOTS.find((s) => s.code === code);
  if (!slot) return code;
  return withTime ? `${slot.label} ${slot.start}–${slot.end}` : slot.label;
}

/**
 * Dua huruf awal nama untuk avatar: "Budi Contoh" → "BC".
 * @param {string} name
 * @returns {string}
 */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const JAKARTA = 'Asia/Jakarta';

function parts(value, options) {
  const isDateOnly = typeof value === 'string' && DATE_ONLY.test(value);
  const formatter = new Intl.DateTimeFormat('id-ID', {
    ...options,
    timeZone: isDateOnly ? 'UTC' : JAKARTA,
  });
  return Object.fromEntries(formatter.formatToParts(new Date(value)).map((p) => [p.type, p.value]));
}

/**
 * Tanggal dan jam WIB "30 Nov 2026, 10:00". Jam memakai titik dua seperti Figma, bukan
 * titik bawaan locale id-ID.
 * @param {string|Date} value timestamp ISO
 */
export function formatDateTime(value) {
  const p = parts(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}`;
}

/** Tanggal dengan hari "Sen, 1 Des 2026" (detail jadwal, AD-4). */
export function formatDateWeekday(value) {
  const p = parts(value, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
}

/** Tanggal dengan hari lengkap "Senin, 1 Des 2026" (ringkasan pesanan pembeli). */
export function formatDateLongWeekday(value) {
  const p = parts(value, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
}

/** Tanggal pendek tanpa tahun "3 Des" (catatan kecil di kartu). */
export function formatDayMonth(value) {
  const p = parts(value, { day: 'numeric', month: 'short' });
  return `${p.day} ${p.month}`;
}

/** Rentang periode dasbor "21–27 Nov 2026" atau "28 Nov – 4 Des 2026". */
export function formatDateRange(from, to) {
  const a = parts(from, { day: 'numeric', month: 'short', year: 'numeric' });
  const b = parts(to, { day: 'numeric', month: 'short', year: 'numeric' });
  if (a.year !== b.year) return `${formatDate(from)} – ${formatDate(to)}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day}–${b.day} ${b.month} ${b.year}`;
}

/** Tanggal kalender hari ini di Asia/Jakarta, `YYYY-MM-DD`. */
export function todayJakarta(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: JAKARTA }).format(now);
}

/** Tambah `days` hari ke tanggal kalender `YYYY-MM-DD`. */
export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Angka desimal id-ID: 2.4 → "2,4". */
export function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(value);
}

/** Pecahan 0–1 menjadi persen satu desimal: 0.617 → "61,7%". */
export function formatPercent(fraction) {
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(fraction * 100)}%`;
}

/** Nomor E.164 Indonesia dikelompokkan: "+6281200000001" → "+62 812 0000 0001". */
export function formatPhone(e164 = '') {
  const m = /^\+62(\d{3})(\d{4})(\d+)$/.exec(e164);
  return m ? `+62 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

// Mock API dari kontrak docs/API.md (W1-21) agar front-end bisa jalan sebelum back-end siap.
// shortcut: validasi di sini hanya sebagian kecil aturan server (BR-02, AC-01.4 tidak lengkap);
// ganti dengan skema Zod dari shared/ saat skema itu dibuat.
// Tidak dimock (biner): PUB-04, PUB-05. ADM-14 dan ADM-15 dimock sederhana (berkas unggahan
// disimpan di memori, nota berupa PDF satu halaman). ADM-16 s.d. ADM-18 dimock dengan templat
// dan pencocokan kata kunci, bukan model AI.
import { http, HttpResponse } from 'msw/http';
import {
  ORDER_CODE_ALPHABET,
  ORDER_CODE_LENGTH,
  ORDER_STATUSES,
  STATUS_LABELS,
} from '@lavestreat/shared';
import {
  CATALOG,
  MAX_ADVANCE_DAYS,
  MOCK_ADMIN,
  SEED_ORDERS,
  SHIPPING,
  SLOTS,
  seedCustomers,
} from './data.js';

const DAY_MS = 86_400_000;
const JAKARTA_OFFSET_MS = 7 * 3_600_000;
const TRACK_NOT_FOUND = 'ID pesanan tidak ditemukan. Periksa kembali.';

let db;
let loggedIn;

// Mode dev mock: sesi tetap ada saat halaman dimuat ulang (meniru cookie sesi). Hanya mock.
const SESSION_FLAG = 'lavestreat-mock-session';
function setSession(value) {
  loggedIn = value;
  try {
    if (value) globalThis.sessionStorage?.setItem(SESSION_FLAG, '1');
    else globalThis.sessionStorage?.removeItem(SESSION_FLAG);
  } catch {
    // penyimpanan diblokir: sesi hanya bertahan sampai muat ulang
  }
}

/** Kembalikan data mock ke keadaan awal (dipakai antar tes). */
export function resetMockDb() {
  const customers = seedCustomers();
  db = { customers, orders: [], idempotency: new Map(), blobs: new Map() };
  for (const seed of SEED_ORDERS) db.orders.push(seedOrder(seed, customers));
  setSession(false);
}

// ---------- utilitas ----------

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
/** Tanggal kalender Asia/Jakarta dari timestamp ISO. */
const jakartaDate = (iso) =>
  new Date(Date.parse(iso) + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
const addDays = (date, days) =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

function error(status, code, message, details) {
  const body = { error: { code, message } };
  if (details) body.error.details = details;
  return HttpResponse.json(body, { status });
}

const validation = (field, message) =>
  error(422, 'VALIDATION_ERROR', 'Data yang dikirim belum valid.', [{ field, message }]);

function newCode() {
  const pick = () => ORDER_CODE_ALPHABET[crypto.getRandomValues(new Uint32Array(1))[0] % 31];
  return `LS-${Array.from({ length: ORDER_CODE_LENGTH }, pick).join('')}`;
}

/** Normalisasi input lacak BR-07: huruf besar, tanpa spasi tepi, `LS-` dan tanda hubung opsional. */
function normalizeCode(raw) {
  const body = raw.trim().toUpperCase().replace(/-/g, '').replace(/^LS/, '');
  const valid =
    body.length === ORDER_CODE_LENGTH && [...body].every((ch) => ORDER_CODE_ALPHABET.includes(ch));
  return valid ? `LS-${body}` : null;
}

/** BR-06: `08…`, `628…`, `+628…` → `+62…`, 10–15 digit. */
function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/[\s-]/g, '');
  const e164 = digits.replace(/^\+?62/, '+62').replace(/^0/, '+62');
  return /^\+62\d{8,13}$/.test(e164) ? e164 : null;
}

/** Hitung baris item dari katalog. Klien tidak pernah mengirim harga (AC-01.5). */
function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: validation('items', 'Pilih minimal satu layanan atau produk') };
  }
  const lines = [];
  for (const [i, item] of items.entries()) {
    const entry = CATALOG.find((c) => c.code === item.catalog_code);
    if (!entry)
      return { error: validation(`items[${i}].catalog_code`, 'Layanan tidak ada di katalog.') };
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) {
      return { error: validation(`items[${i}].qty`, 'Jumlah harus 1 sampai 10.') };
    }
    lines.push({
      id: uuid(),
      item_type: entry.type,
      catalog_code: entry.code,
      name: entry.name,
      unit_price_idr: entry.price_idr,
      qty: item.qty,
      line_total_idr: entry.price_idr * item.qty,
    });
  }
  return { lines, subtotal: lines.reduce((sum, l) => sum + l.line_total_idr, 0) };
}

const shippingFor = (fulfillment, area) => (fulfillment === 'pickup' ? (SHIPPING[area] ?? 0) : 0);

/** Aturan sederhana pengganti layanan AI: batas atas D-04, rata-rata 3 hari. */
/**
 * Tiruan ADM-10/11: `ai_estimate_days` mentah (seolah dari model) dan `suggested_days` setelah
 * batas atas AUDIT D-04 (EXPRESS ≤ 1, FASTTRACK ≤ 2, UNYELLOWING +2 pada batas), lalu 1–14.
 */
function aiEstimate(items) {
  const codes = items.map((i) => i.catalog_code);
  const unyellowing = codes.includes('UNYELLOWING');
  const raw = unyellowing ? 5 : 3;
  let cap = codes.includes('EXPRESS') ? 1 : codes.includes('FASTTRACK') ? 2 : 14;
  if (unyellowing && cap < 14) cap += 2;
  return { ai_estimate_days: raw, suggested_days: Math.min(Math.max(Math.min(raw, cap), 1), 14) };
}

function withTotals(order) {
  order.subtotal_idr = order.items.reduce((sum, l) => sum + l.line_total_idr, 0);
  order.shipping_idr = shippingFor(order.fulfillment, order.area);
  order.total_idr = order.subtotal_idr + order.shipping_idr;
  return order;
}

// ---------- pembentuk pesanan ----------

function seedOrder(seed, customers) {
  const customer = customers[seed.customer];
  const createdAt = new Date(Date.now() - seed.daysAgo * DAY_MS).toISOString();
  const { lines } = priceItems(seed.items.map(([catalog_code, qty]) => ({ catalog_code, qty })));
  const reached = (s) => ORDER_STATUSES.indexOf(seed.status) >= ORDER_STATUSES.indexOf(s);
  const isCancelled = seed.status === 'cancelled';
  const order = baseOrder({
    code: seed.code,
    source: 'public',
    customer,
    fulfillment: seed.fulfillment,
    area: seed.area,
    scheduled_date: jakartaDate(createdAt),
    scheduled_slot: 'morning',
    address_text: seed.fulfillment === 'pickup' ? 'Jl. Contoh No. 1' : null,
    items: lines,
    createdAt,
  });
  order.status = seed.status;
  order.estimated_days = seed.estimated_days ?? null;
  order.ai_estimate_days = seed.estimated_days ?? null;
  order.estimate_source = seed.estimated_days ? 'ai' : null;
  // Riwayat mengikuti jalur status sampai status seed agar linimasa detail terisi.
  const path = isCancelled
    ? ['cancelled']
    : ORDER_STATUSES.slice(1, ORDER_STATUSES.indexOf(seed.status) + 1);
  let from = 'pending_confirmation';
  for (const to of path) {
    order.status_history.push({
      from_status: from,
      to_status: to,
      changed_at: createdAt,
      note: null,
    });
    from = to;
  }
  if (!isCancelled && reached('received')) order.received_at = createdAt;
  if (!isCancelled && reached('done')) order.done_at = createdAt;
  if (!isCancelled && reached('completed')) order.completed_at = createdAt;
  if (isCancelled) {
    order.cancelled_at = createdAt;
    order.cancel_reason = 'Pembeli membatalkan lewat WhatsApp.';
  }
  return order;
}

function baseOrder({ code, source, customer, items, createdAt, ...rest }) {
  return withTotals({
    id: uuid(),
    code,
    source,
    order_type: 'treatment',
    status: 'pending_confirmation',
    customer_id: customer.id,
    customer_name_snapshot: customer.name,
    lat: null,
    lng: null,
    customer_notes: null,
    internal_notes: null,
    items,
    estimated_days: null,
    ai_estimate_days: null,
    estimate_source: null,
    received_at: null,
    done_at: null,
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    photos: [],
    status_history: [
      { from_status: null, to_status: 'pending_confirmation', changed_at: createdAt, note: null },
    ],
    aftercare_messages: [],
    created_at: createdAt,
    updated_at: createdAt,
    ...rest,
  });
}

function estimatedDoneDate(order) {
  return order.received_at && order.estimated_days
    ? addDays(jakartaDate(order.received_at), order.estimated_days)
    : null;
}

/** Objek pesanan admin (API.md Bagian 5). */
function toAdmin(order) {
  const { customer_id, ...rest } = order;
  const customer = db.customers.find((c) => c.id === customer_id);
  return {
    ...rest,
    status_label: STATUS_LABELS[order.status],
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
    estimated_done_date: estimatedDoneDate(order),
  };
}

/** DTO publik whitelist PUB-03: tanpa telepon, email, alamat, catatan internal, uuid. */
function toPublic(order) {
  const pending = order.status === 'pending_confirmation';
  const showResults = ['done', 'completed'].includes(order.status);
  const [first, last] = order.customer_name_snapshot.split(' ');
  return {
    code: order.code,
    status: order.status,
    status_label: STATUS_LABELS[order.status],
    estimated_days: pending ? null : order.estimated_days,
    estimated_done_date: pending ? null : estimatedDoneDate(order),
    customer_name_masked: last ? `${first} ${last[0]}.` : first,
    fulfillment: order.fulfillment,
    area: order.area,
    scheduled_date: order.scheduled_date,
    scheduled_slot: order.scheduled_slot,
    items: order.items.map(({ name, qty }) => ({ name, qty })),
    total_idr: order.total_idr,
    photos: showResults
      ? order.photos
          .filter((p) => p.kind !== 'before_customer')
          .map((p) => ({
            id: p.id,
            kind: p.kind,
            url: `/api/public/orders/${order.code}/photos/${p.id}`,
          }))
      : [],
    invoice_available: showResults,
  };
}

function upsertCustomer({ name, phone, email }) {
  let customer = db.customers.find((c) => c.phone === phone);
  if (!customer) {
    customer = { id: uuid(), name, phone, email: email ?? null, created_at: now() };
    db.customers.push(customer);
  }
  customer.name = name; // BR-06: nama mengikuti pesanan terbaru
  return customer;
}

/** Validasi bersama PUB-02 dan ADM-05. Mengembalikan galat atau data pesanan baru. */
function prepareOrder(body) {
  if (!['treatment', 'product_only'].includes(body.order_type)) {
    return { error: validation('order_type', 'Jenis pesanan tidak valid.') };
  }
  const priced = priceItems(body.items);
  if (priced.error) return priced;
  // BR-02 / FR-09: `treatment` wajib ada layanan, `product_only` hanya berisi produk.
  const hasService = priced.lines.some((l) => l.item_type === 'service');
  if (body.order_type === 'treatment' && !hasService) {
    return { error: validation('items', 'Pilih minimal satu layanan cuci.') };
  }
  if (body.order_type === 'product_only' && priced.lines.some((l) => l.item_type !== 'product')) {
    return { error: validation('items', 'Pesanan produk saja hanya boleh berisi produk.') };
  }
  if (!['pickup', 'dropoff'].includes(body.fulfillment)) {
    return { error: validation('fulfillment', 'Pilih jemput atau antar sendiri.') };
  }
  if (body.fulfillment === 'pickup' && !['sidoarjo', 'surabaya'].includes(body.area)) {
    return { error: validation('area', 'Pilih area Sidoarjo atau Surabaya.') };
  }
  if (!body.scheduled_date) return { error: validation('scheduled_date', 'Pilih tanggal.') };
  if (!SLOTS.some((s) => s.code === body.scheduled_slot)) {
    return { error: validation('scheduled_slot', 'Pilih slot waktu.') };
  }
  const name = body.customer?.name?.trim() ?? '';
  if (name.length < 2 || name.length > 80)
    return { error: validation('customer.name', 'Nama 2 sampai 80 karakter.') };
  const phone = normalizePhone(body.customer?.phone);
  if (!phone) return { error: validation('customer.phone', 'Nomor WhatsApp tidak valid.') };
  return {
    lines: priced.lines,
    customer: upsertCustomer({ name, phone, email: body.customer.email }),
    fields: {
      order_type: body.order_type,
      fulfillment: body.fulfillment,
      area: body.fulfillment === 'pickup' ? body.area : null,
      scheduled_date: body.scheduled_date,
      scheduled_slot: body.scheduled_slot,
      address_text: body.fulfillment === 'pickup' ? (body.address_text ?? null) : null,
      customer_notes: body.customer_notes ?? null,
    },
  };
}

async function readBody(request) {
  if ((request.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    const form = await request.formData();
    return JSON.parse(form.get('data') ?? '{}');
  }
  return request.json().catch(() => ({}));
}

// ---------- mesin status (salinan tabel API.md ADM-09) ----------

const FORWARD = { received: 'processing', processing: 'done', done: 'completed' };
const BACKWARD = { processing: 'received', done: 'processing' };
const CANCELLABLE = ['pending_confirmation', 'received', 'processing', 'done'];
/** Field body ADM-07 (API.md). `status`, total, `code`, dan timestamp tidak boleh dikirim. */
const PATCHABLE = [
  'customer_notes',
  'internal_notes',
  'scheduled_date',
  'scheduled_slot',
  'fulfillment',
  'area',
  'address_text',
  'items',
  'estimated_days',
  'estimate_source',
];

function moveStatus(order, to, note) {
  const at = now();
  order.status_history.push({
    from_status: order.status,
    to_status: to,
    changed_at: at,
    note: note ?? null,
  });
  if (to === 'received' && !order.received_at) order.received_at = at;
  if (to === 'done') order.done_at = at;
  if (order.status === 'done' && to === 'processing') order.done_at = null;
  if (to === 'completed') order.completed_at = at;
  if (to === 'cancelled') order.cancelled_at = at;
  order.status = to;
  order.updated_at = at;
}

// ---------- berkas, nota, dan AI tiruan ----------

function storeBlob(file) {
  const id = uuid();
  db.blobs.set(id, file);
  return id;
}

/** PDF satu halaman berisi teks polos ASCII. Cukup untuk menguji alur unduh di mock. */
function tinyPdf(lines) {
  const safe = (t) => t.replace(/[^\x20-\x7e]/g, '').replace(/[()\\]/g, '');
  const text = lines
    .map((line, i) => `BT /F1 12 Tf 50 ${790 - i * 20} Td (${safe(line)}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((obj, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

/** Draf after-care dari templat. Hanya nama depan dan nama layanan (AC-06.3). */
function aftercareText(order, n) {
  const first = order.customer_name_snapshot.split(' ')[0];
  const services = order.items.filter((l) => l.item_type === 'service').map((l) => l.name);
  const tips = [
    'hindari menjemur di bawah terik dan simpan di tempat kering',
    'bersihkan noda ringan dengan kain lembap sebelum mengering',
    'pakai pelindung semprot agar warna tetap awet',
  ];
  const what = services.join(' dan ') || 'perawatan';
  return `Halo ${first}, terima kasih sudah mencuci sepatu di LAVE STREAT! Setelah ${what}, ${tips[n % tips.length]}. Sampai jumpa lagi!`;
}

/** Ekstraksi chat tiruan FR-07: cocokkan nama layanan, jumlah, area, dan nama pemesan. */
function parseChatText(text) {
  const lower = text.toLowerCase();
  const items = [];
  for (const entry of CATALOG) {
    const name = entry.name.toLowerCase().replace(/ (clean|treat|shoes)$/, '');
    const at = lower.indexOf(name);
    if (at < 0) continue;
    const before = lower.slice(Math.max(0, at - 12), at);
    const qty = Number(/(\d+)\s*(?:pasang|psg|x)?\s*$/.exec(before)?.[1] ?? 1);
    items.push({ catalog_code: entry.code, qty: Math.min(Math.max(qty, 1), 10) });
  }
  const area = /sidoarjo/.test(lower) ? 'sidoarjo' : /surabaya/.test(lower) ? 'surabaya' : null;
  const fulfillment = /jemput/.test(lower)
    ? 'pickup'
    : /antar sendiri|datang/.test(lower)
      ? 'dropoff'
      : null;
  const name = /atas nama\s+([A-Za-z]+)/i.exec(text)?.[1] ?? null;
  const phone = normalizePhone(/(\+?62|0)8[\d\s-]{7,14}/.exec(text)?.[0]);
  const slot = /pagi/.test(lower)
    ? 'morning'
    : /siang/.test(lower)
      ? 'noon'
      : /sore/.test(lower)
        ? 'evening'
        : null;
  const fields = {
    customer: { name, phone },
    items,
    fulfillment,
    area: fulfillment === 'pickup' ? area : null,
    scheduled_date: null,
    scheduled_slot: slot,
    customer_notes: /noda[^.]*/i.exec(text)?.[0] ?? null,
  };
  const uncertain = [];
  if (!name) uncertain.push('customer.name');
  if (!phone) uncertain.push('customer.phone');
  if (!items.length) uncertain.push('items');
  if (!fulfillment) uncertain.push('fulfillment');
  if (fulfillment === 'pickup' && !area) uncertain.push('area');
  uncertain.push('scheduled_date');
  if (!slot) uncertain.push('scheduled_slot');
  return { fields, uncertain_fields: uncertain, confidence: {}, ambiguous: false };
}

// ---------- handler ----------

const findOrder = (id) => db.orders.find((o) => o.id === id);
const notFound = () => error(404, 'NOT_FOUND', 'Data yang diminta tidak ditemukan.');
const conflict = () =>
  error(409, 'CONFLICT', 'Pesanan sudah diubah di tempat lain. Muat ulang halaman lalu coba lagi.');

function paginate(url, rows) {
  const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('page_size') ?? 20), 1), 50);
  return {
    data: rows.slice((page - 1) * pageSize, page * pageSize),
    page,
    page_size: pageSize,
    total: rows.length,
  };
}

/** Cocokkan pencarian nama/kode/nomor (AUDIT D-15). */
function matchesQuery(q, { name = '', code = '', phone = '' }) {
  if (!q) return true;
  if (/^[\d+\s-]+$/.test(q)) {
    const digits = q.replace(/[\s-]/g, '').replace(/^0/, '+62');
    return phone.includes(digits);
  }
  const needle = q.toLowerCase();
  return (
    name.toLowerCase().includes(needle) ||
    code.replace('-', '').includes(q.toUpperCase().replace('-', ''))
  );
}

const publicHandlers = [
  http.get('/api/public/catalog', () =>
    HttpResponse.json({
      items: CATALOG,
      shipping: SHIPPING,
      slots: SLOTS,
      max_advance_days: MAX_ADVANCE_DAYS,
    }),
  ),

  http.post('/api/public/orders', async ({ request }) => {
    const key = request.headers.get('Idempotency-Key');
    if (key && db.idempotency.has(key))
      return HttpResponse.json(db.idempotency.get(key), { status: 200 });

    const body = await readBody(request);
    const fake = {
      code: newCode(),
      status: 'pending_confirmation',
      subtotal_idr: 0,
      shipping_idr: 0,
      total_idr: 0,
    };
    if (body.website) return HttpResponse.json(fake, { status: 201 }); // honeypot: 201 palsu, tidak disimpan

    const prepared = prepareOrder(body);
    if (prepared.error) return prepared.error;
    const order = baseOrder({
      code: newCode(),
      source: 'public',
      customer: prepared.customer,
      items: prepared.lines,
      createdAt: now(),
      ...prepared.fields,
    });
    db.orders.unshift(order);
    const result = {
      code: order.code,
      status: order.status,
      subtotal_idr: order.subtotal_idr,
      shipping_idr: order.shipping_idr,
      total_idr: order.total_idr,
    };
    if (key) db.idempotency.set(key, result);
    return HttpResponse.json(result, { status: 201 });
  }),

  http.get('/api/public/orders/:code', ({ params }) => {
    const code = normalizeCode(params.code);
    const order = code && db.orders.find((o) => o.code === code);
    // AC-01.9: format salah dan tidak ditemukan memakai pesan identik.
    if (!order) return error(404, 'NOT_FOUND', TRACK_NOT_FOUND);
    return HttpResponse.json(toPublic(order));
  }),
];

const authHandlers = [
  http.post('/api/admin/auth/login', async ({ request }) => {
    const { username, password } = await request.json().catch(() => ({}));
    if (!username || !password)
      return validation(username ? 'password' : 'username', 'Wajib diisi.');
    if (username !== MOCK_ADMIN.username || password !== MOCK_ADMIN.password) {
      return error(401, 'UNAUTHORIZED', 'Nama pengguna atau kata sandi salah.');
    }
    setSession(true);
    return HttpResponse.json({ username });
  }),
];

// Semua rute admin selain login wajib sesi (API.md 1.4).
const requireSession = http.all('/api/admin/*', () => {
  if (!loggedIn) return error(401, 'UNAUTHORIZED', 'Sesi berakhir. Silakan masuk kembali.');
});

const adminHandlers = [
  http.post('/api/admin/auth/logout', () => {
    setSession(false);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/auth/me', () => HttpResponse.json({ username: MOCK_ADMIN.username })),

  // Didaftarkan sebelum /orders/:id (API.md Bagian 2).
  http.post('/api/admin/orders/estimate', async ({ request }) => {
    const { items } = await request.json().catch(() => ({}));
    const priced = priceItems(items);
    if (priced.error) return priced.error;
    return HttpResponse.json({ ...aiEstimate(items), model: 'mock' });
  }),

  http.get('/api/admin/orders', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    if (status && !ORDER_STATUSES.includes(status))
      return validation('status', 'Status tidak dikenal.');
    const q = url.searchParams.get('q')?.trim();
    const rows = db.orders
      .map(toAdmin)
      .filter((o) => !status || o.status === status)
      .filter((o) =>
        matchesQuery(q, { name: o.customer_name_snapshot, code: o.code, phone: o.customer.phone }),
      )
      .map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        status_label: o.status_label,
        customer_name: o.customer_name_snapshot,
        phone: o.customer.phone,
        order_type: o.order_type,
        fulfillment: o.fulfillment,
        scheduled_date: o.scheduled_date,
        scheduled_slot: o.scheduled_slot,
        total_idr: o.total_idr,
        created_at: o.created_at,
        updated_at: o.updated_at,
      }));
    return HttpResponse.json(paginate(url, rows));
  }),

  http.post('/api/admin/orders', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const prepared = prepareOrder(body);
    if (prepared.error) return prepared.error;
    const createdAt = now();
    const order = baseOrder({
      code: newCode(),
      source: body.source ?? 'admin_manual',
      customer: prepared.customer,
      items: prepared.lines,
      createdAt,
      ...prepared.fields,
      internal_notes: body.internal_notes ?? null,
      estimated_days: body.estimated_days ?? null,
      ai_estimate_days: body.ai_estimate_days ?? null,
      estimate_source: body.estimate_source ?? null,
    });
    // ADM-05: pesanan manual langsung `received`.
    order.status = 'received';
    order.received_at = createdAt;
    order.status_history = [
      { from_status: null, to_status: 'received', changed_at: createdAt, note: null },
    ];
    db.orders.unshift(order);
    return HttpResponse.json(toAdmin(order), { status: 201 });
  }),

  http.get('/api/admin/orders/:id', ({ params }) => {
    const order = findOrder(params.id);
    return order ? HttpResponse.json(toAdmin(order)) : notFound();
  }),

  http.patch('/api/admin/orders/:id', async ({ params, request }) => {
    const order = findOrder(params.id);
    if (!order) return notFound();
    const body = await request.json().catch(() => ({}));
    if (body.updated_at !== order.updated_at) return conflict();
    const { updated_at: _ignored, ...changes } = body;
    const allowed = ['pending_confirmation', 'received'].includes(order.status)
      ? PATCHABLE
      : ['processing', 'done'].includes(order.status)
        ? ['internal_notes']
        : [];
    const blocked = Object.keys(changes).find((field) => !allowed.includes(field));
    if (blocked) return validation(blocked, 'Field ini tidak dapat diubah pada status sekarang.');
    if (changes.items) {
      const priced = priceItems(changes.items);
      if (priced.error) return priced.error;
      changes.items = priced.lines;
    }
    Object.assign(order, changes);
    withTotals(order);
    order.updated_at = now();
    return HttpResponse.json(toAdmin(order));
  }),

  http.post('/api/admin/orders/:id/confirm', async ({ params, request }) => {
    const order = findOrder(params.id);
    if (!order) return notFound();
    const body = await request.json().catch(() => ({}));
    if (body.updated_at !== order.updated_at) return conflict();
    if (order.status !== 'pending_confirmation') {
      return error(409, 'INVALID_TRANSITION', 'Pesanan ini sudah dikonfirmasi.');
    }
    if (
      !Number.isInteger(body.estimated_days) ||
      body.estimated_days < 1 ||
      body.estimated_days > 14
    ) {
      return validation('estimated_days', 'Estimasi harus 1 sampai 14 hari.');
    }
    order.estimated_days = body.estimated_days;
    order.estimate_source = body.estimate_source ?? 'manual';
    moveStatus(order, 'received');
    return HttpResponse.json(toAdmin(order));
  }),

  http.post('/api/admin/orders/:id/status', async ({ params, request }) => {
    const order = findOrder(params.id);
    if (!order) return notFound();
    const body = await request.json().catch(() => ({}));
    if (body.updated_at !== order.updated_at) return conflict();
    const to = body.to_status;
    if (!ORDER_STATUSES.includes(to)) return validation('to_status', 'Status tidak dikenal.');

    if (to === 'cancelled') {
      if (!CANCELLABLE.includes(order.status)) {
        return error(409, 'INVALID_TRANSITION', 'Pesanan ini tidak dapat dibatalkan.');
      }
      const reason = body.cancel_reason?.trim() ?? '';
      if (reason.length < 5 || reason.length > 200) {
        return validation('cancel_reason', 'Alasan batal 5 sampai 200 karakter.');
      }
      order.cancel_reason = reason;
      moveStatus(order, 'cancelled', body.note);
    } else if (FORWARD[order.status] === to) {
      moveStatus(order, to, body.note);
    } else if (BACKWARD[order.status] === to) {
      if (!body.note?.trim())
        return validation('note', 'Catatan wajib diisi untuk koreksi status.');
      moveStatus(order, to, body.note);
    } else {
      const hint = order.status === 'pending_confirmation' ? ' Konfirmasi pesanan lebih dulu.' : '';
      return error(409, 'INVALID_TRANSITION', `Perubahan status ini tidak diizinkan.${hint}`);
    }
    return HttpResponse.json(toAdmin(order));
  }),

  http.post('/api/admin/orders/:id/estimate', ({ params }) => {
    const order = findOrder(params.id);
    if (!order) return notFound();
    if (!['pending_confirmation', 'received'].includes(order.status)) {
      return error(
        409,
        'INVALID_TRANSITION',
        'Estimasi hanya bisa dihitung sebelum pesanan diproses.',
      );
    }
    const estimate = aiEstimate(order.items);
    order.ai_estimate_days = estimate.ai_estimate_days;
    order.updated_at = now();
    return HttpResponse.json({
      ...estimate,
      model: 'mock',
      updated_at: order.updated_at,
    });
  }),

  http.post('/api/admin/orders/:id/photos', async ({ params, request }) => {
    const order = findOrder(params.id);
    if (!order) return notFound();
    if (['completed', 'cancelled'].includes(order.status)) {
      return validation('status', 'Pesanan sudah selesai diproses, foto tidak dapat diubah');
    }
    const form = await request.formData();
    const kind = form.get('kind');
    if (!['before', 'after'].includes(kind))
      return validation('kind', 'Pilih foto before atau after.');
    const files = form.getAll('files[]');
    if (order.photos.filter((p) => p.kind === kind).length + files.length > 5) {
      return error(422, 'UPLOAD_INVALID', 'Foto melebihi batas.', [
        { field: 'files', message: 'Maksimal 5 foto per jenis.' },
      ]);
    }
    const photos = files.map((file) => ({
      id: storeBlob(file),
      kind,
      mime: 'image/jpeg',
      size_bytes: file.size,
      uploaded_by: 'admin',
      created_at: now(),
    }));
    order.photos.push(...photos);
    return HttpResponse.json({ photos }, { status: 201 });
  }),

  http.delete('/api/admin/orders/:id/photos/:photoId', ({ params }) => {
    const order = findOrder(params.id);
    const photo = order?.photos.find((p) => p.id === params.photoId);
    if (!photo) return notFound();
    if (['completed', 'cancelled'].includes(order.status)) {
      return validation('status', 'Pesanan sudah selesai diproses, foto tidak dapat diubah');
    }
    order.photos = order.photos.filter((p) => p !== photo);
    db.blobs.delete(photo.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/orders/:id/photos/:photoId', ({ params }) => {
    const order = findOrder(params.id);
    const owned = order?.photos.some((p) => p.id === params.photoId);
    const blob = owned && db.blobs.get(params.photoId);
    if (!blob) return notFound();
    return new HttpResponse(blob, { headers: { 'Content-Type': blob.type || 'image/jpeg' } });
  }),

  http.get('/api/admin/orders/:id/invoice', ({ params }) => {
    const order = findOrder(params.id);
    if (!order) return notFound();
    const has = (kind) => order.photos.some((p) => p.kind === kind);
    const warnings = [
      !has('before') && 'missing_before_photo',
      !has('after') && 'missing_after_photo',
    ].filter(Boolean);
    const lines = [
      'LAVE STREAT - NOTA',
      order.code,
      `Kepada: ${order.customer_name_snapshot}`,
      ...order.items.map((l) => `${l.name} x${l.qty}  Rp${l.line_total_idr}`),
      `Ongkir Rp${order.shipping_idr}`,
      `TOTAL Rp${order.total_idr}`,
      'Pembayaran melalui QRIS di WhatsApp.',
    ];
    const headers = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="nota-${order.code}.pdf"`,
    };
    if (warnings.length) headers['X-Invoice-Warning'] = warnings.join(',');
    return new HttpResponse(tinyPdf(lines), { headers });
  }),

  http.post('/api/admin/orders/:id/aftercare', ({ params }) => {
    const order = findOrder(params.id);
    if (!order) return notFound();
    if (order.status !== 'done')
      return validation('status', 'Draf hanya dapat dibuat saat status Selesai.');
    if (order.aftercare_messages.length >= 5)
      return validation('aftercare', 'Batas 5 draf tercapai.');
    const draft = {
      id: uuid(),
      order_id: order.id,
      content: aftercareText(order, order.aftercare_messages.length),
      model_name: 'mock',
      copied_at: null,
      created_at: now(),
    };
    order.aftercare_messages.push(draft);
    return HttpResponse.json(draft, { status: 201 });
  }),

  http.patch('/api/admin/aftercare/:draftId', async ({ params, request }) => {
    const draft = db.orders
      .flatMap((o) => o.aftercare_messages)
      .find((d) => d.id === params.draftId);
    if (!draft) return notFound();
    const body = await request.json().catch(() => ({}));
    if (body.copied !== true) return validation('copied', 'Nilai copied harus true.');
    if (typeof body.content === 'string') {
      if (!body.content.trim() || body.content.length > 1000)
        return validation('content', 'Isi draf 1 sampai 1000 karakter.');
      draft.content = body.content;
    }
    draft.copied_at = now();
    return HttpResponse.json(draft);
  }),

  http.post('/api/admin/orders/parse-chat', async ({ request }) => {
    const { text } = await request.json().catch(() => ({}));
    if (typeof text !== 'string' || !text.trim() || text.length > 2000)
      return validation('text', 'Teks chat 1 sampai 2000 karakter.');
    return HttpResponse.json(parseChatText(text));
  }),

  http.get('/api/admin/customers', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    const rows = db.customers
      .filter((c) => matchesQuery(q, { name: c.name, phone: c.phone }))
      .map((c) => ({ ...c, orders_count: db.orders.filter((o) => o.customer_id === c.id).length }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return HttpResponse.json(paginate(url, rows));
  }),

  http.get('/api/admin/customers/:id', ({ params }) => {
    const customer = db.customers.find((c) => c.id === params.id);
    if (!customer) return notFound();
    const orders = db.orders
      .filter((o) => o.customer_id === customer.id)
      .map(({ id, code, status, order_type, total_idr, scheduled_date, created_at }) => ({
        id,
        code,
        status,
        status_label: STATUS_LABELS[status],
        order_type,
        total_idr,
        scheduled_date,
        created_at,
      }));
    return HttpResponse.json({ ...customer, orders });
  }),

  http.get('/api/admin/dashboard', ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '');
    if (!isDate(from)) return validation('from', 'Tanggal awal tidak valid.');
    if (!isDate(to) || to < from) return validation('to', 'Tanggal akhir tidak valid.');
    return HttpResponse.json(sampleDashboard(from, to));
  }),
];

/** Contoh dasbor statis; `by_status` selalu berjumlah sama dengan `totals.orders`. */
function sampleDashboard(from, to) {
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return {
    period: { from, to },
    has_data: true,
    totals: {
      orders: 120,
      revenue_idr: 3450000,
      by_status: { received: 4, processing: 6, done: 10, completed: 100 },
    },
    top_services: [
      { code: 'EASY', name: 'Easy Clean', pairs: 80, revenue_idr: 1200000 },
      { code: 'DEEP', name: 'Deep Clean', pairs: 30, revenue_idr: 750000 },
      { code: 'SUEDE', name: 'Suede Clean', pairs: 12, revenue_idr: 600000 },
    ],
    fulfillment_share: { pickup: 0.62, dropoff: 0.38 },
    busiest: {
      by_weekday: weekdays.map((day, i) => ({ day, orders: [12, 14, 15, 16, 18, 30, 15][i] })),
      by_hour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: hour >= 9 && hour <= 18 ? 4 + (hour % 5) * 2 : 0,
      })),
    },
    duration: { avg_actual_days: 2.4, avg_estimated_days: 2.7, avg_ai_estimated_days: 2.6 },
  };
}

const restored = (() => {
  try {
    return globalThis.sessionStorage?.getItem(SESSION_FLAG) === '1';
  } catch {
    return false;
  }
})();
resetMockDb();
setSession(restored);

export const handlers = [...publicHandlers, ...authHandlers, requireSession, ...adminHandlers];

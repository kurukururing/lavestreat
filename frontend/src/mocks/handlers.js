// Mock API dari kontrak docs/API.md (W1-21) agar front-end bisa jalan sebelum back-end siap.
// shortcut: validasi di sini hanya sebagian kecil aturan server (BR-02, AC-01.4 tidak lengkap);
// ganti dengan skema Zod dari shared/ saat skema itu dibuat.
// Tidak dimock (biner): PUB-04, PUB-05, ADM-14, ADM-15. Tidak dimock (P1): ADM-16 s.d. ADM-18.
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

/** Kembalikan data mock ke keadaan awal (dipakai antar tes). */
export function resetMockDb() {
  const customers = seedCustomers();
  db = { customers, orders: [], idempotency: new Map() };
  for (const seed of SEED_ORDERS) db.orders.push(seedOrder(seed, customers));
  loggedIn = false;
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
function suggestDays(items) {
  const codes = items.map((i) => i.catalog_code);
  let days = codes.includes('EXPRESS') ? 1 : codes.includes('FASTTRACK') ? 2 : 3;
  if (codes.includes('UNYELLOWING')) days += 2;
  return Math.min(Math.max(days, 1), 14);
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
  const priced = priceItems(body.items);
  if (priced.error) return priced;
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
    loggedIn = true;
    return HttpResponse.json({ username });
  }),
];

// Semua rute admin selain login wajib sesi (API.md 1.4).
const requireSession = http.all('/api/admin/*', () => {
  if (!loggedIn) return error(401, 'UNAUTHORIZED', 'Sesi berakhir. Silakan masuk kembali.');
});

const adminHandlers = [
  http.post('/api/admin/auth/logout', () => {
    loggedIn = false;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/auth/me', () => HttpResponse.json({ username: MOCK_ADMIN.username })),

  // Didaftarkan sebelum /orders/:id (API.md Bagian 2).
  http.post('/api/admin/orders/estimate', async ({ request }) => {
    const { items } = await request.json().catch(() => ({}));
    const priced = priceItems(items);
    if (priced.error) return priced.error;
    const days = suggestDays(items);
    return HttpResponse.json({ ai_estimate_days: days, suggested_days: days, model: 'mock' });
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
      ? Object.keys(changes)
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
    const days = suggestDays(order.items);
    order.ai_estimate_days = days;
    order.updated_at = now();
    return HttpResponse.json({
      ai_estimate_days: days,
      suggested_days: days,
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
      id: uuid(),
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
    return new HttpResponse(null, { status: 204 });
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

resetMockDb();

export const handlers = [...publicHandlers, ...authHandlers, requireSession, ...adminHandlers];

import { describe, expect, test } from 'vitest';
import { MOCK_ADMIN } from '../src/mocks/data.js';

const api = (path, init = {}) =>
  fetch(`${location.origin}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
    body: init.body && JSON.stringify(init.body),
  });

const login = () => api('/admin/auth/login', { method: 'POST', body: MOCK_ADMIN });

const orderBody = {
  order_type: 'treatment',
  items: [
    { catalog_code: 'EASY', qty: 1 },
    { catalog_code: 'UNYELLOWING', qty: 1 },
  ],
  fulfillment: 'pickup',
  area: 'sidoarjo',
  scheduled_date: '2026-12-01',
  scheduled_slot: 'morning',
  customer: { name: 'Uji Contoh', phone: '0812-0000-0099', email: null },
  address_text: 'Jl. Contoh No. 9, Sidoarjo',
  website: '',
};

describe('mock API publik', () => {
  test('katalog tanpa est_days_hint', async () => {
    const body = await (await api('/public/catalog')).json();
    expect(body.items).toHaveLength(13);
    expect(body.items[0]).not.toHaveProperty('est_days_hint');
  });

  test('buat pesanan menghitung total di server lalu bisa dilacak', async () => {
    const res = await api('/public/orders', { method: 'POST', body: orderBody });
    expect(res.status).toBe(201);
    const created = await res.json();
    // BR-03: 15.000 + 25.000 + ongkir Sidoarjo 5.000
    expect(created).toMatchObject({ subtotal_idr: 40000, shipping_idr: 5000, total_idr: 45000 });
    // Q-07: 8 karakter dari alfabet BR-07
    expect(created.code).toMatch(/^LS-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{8}$/);

    const loose = created.code.replace('LS-', '').toLowerCase();
    const tracked = await (await api(`/public/orders/${loose}`)).json();
    expect(tracked).toMatchObject({
      code: created.code,
      estimated_days: null,
      invoice_available: false,
    });
    expect(tracked).not.toHaveProperty('customer');
  });

  test('Idempotency-Key yang sama mengembalikan pesanan yang sama dengan 200', async () => {
    const headers = { 'Idempotency-Key': 'uji-1' };
    const first = await (
      await api('/public/orders', { method: 'POST', body: orderBody, headers })
    ).json();
    const again = await api('/public/orders', { method: 'POST', body: orderBody, headers });
    expect(again.status).toBe(200);
    expect((await again.json()).code).toBe(first.code);
  });

  test('item kosong ditolak dengan path field penuh', async () => {
    const res = await api('/public/orders', { method: 'POST', body: { ...orderBody, items: [] } });
    expect(res.status).toBe(422);
    expect((await res.json()).error.details[0]).toEqual({
      field: 'items',
      message: 'Pilih minimal satu layanan atau produk',
    });
  });

  test('format salah dan tidak ditemukan memberi pesan identik (AC-01.9)', async () => {
    const bad = await (await api('/public/orders/xx')).json();
    const missing = await (await api('/public/orders/LS-AAAAAAAA')).json();
    expect(bad).toEqual(missing);
  });
});

describe('mock API admin', () => {
  test('tanpa sesi ditolak 401', async () => {
    expect((await api('/admin/orders')).status).toBe(401);
  });

  test('login salah ditolak 401', async () => {
    const res = await api('/admin/auth/login', {
      method: 'POST',
      body: { username: 'owner', password: 'salah' },
    });
    expect(res.status).toBe(401);
  });

  test('konfirmasi lalu ubah status, dan updated_at usang memberi CONFLICT', async () => {
    await login();
    const list = await (await api('/admin/orders?status=pending_confirmation')).json();
    const { id, updated_at } = list.data[0];

    const confirmed = await (
      await api(`/admin/orders/${id}/confirm`, {
        method: 'POST',
        body: { estimated_days: 3, estimate_source: 'manual', updated_at },
      })
    ).json();
    expect(confirmed.status_label).toBe('Diterima');

    const stale = await api(`/admin/orders/${id}/status`, {
      method: 'POST',
      body: { to_status: 'processing', updated_at },
    });
    expect(stale.status).toBe(409);
    expect((await stale.json()).error.code).toBe('CONFLICT');

    const moved = await api(`/admin/orders/${id}/status`, {
      method: 'POST',
      body: { to_status: 'processing', updated_at: confirmed.updated_at },
    });
    expect((await moved.json()).status).toBe('processing');
  });

  test('pending_confirmation tidak boleh ke received lewat /status', async () => {
    await login();
    const { data } = await (await api('/admin/orders?status=pending_confirmation')).json();
    const res = await api(`/admin/orders/${data[0].id}/status`, {
      method: 'POST',
      body: { to_status: 'received', updated_at: data[0].updated_at },
    });
    expect((await res.json()).error.code).toBe('INVALID_TRANSITION');
  });

  test('pencarian nomor ternormalisasi menemukan pesanan yang sama', async () => {
    await login();
    const byLocal = await (await api('/admin/orders?q=0812000000')).json();
    const byIntl = await (await api('/admin/orders?q=%2B62812000000')).json();
    expect(byLocal.total).toBeGreaterThan(0);
    expect(byLocal.total).toBe(byIntl.total);
  });

  test('by_status dasbor berjumlah sama dengan totals.orders', async () => {
    await login();
    const body = await (await api('/admin/dashboard?from=2026-11-01&to=2026-11-30')).json();
    const sum = Object.values(body.totals.by_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(body.totals.orders);
  });
});

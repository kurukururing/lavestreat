import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, test } from 'vitest';

import { addDays, todayJakarta } from '../src/lib/format.js';
import { server } from '../src/mocks/server.js';
import { OrderDonePage } from '../src/pages/public/OrderDonePage.jsx';
import { OrderPage } from '../src/pages/public/OrderPage.jsx';

function renderOrder() {
  router = createMemoryRouter(
    [
      { path: '/pesan', element: <OrderPage /> },
      { path: '/pesan/selesai', element: <OrderDonePage /> },
    ],
    { initialEntries: ['/', '/pesan'], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
}
let router;

// Aksi tampil di kartu samping (desktop) dan bilah lengket (ponsel); keduanya ada di DOM.
const click = (name) => fireEvent.click(screen.getAllByRole('button', { name })[0]);
const type = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

async function fillUntilReview() {
  fireEvent.click(await screen.findByRole('button', { name: 'Tambah Easy Clean' }));
  click('Lanjutkan');
  fireEvent.click(screen.getByRole('radio', { name: /Antar sendiri/ }));
  click('Lanjutkan');
  type('Nama lengkap', 'Budi Contoh');
  type('Nomor WhatsApp', '081200000000');
  type('Tanggal', addDays(todayJakarta(), 1));
  fireEvent.click(screen.getByRole('radio', { name: /SIANG/ }));
  click('Lanjutkan');
}

afterEach(() => sessionStorage.clear());

describe('Form pemesanan PG-2 dan konfirmasi PG-3', () => {
  test('jalur utama: pilih, metode, data, ringkasan, kirim, lalu ID tampil', async () => {
    renderOrder();
    expect(screen.getAllByText(/Langkah 1 dari 4/)[0]).toBeInTheDocument();
    await fillUntilReview();

    expect(screen.getByRole('heading', { name: 'Periksa pesanan Anda' })).toBeInTheDocument();
    expect(screen.getByText('Antar sendiri ke outlet')).toBeInTheDocument();
    click('Kirim Pesanan');

    expect(await screen.findByRole('heading', { name: 'Pesanan terkirim' })).toBeInTheDocument();
    expect(screen.getByText(/^LS-[A-Z2-9]{8}$/)).toBeInTheDocument();
    expect(screen.getByText('Menunggu konfirmasi')).toBeInTheDocument();
    const summary = within(screen.getByRole('region', { name: 'Ringkasan' }));
    // Total dari respons server: Easy Clean 15.000 + antar sendiri 0.
    expect(summary.getAllByText('Rp15.000').length).toBeGreaterThan(0);
    expect(summary.getByText('Rp0')).toBeInTheDocument();
  });

  test('Lanjutkan tanpa item dan tanpa data wajib ditolak dengan pesan', async () => {
    renderOrder();
    click('Lanjutkan');
    expect(screen.getAllByText('Pilih minimal satu layanan atau produk.')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Langkah 1 dari 4/)[0]).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Tambah Easy Clean' }));
    click('Lanjutkan');
    click('Lanjutkan');
    expect(
      screen.getByText('Pilih dijemput kurir atau antar sendiri ke outlet.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /Dijemput kurir/ }));
    click('Lanjutkan');
    expect(screen.getByText('Pilih area penjemputan.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /Sidoarjo/ }));
    click('Lanjutkan');
    click('Lanjutkan');
    // Nama, WhatsApp, tanggal, slot, dan alamat jemput.
    expect(screen.getByText('Periksa 5 isian yang ditandai di bawah.')).toBeInTheDocument();
    expect(screen.getAllByText(/Langkah 3 dari 4/)[0]).toBeInTheDocument();
  });

  test('galat validasi server membawa pembeli ke field yang salah; body tanpa uang', async () => {
    let sent;
    server.use(
      http.post('/api/public/orders', async ({ request }) => {
        sent = { key: request.headers.get('Idempotency-Key'), body: await request.json() };
        return HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Data pesanan tidak valid.',
              details: [{ field: 'customer.phone', message: 'Nomor WhatsApp tidak valid.' }],
            },
          },
          { status: 422 },
        );
      }),
    );
    renderOrder();
    await fillUntilReview();
    click('Kirim Pesanan');

    expect(await screen.findByText('Nomor WhatsApp tidak valid.')).toBeInTheDocument();
    expect(screen.getAllByText(/Langkah 3 dari 4/)[0]).toBeInTheDocument();
    expect(sent.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(sent.body).toMatchObject({
      order_type: 'treatment',
      items: [{ catalog_code: 'EASY', qty: 1 }],
      fulfillment: 'dropoff',
      area: null,
      address_text: null,
      website: '',
    });
    expect(Object.keys(sent.body).some((k) => k.endsWith('_idr'))).toBe(false);
  });

  test('Back browser memundurkan langkah; di langkah Data muncul peringatan', async () => {
    renderOrder();
    fireEvent.click(await screen.findByRole('button', { name: 'Tambah Easy Clean' }));
    click('Lanjutkan');
    expect((await screen.findAllByText(/Langkah 2 dari 4/))[0]).toBeInTheDocument();
    await act(() => router.navigate(-1));
    expect((await screen.findAllByText(/Langkah 1 dari 4/))[0]).toBeInTheDocument();
    // Pilihan item tetap ada setelah mundur.
    expect(screen.getByRole('button', { name: 'Kurangi Easy Clean' })).toBeEnabled();

    click('Lanjutkan');
    fireEvent.click(await screen.findByRole('radio', { name: /Antar sendiri/ }));
    click('Lanjutkan');
    type('Nama lengkap', 'Budi Contoh');

    await act(() => router.navigate(-1));
    const dialog = await screen.findByRole('dialog', { name: 'Kembali ke langkah Metode?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tetap di sini' }));
    expect(screen.getAllByText(/Langkah 3 dari 4/)[0]).toBeInTheDocument();

    // Tombol "Kembali" di halaman juga memunculkan peringatan yang sama.
    click('Kembali');
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Kembali' }),
    );
    expect((await screen.findAllByText(/Langkah 2 dari 4/))[0]).toBeInTheDocument();
    click('Lanjutkan');
    expect(await screen.findByLabelText('Nama lengkap')).toHaveValue('Budi Contoh');
  });

  test('beli produk saja: product_only, teks antar/ambil, tanpa foto', async () => {
    let sent;
    server.use(
      http.post('/api/public/orders', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          {
            code: 'LS-ABCDEFGH',
            status: 'pending_confirmation',
            subtotal_idr: 15000,
            shipping_idr: 0,
            total_idr: 15000,
          },
          { status: 201 },
        );
      }),
    );
    renderOrder();
    fireEvent.click(await screen.findByRole('button', { name: /^Produk \(opsional\)/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tambah Shoe Cleaner' }));
    click('Lanjutkan');
    expect(await screen.findByText('Bagaimana produk sampai ke Anda?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Ambil di outlet/ }));
    click('Lanjutkan');
    expect(screen.getByRole('heading', { name: 'Jadwal ambil di outlet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pilih foto' })).not.toBeInTheDocument();
    type('Nama lengkap', 'Budi Contoh');
    type('Nomor WhatsApp', '081200000000');
    type('Tanggal', addDays(todayJakarta(), 1));
    fireEvent.click(screen.getByRole('radio', { name: /SIANG/ }));
    click('Lanjutkan');
    click('Kirim Pesanan');

    expect(await screen.findByRole('heading', { name: 'Pesanan terkirim' })).toBeInTheDocument();
    expect(sent).toMatchObject({
      order_type: 'product_only',
      items: [{ catalog_code: 'SHOE_CLEANER', qty: 1 }],
      fulfillment: 'dropoff',
    });
  });

  test('konfirmasi tanpa data pesanan kembali ke form', async () => {
    const router = createMemoryRouter(
      [
        { path: '/pesan', element: <p>Form</p> },
        { path: '/pesan/selesai', element: <OrderDonePage /> },
      ],
      { initialEntries: ['/pesan/selesai'] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Form')).toBeInTheDocument();
  });
});

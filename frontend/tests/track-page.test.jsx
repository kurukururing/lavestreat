import { fireEvent, render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, test, vi } from 'vitest';

import { server } from '../src/mocks/server.js';
import { NotFoundPage } from '../src/pages/public/NotFoundPage.jsx';
import { PrivacyPage } from '../src/pages/public/PrivacyPage.jsx';
import { TrackPage } from '../src/pages/public/TrackPage.jsx';

const NOT_FOUND = 'ID pesanan tidak ditemukan. Periksa kembali.';

function renderAt(url, element = <TrackPage />) {
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [url] });
  render(<RouterProvider router={router} />);
  return router;
}

function search(value) {
  fireEvent.change(screen.getByLabelText('ID pesanan'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
}

describe('Lacak pesanan PG-4', () => {
  test('ID valid tanpa awalan dan huruf kecil menampilkan data minimal tanpa kontak', async () => {
    const router = renderAt('/lacak');
    search('7k3m9qw2');
    expect(await screen.findByRole('heading', { name: 'LS-7K3M9QW2' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?id=7k3m9qw2');
    expect(screen.getByText(/^Halo, /)).toBeInTheDocument();
    expect(screen.getByText('Menunggu konfirmasi pemilik')).toBeInTheDocument();
    // AC-01.12: estimasi belum tersedia sebelum dikonfirmasi.
    expect(screen.getByText('Belum tersedia')).toBeInTheDocument();
    expect(screen.queryByText(/Foto & nota/)).not.toBeInTheDocument();
    // AC-01.8: tidak ada nomor telepon atau alamat di halaman.
    expect(document.body.textContent).not.toMatch(/08\d{8,}|Jl\./);
    expect(screen.getByRole('link', { name: /Hubungi LAVE STREAT di WhatsApp/ })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    );
  });

  test('format salah dan ID tidak ada memakai pesan identik (AC-01.9)', async () => {
    renderAt('/lacak?id=abc');
    expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument();
    search('LS-ZZZZZZZZ');
    expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument();
    // Galat hilang begitu ID diubah.
    fireEvent.change(screen.getByLabelText('ID pesanan'), { target: { value: 'LS-7' } });
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
  });

  test('batas percobaan: pesan dan tombol Cari nonaktif sampai ID diubah', async () => {
    server.use(
      http.get('/api/public/orders/:code', () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan.' } },
          { status: 429 },
        ),
      ),
    );
    renderAt('/lacak?id=LS-7K3M9QW2');
    expect(
      await screen.findByText('Terlalu banyak percobaan, coba lagi beberapa menit lagi.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cari' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('ID pesanan'), { target: { value: 'LS-7K3M9QW3' } });
    expect(screen.getByRole('button', { name: 'Cari' })).toBeEnabled();
  });

  test('server gagal menampilkan galat dengan Coba lagi', async () => {
    server.use(http.get('/api/public/orders/:code', () => new HttpResponse(null, { status: 500 })));
    renderAt('/lacak?id=LS-7K3M9QW2');
    expect(await screen.findByText('Layanan sedang tidak tersedia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });

  test('diproses: estimasi tampil, nota terkunci', async () => {
    renderAt('/lacak?id=LS-P2XN5DK7');
    expect(await screen.findByText('Sepatu Anda sedang dicuci')).toBeInTheDocument();
    expect(screen.getByText(/^±\d+ hari$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh Nota/ })).toBeDisabled();
  });

  test('selesai: foto dan unduh nota PDF dari PUB-05', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:nota');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderAt('/lacak?id=LS-B9CF3KA4');
    const photos = within(await screen.findByRole('region', { name: 'Foto sebelum & sesudah' }));
    expect(photos.getAllByText('Foto belum tersedia')).toHaveLength(2);
    fireEvent.click(photos.getByRole('button', { name: 'Unduh Nota (PDF)' }));
    await vi.waitFor(() => expect(click).toHaveBeenCalled());
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    click.mockRestore();
  });

  test('produk saja memakai kata-kata produk (FR-09)', async () => {
    server.use(
      http.get('/api/public/orders/:code', () =>
        HttpResponse.json({
          code: 'LS-ABCDEFGH',
          status: 'received',
          status_label: 'Diterima',
          order_type: 'product_only',
          estimated_days: null,
          estimated_done_date: null,
          customer_name_masked: 'Budi C.',
          fulfillment: 'dropoff',
          area: null,
          scheduled_date: '2026-12-01',
          scheduled_slot: 'noon',
          items: [{ name: 'Shoe Cleaner', qty: 1 }],
          total_idr: 15000,
          photos: [],
          invoice_available: false,
        }),
      ),
    );
    renderAt('/lacak?id=LS-ABCDEFGH');
    expect(await screen.findByText('Ambil di outlet')).toBeInTheDocument();
    expect(screen.queryByText(/Antar sendiri/)).not.toBeInTheDocument();
  });

  test('dibatalkan: tanpa linimasa dan tanpa foto', async () => {
    renderAt('/lacak?id=LS-R8YT4AZ3');
    expect(await screen.findByText('Pesanan dibatalkan')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Status pesanan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Unduh Nota/ })).not.toBeInTheDocument();
  });
});

describe('Halaman 404 PG-5 dan privasi PG-6', () => {
  test('404 menautkan ke beranda dan lacak', () => {
    renderAt('/tidak-ada', <NotFoundPage />);
    expect(screen.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ke Beranda' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Lacak Pesanan' })).toHaveAttribute('href', '/lacak');
  });

  test('privasi menyebut prototype dan pihak ketiga (SEC-13, SEC-14)', () => {
    renderAt('/privasi', <PrivacyPage />);
    expect(screen.getByText('Ini prototype')).toBeInTheDocument();
    expect(screen.getByText(/Google Gemini/)).toBeInTheDocument();
    expect(screen.getByText(/OpenStreetMap/)).toBeInTheDocument();
  });
});

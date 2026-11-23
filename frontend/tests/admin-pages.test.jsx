import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeAll, describe, expect, test } from 'vitest';

import App from '../src/App.jsx';
import { login } from '../src/api/admin.js';
import { router } from '../src/app/router.jsx';
import { server } from '../src/mocks/server.js';

// jsdom tidak punya API ini; Recharts dan Radix membutuhkannya.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia ??= () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  Element.prototype.scrollIntoView ??= () => {};
});

async function openAt(path, { authed = true } = {}) {
  if (authed) await login({ username: 'owner', password: 'dummy-owner' });
  await act(() => router.navigate(path));
  render(<App />);
}

async function openOrder(code) {
  await openAt('/admin/pesanan');
  const [link] = await screen.findAllByRole('link', { name: code });
  fireEvent.click(link);
  return screen.findByRole('heading', { level: 1, name: new RegExp(code) });
}

describe('Login pemilik (AC-02.1)', () => {
  test('tanpa sesi diarahkan ke login, kredensial salah ditolak', async () => {
    await openAt('/admin/pesanan', { authed: false });
    expect(
      await screen.findByRole('heading', { name: 'Masuk ke panel pemilik' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'owner' } });
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'salah' } });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('Username atau kata sandi salah.')).toBeInTheDocument();
  });

  test('kredensial benar kembali ke halaman yang diminta', async () => {
    await openAt('/admin/pesanan', { authed: false });
    fireEvent.change(await screen.findByLabelText('Username'), { target: { value: 'owner' } });
    fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'dummy-owner' } });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByRole('heading', { name: 'Antrean pesanan' })).toBeInTheDocument();
  });
});

describe('Antrean pesanan (AC-02.2)', () => {
  test('filter status hanya menampilkan pesanan dengan status itu', async () => {
    await openAt('/admin/pesanan');
    expect((await screen.findAllByRole('link', { name: 'LS-H4TR8WN5' })).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Menunggu konfirmasi/ }));
    await waitFor(() =>
      expect(screen.queryAllByRole('link', { name: 'LS-H4TR8WN5' })).toHaveLength(0),
    );
    expect(screen.getAllByRole('link', { name: 'LS-7K3M9QW2' }).length).toBeGreaterThan(0);
  });
});

describe('Detail pesanan (FR-02)', () => {
  test('konfirmasi pesanan menunggu menjadi Diterima', async () => {
    await openOrder('LS-7K3M9QW2');
    // Estimasi AI otomatis terisi karena nilai AI masih kosong (AC-04.1).
    await screen.findByText(/hari \(1–14\)/);
    const [confirm] = screen.getAllByRole('button', { name: /Konfirmasi pesanan/ });
    fireEvent.click(confirm);
    expect(await screen.findByText('Pesanan dikonfirmasi. Status Diterima.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tandai Diproses' }).length).toBeGreaterThan(0);
  });

  test('dibuka ulang: nilai AI mentah tidak dipakai sebagai estimasi (D-04)', async () => {
    await openOrder('LS-7K3M9QW2');
    await screen.findByText(/Perkiraan selesai/); // estimasi otomatis selesai, AI tersimpan
    const path = router.state.location.pathname;
    await act(() => router.navigate('/admin/pesanan'));
    await act(() => router.navigate(path));
    expect(await screen.findByText(/Belum ada estimasi/)).toBeInTheDocument();
  });

  test('batal tanpa alasan cukup ditolak di dialog', async () => {
    await openOrder('LS-H4TR8WN5');
    fireEvent.click(screen.getAllByRole('button', { name: 'Batalkan' })[0]);
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Alasan pembatalan'), {
      target: { value: 'abc' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Batalkan Pesanan' }));
    expect(await within(dialog).findByText('Minimal 5 karakter.')).toBeInTheDocument();
  });

  test('CONFLICT menampilkan dialog muat ulang (AC-02.10)', async () => {
    server.use(
      http.post('/api/admin/orders/:id/status', () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: 'Pesanan sudah diubah.', details: [] } },
          { status: 409 },
        ),
      ),
    );
    await openOrder('LS-H4TR8WN5');
    fireEvent.click(screen.getAllByRole('button', { name: 'Tandai Diproses' })[0]);
    expect(await screen.findByText('Pesanan diubah di tempat lain')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat Ulang' })).toBeInTheDocument();
  });
});

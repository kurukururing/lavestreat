import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { describe, expect, test } from 'vitest';

import { HomePage } from '../src/pages/public/HomePage.jsx';

function TrackProbe() {
  const { state } = useLocation();
  return <p>lacak:{state?.code}</p>;
}

function renderHome() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <HomePage /> },
      { path: '/lacak', element: <TrackProbe /> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('Beranda (PG-1)', () => {
  test('menampilkan harga dari GET /api/public/catalog, ongkir, dan jam kerja', async () => {
    renderHome();
    expect((await screen.findAllByText('Rp25.000')).length).toBeGreaterThan(0); // Deep Clean
    expect(screen.getAllByText('Rp50.000').length).toBeGreaterThan(0); // Boots Clean
    expect(screen.getAllByText('Rp10.000').length).toBeGreaterThan(0); // ongkir Surabaya
    expect(screen.getAllByText('09:00–18:00 WIB').length).toBeGreaterThan(0);
  });

  test('lacak cepat kosong menampilkan galat dan tidak berpindah halaman', () => {
    const router = renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Masukkan ID pesanan.');
    expect(screen.getByLabelText(/Sudah pesan\?/)).toHaveAttribute('aria-invalid', 'true');
    expect(router.state.location.pathname).toBe('/');
  });

  test('lacak cepat membawa ID ke /lacak lewat state, bukan URL', async () => {
    const router = renderHome();
    fireEvent.change(screen.getByLabelText(/Sudah pesan\?/), {
      target: { value: ' LS-7K3M9QA2 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    expect(await screen.findByText('lacak:LS-7K3M9QA2')).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
  });

  test('tombol pesan layanan membawa kode layanan ke form', async () => {
    const router = renderHome();
    fireEvent.click(screen.getByRole('link', { name: 'Pesan White Clean' }));
    expect(router.state.location.pathname).toBe('/pesan');
    expect(router.state.location.state).toEqual({ service: 'WHITE' });
  });

  test('memilih sepatu lain mengganti foto pembanding', () => {
    renderHome();
    fireEvent.click(screen.getAllByRole('button', { name: /Koi Putih Pink/ })[0]);
    expect(screen.getByAltText('Koi Putih Pink sebelum dicuci')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Koi Putih Pink/ })[0]).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

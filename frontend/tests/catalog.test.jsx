import { fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, test } from 'vitest';

import { server } from '../src/mocks/server.js';
import { ServicesPage } from '../src/pages/public/ServicesPage.jsx';

// File sendiri: cache katalog di useCatalog hidup per modul, jadi tes galat butuh modul segar.

function renderServices() {
  const router = createMemoryRouter([{ path: '/', element: <ServicesPage /> }]);
  render(<RouterProvider router={router} />);
}

describe('Katalog publik (PUB-01)', () => {
  test('gagal dimuat: harga jadi "—", ada pemberitahuan, lalu "Coba lagi" memuat harga', async () => {
    // Hanya permintaan pertama gagal; percobaan ulang memakai handler mock asli.
    server.use(
      http.get(
        '/api/public/catalog',
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Terjadi kesalahan.' } },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    renderServices();

    expect(await screen.findByRole('alert')).toHaveTextContent('Harga belum bisa dimuat.');
    expect(screen.queryByText('Rp25.000')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Coba lagi/ }));
    expect((await screen.findAllByText('Rp25.000')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

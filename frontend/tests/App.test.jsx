import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import App from '../src/App.jsx';
import { server } from '../src/mocks/server.js';

test('beranda tampil dengan keterangan prototype dan tautan Privasi di footer', async () => {
  let sessionChecked = false;
  server.use(
    http.get('/api/admin/auth/me', () => {
      sessionChecked = true;
      return HttpResponse.json({ username: 'owner' });
    }),
  );
  render(<App />);
  expect(
    await screen.findByRole('heading', { level: 1, name: /Sepatu bersih lagi/ }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Mode prototype/)).not.toBeInTheDocument();
  expect(screen.getByText(/data dummy/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Privasi' })).toHaveAttribute('href', '/privasi');
  // Pembeli tidak memicu pemeriksaan sesi admin (ADM-03).
  expect(sessionChecked).toBe(false);
});

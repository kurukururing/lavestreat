import { fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, test } from 'vitest';

import { ContactPage } from '../src/pages/public/ContactPage.jsx';
import { GalleryPage } from '../src/pages/public/GalleryPage.jsx';
import { HowItWorksPage } from '../src/pages/public/HowItWorksPage.jsx';
import { ServicesPage } from '../src/pages/public/ServicesPage.jsx';

function renderPage(element) {
  const router = createMemoryRouter([{ path: '/', element }], { initialEntries: ['/'] });
  render(<RouterProvider router={router} />);
}

const cards = () => within(screen.getByRole('region', { name: /Hasil pengerjaan/ }));

describe('Halaman informasi (PG-7 sampai PG-10)', () => {
  test('Layanan: fakta dari katalog server dan panduan memilih', async () => {
    renderPage(<ServicesPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Perawatan untuk setiap jenis sepatu',
    );
    const hero = within(screen.getByRole('region', { name: /Perawatan untuk/ }));
    expect(await hero.findByText('Rp15.000')).toBeInTheDocument();
    expect(hero.getByText('9 layanan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sepatu putih kusam' })).toBeInTheDocument();
  });

  test('Cara kerja: lima status berlabel BR-08, tanpa Dibatalkan', () => {
    renderPage(<HowItWorksPage />);
    const statuses = within(screen.getByRole('region', { name: /Lima status/ }));
    for (const label of [
      'Menunggu konfirmasi',
      'Diterima',
      'Diproses',
      'Selesai',
      'Diambil/Diantar',
    ]) {
      expect(statuses.getByText(label)).toBeInTheDocument();
    }
    expect(statuses.queryByText('Dibatalkan')).not.toBeInTheDocument();
  });

  test('Galeri: filter kategori menyaring kartu dan kembali ke Semua', () => {
    renderPage(<GalleryPage />);
    expect(cards().getAllByRole('heading', { level: 3 })).toHaveLength(12);

    fireEvent.click(screen.getByRole('button', { name: /^Suede Clean/ }));
    expect(screen.getByRole('button', { name: /^Suede Clean/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      cards()
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Nerdy Suede']);
    expect(screen.getByText('Menampilkan 1 dari 12 hasil')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Semua/ }));
    expect(cards().getAllByRole('heading', { level: 3 })).toHaveLength(12);
  });

  test('Galeri: jumlah per kategori dihitung dari data', () => {
    renderPage(<GalleryPage />);
    expect(screen.getByRole('button', { name: /^Deep Clean/ })).toHaveTextContent(
      'Deep Clean, 7 hasil',
    );
    expect(screen.getByRole('button', { name: /^White Clean/ })).toHaveTextContent(
      'White Clean, 6 hasil',
    );
  });

  test('Kontak: tautan keluar aman, tanpa form dan tanpa peta', () => {
    renderPage(<ContactPage />);
    const wa = screen.getByRole('link', { name: /Chat WhatsApp/ });
    expect(wa).toHaveAttribute('href', 'https://wa.me/6285128024120');
    expect(wa).toHaveAttribute('target', '_blank');
    expect(wa).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Kirim email' })).toHaveAttribute(
      'href',
      'mailto:lavestreat@gmail.com',
    );
    expect(document.querySelector('form')).toBeNull();
    expect(screen.queryByText(/OpenStreetMap/)).not.toBeInTheDocument();
  });
});

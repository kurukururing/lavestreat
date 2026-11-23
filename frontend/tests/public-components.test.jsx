import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, test } from 'vitest';

import { PublicFooter } from '../src/components/layout/PublicFooter.jsx';
import { PublicHeader } from '../src/components/layout/PublicHeader.jsx';
import { BeforeAfterPair, BeforeAfterSlider } from '../src/components/ui/before-after.jsx';
import { ItemRow } from '../src/components/ui/item-row.jsx';
import { OrderStepper } from '../src/components/ui/order-stepper.jsx';
import { ServiceAccordion, ServiceAccordionItem } from '../src/components/ui/service-accordion.jsx';
import { StatusTimeline } from '../src/components/ui/status-timeline.jsx';

const Icon = () => null;
const photo = (alt) => ({ src: '/x.jpg', alt });

describe('OrderStepper', () => {
  test('langkah sebelum current selesai, current aktif', () => {
    render(<OrderStepper steps={['Layanan', 'Metode', 'Data', 'Ringkasan']} current={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Layanan (selesai)');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).toHaveTextContent('3');
  });
});

describe('ItemRow', () => {
  function Harness({ initial = 0 }) {
    const [qty, setQty] = useState(initial);
    return <ItemRow name="Easy Clean" price={15000} qty={qty} onQtyChange={setQty} icon={Icon} />;
  }

  test('menampilkan harga, terpilih saat qty > 0', () => {
    const { container } = render(<Harness />);
    expect(screen.getByText(/Rp15.000/)).toHaveTextContent('Rp15.000 / pasang');
    expect(container.firstChild).toHaveAttribute('data-selected', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Easy Clean' }));
    expect(container.firstChild).toHaveAttribute('data-selected', 'true');
  });

  test('tidak bisa melewati 10 pasang', () => {
    render(<Harness initial={10} />);
    expect(screen.getByRole('button', { name: 'Tambah Easy Clean' })).toBeDisabled();
  });
});

describe('ServiceAccordion', () => {
  test('badge jumlah dipilih dan buka-tutup panel', () => {
    render(
      <ServiceAccordion>
        <ServiceAccordionItem value="a" icon={Icon} title="Cuci reguler" selectedCount={2}>
          <p>Isi panel</p>
        </ServiceAccordionItem>
        <ServiceAccordionItem value="b" icon={Icon} title="Khusus" />
      </ServiceAccordion>,
    );
    expect(screen.getByText('2 dipilih')).toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /Cuci reguler/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Isi panel')).toBeVisible();
  });
});

describe('StatusTimeline', () => {
  test('status sebelumnya selesai, berikutnya "Belum"', () => {
    render(<StatusTimeline status="processing" times={{ received: '2026-12-01T02:12:00Z' }} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[1]).toHaveTextContent('Diterima (sudah)');
    expect(items[1]).toHaveTextContent('1 Des 2026, 09:12');
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items[3]).toHaveTextContent('Belum');
    expect(items[4]).toHaveTextContent('Diambil/Diantar');
  });

  test('dibatalkan mengganti linimasa dengan satu kartu', () => {
    render(<StatusTimeline status="cancelled" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('Pesanan dibatalkan')).toBeInTheDocument();
  });
});

describe('BeforeAfter', () => {
  test('slider bisa digeser lewat input range', () => {
    render(<BeforeAfterSlider before={photo('Sebelum dicuci')} after={photo('Sesudah dicuci')} />);
    const range = screen.getByRole('slider');
    expect(range).toHaveValue('50');
    fireEvent.change(range, { target: { value: '20' } });
    expect(screen.getByAltText('Sesudah dicuci').style.clipPath).toBe('inset(0 0 0 20%)');
  });

  test('foto yang belum ada diganti kotak "Foto belum tersedia"', () => {
    render(<BeforeAfterPair before={photo('Sebelum dicuci')} after={null} />);
    expect(screen.getByAltText('Sebelum dicuci')).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText(/Foto belum tersedia/)).toHaveTextContent(
      'Sesudah: Foto belum tersedia',
    );
  });
});

describe('PublicHeader dan PublicFooter', () => {
  test('tautan Beranda aktif di "/" dan menu ponsel bisa dibuka', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PublicHeader />
      </MemoryRouter>,
    );
    const desktopNav = screen.getAllByRole('navigation', { name: 'Navigasi utama' })[0];
    expect(within(desktopNav).getByRole('link', { name: 'Beranda' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Buka menu' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('link', { name: /Layanan & tarif/ })).toHaveAttribute(
      'href',
      '/layanan',
    );
    expect(within(dialog).getByRole('button', { name: 'Tutup menu' })).toBeInTheDocument();
  });

  test('tautan halaman informasi aktif di rutenya sendiri (D-16)', () => {
    render(
      <MemoryRouter initialEntries={['/galeri']}>
        <PublicHeader />
      </MemoryRouter>,
    );
    const nav = screen.getAllByRole('navigation', { name: 'Navigasi utama' })[0];
    expect(within(nav).getByRole('link', { name: 'Galeri' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Beranda' })).not.toHaveAttribute('aria-current');
  });

  test('footer memuat tautan Privasi (SEC-14)', () => {
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Privasi' })).toHaveAttribute('href', '/privasi');
  });
});

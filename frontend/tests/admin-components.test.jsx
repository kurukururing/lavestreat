import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { AdminSidebar } from '../src/components/layout/AdminSidebar.jsx';
import { Button } from '../src/components/ui/button.jsx';
import { Field } from '../src/components/ui/field.jsx';
import { Input } from '../src/components/ui/input.jsx';
import { QtyStepper } from '../src/components/ui/qty-stepper.jsx';
import { SegmentedControl } from '../src/components/ui/segmented-control.jsx';
import { StatusBadge } from '../src/components/ui/status-badge.jsx';
import { StatusSummaryCard } from '../src/features/dashboard/DashboardCards.jsx';
import { OrderList } from '../src/features/order-queue/OrderList.jsx';

describe('StatusBadge', () => {
  test('label BR-08: done = Selesai, completed = Diambil/Diantar', () => {
    render(
      <>
        <StatusBadge status="done" />
        <StatusBadge status="completed" />
      </>,
    );
    expect(screen.getByText('Selesai')).toBeInTheDocument();
    expect(screen.getByText('Diambil/Diantar')).toBeInTheDocument();
  });

  test('status tak dikenal tidak dirender', () => {
    const { container } = render(<StatusBadge status="unknown" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Button', () => {
  test('loading menonaktifkan tombol dan mengganti label', () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingText="Mengirim…" onClick={onClick}>
        Kirim Pesanan
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Mengirim…' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Field', () => {
  test('menghubungkan label dan teks bantu ke input', () => {
    render(
      <Field label="Nama lengkap" helper="2–80 karakter">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Nama lengkap');
    expect(input).toHaveAccessibleDescription('2–80 karakter');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  test('galat ditandai aria-invalid dan role alert', () => {
    render(
      <Field label="Nama lengkap" helper="2–80 karakter" error="Nama minimal 2 karakter.">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Nama lengkap');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Nama minimal 2 karakter.');
    expect(screen.queryByText('2–80 karakter')).not.toBeInTheDocument();
  });
});

describe('QtyStepper', () => {
  function Harness({ initial, max }) {
    const [value, setValue] = useState(initial);
    return <QtyStepper value={value} onChange={setValue} max={max} itemName="Easy Clean" />;
  }

  test('tombol kurangi nonaktif di nol, tambah menaikkan jumlah', () => {
    render(<Harness initial={0} max={10} />);
    expect(screen.getByRole('button', { name: 'Kurangi Easy Clean' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Easy Clean' }));
    expect(screen.getByRole('group', { name: 'Jumlah Easy Clean' })).toHaveTextContent('1');
  });

  test('tombol tambah nonaktif di batas atas', () => {
    render(<Harness initial={10} max={10} />);
    expect(screen.getByRole('button', { name: 'Tambah Easy Clean' })).toBeDisabled();
  });
});

test('SegmentedControl menandai pilihan dan memanggil onChange', () => {
  const onChange = vi.fn();
  render(
    <SegmentedControl
      label="Periode"
      value="7d"
      onChange={onChange}
      options={[
        { value: '7d', label: '7 hari' },
        { value: '30d', label: '30 hari' },
      ]}
    />,
  );
  expect(screen.getByRole('radio', { name: '7 hari' })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('radio', { name: '30 hari' }));
  expect(onChange).toHaveBeenCalledWith('30d');
});

describe('AdminSidebar', () => {
  test('Pesanan baru aktif di /admin/pesanan/baru, bukan Antrean', () => {
    render(<AdminSidebar activePath="/admin/pesanan/baru" />);
    expect(screen.getByRole('link', { name: 'Pesanan baru' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Antrean pesanan' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  test('Antrean aktif di detail pesanan dan menampilkan badge hitungan', () => {
    render(<AdminSidebar activePath="/admin/pesanan/LS-7K3M9QW2" pendingCount={3} />);
    const queue = screen.getByRole('link', { name: /Antrean pesanan/ });
    expect(queue).toHaveAttribute('aria-current', 'page');
    expect(within(queue).getByLabelText('3 pesanan menunggu konfirmasi')).toHaveTextContent('3');
    expect(screen.getByRole('link', { name: 'Dasbor' })).not.toHaveAttribute('aria-current');
  });

  test('badge tidak tampil bila tidak ada pesanan menunggu', () => {
    render(<AdminSidebar activePath="/admin" pendingCount={0} />);
    expect(screen.queryByLabelText(/menunggu konfirmasi/)).not.toBeInTheDocument();
  });

  test('tombol Keluar memanggil onLogout', () => {
    const onLogout = vi.fn();
    render(<AdminSidebar activePath="/admin" onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});

test('StatusSummaryCard menampilkan empat status tanpa Menunggu konfirmasi dan Dibatalkan', () => {
  render(<StatusSummaryCard counts={{ received: 4, processing: 6, done: 10, completed: 100 }} />);
  const items = screen.getAllByRole('listitem');
  expect(items.map((li) => li.textContent)).toEqual([
    '4Diterima',
    '6Diproses',
    '10Selesai',
    '100Diambil/Diantar',
  ]);
  expect(screen.queryByText('Dibatalkan')).not.toBeInTheDocument();
});

test('OrderList memformat jadwal, total, dan tautan detail', () => {
  const order = {
    id: 'o1',
    code: 'LS-7K3M9QW2',
    status: 'pending_confirmation',
    customer_name: 'Budi Contoh',
    scheduled_date: '2026-12-01',
    scheduled_slot: 'noon',
    total_idr: 45000,
  };
  render(<OrderList orders={[order]} getHref={(o) => `/admin/pesanan/${o.id}`} />);
  const table = screen.getByRole('table');
  expect(within(table).getByRole('link', { name: 'LS-7K3M9QW2' })).toHaveAttribute(
    'href',
    '/admin/pesanan/o1',
  );
  expect(within(table).getByText('Budi C.')).toBeInTheDocument();
  expect(within(table).getByText('1 Des 2026 · SIANG')).toBeInTheDocument();
  expect(within(table).getByText('Rp45.000')).toBeInTheDocument();
});

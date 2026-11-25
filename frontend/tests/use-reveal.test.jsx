import { useRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useReveal } from '../src/hooks/useReveal.js';

function Harness() {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <div ref={ref} data-testid="root">
      <p data-reveal>Satu</p>
    </div>
  );
}

function TestWithButton() {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <div ref={ref}>
      <article data-reveal>
        <button type="button">Pesan</button>
      </article>
    </div>
  );
}

/** IO palsu: menyimpan callback dan elemen yang diamati agar tes bisa memicu perpotongan. */
function installIO() {
  const io = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(), callback: null };
  window.IntersectionObserver = vi.fn(function (cb) {
    io.callback = cb;
    return io;
  });
  return io;
}

function setReducedMotion(matches) {
  window.matchMedia = vi.fn(() => ({ matches, addEventListener() {}, removeEventListener() {} }));
}

describe('useReveal', () => {
  const originalIO = window.IntersectionObserver;
  const originalMM = window.matchMedia;

  beforeEach(() => setReducedMotion(false));
  afterEach(() => {
    window.IntersectionObserver = originalIO;
    window.matchMedia = originalMM;
  });

  test('tanpa IntersectionObserver semua langsung tampil', () => {
    delete window.IntersectionObserver;
    render(<Harness />);
    expect(screen.getByText('Satu')).toHaveAttribute('data-revealed');
    expect(screen.getByText('Satu')).not.toHaveAttribute('data-reveal-hidden');
  });

  test('reduce motion langsung tampil tanpa menunggu perpotongan', () => {
    const io = installIO();
    setReducedMotion(true);
    render(<Harness />);
    expect(screen.getByText('Satu')).toHaveAttribute('data-revealed');
    expect(io.observe).not.toHaveBeenCalled();
  });

  test('di luar layar disembunyikan, lalu tampil saat berpotongan dan berhenti diamati', () => {
    const io = installIO();
    render(<Harness />);
    const p = screen.getByText('Satu');
    // Sebelum observer melapor, elemen tetap tampil (tidak ada kedipan).
    expect(p).not.toHaveAttribute('data-reveal-hidden');
    expect(io.observe).toHaveBeenCalledWith(p);

    io.callback([{ isIntersecting: false, target: p }]);
    expect(p).toHaveAttribute('data-reveal-hidden');
    expect(p).not.toHaveAttribute('data-revealed');

    io.callback([{ isIntersecting: true, target: p }]);
    expect(p).toHaveAttribute('data-revealed');
    expect(p).not.toHaveAttribute('data-reveal-hidden');
    expect(io.unobserve).toHaveBeenCalledWith(p);
  });

  test('elemen yang sudah di layar saat mulai tidak pernah disembunyikan', () => {
    const io = installIO();
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    render(<Harness />);
    const p = screen.getByText('Satu');
    io.callback([{ isIntersecting: true, target: p }]);
    expect(p).toHaveAttribute('data-revealed');
    expect(p).not.toHaveAttribute('data-reveal-hidden');
    // Posisi dari observer, bukan baca layout sinkron (memaksa layout saat render).
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('fokus keyboard ke dalam elemen tersembunyi langsung menampilkannya', () => {
    const io = installIO();
    render(<TestWithButton />);
    const button = screen.getByRole('button', { name: 'Pesan' });
    io.callback([{ isIntersecting: false, target: button.closest('[data-reveal]') }]);
    expect(button.closest('[data-reveal]')).toHaveAttribute('data-reveal-hidden');
    button.focus();
    expect(button.closest('[data-reveal]')).toHaveAttribute('data-revealed');
  });

  test('elemen yang ditambahkan belakangan ikut diamati', async () => {
    const io = installIO();
    render(<Harness />);
    const late = document.createElement('div');
    late.setAttribute('data-reveal', '');
    screen.getByTestId('root').appendChild(late);
    await waitFor(() => expect(io.observe).toHaveBeenCalledWith(late));
  });
});

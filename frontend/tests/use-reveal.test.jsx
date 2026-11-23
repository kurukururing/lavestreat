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
    delete document.documentElement.dataset.revealReady;
  });

  test('tanpa IntersectionObserver semua langsung tampil', () => {
    delete window.IntersectionObserver;
    render(<Harness />);
    expect(screen.getByText('Satu')).toHaveAttribute('data-revealed');
    expect(document.documentElement).not.toHaveAttribute('data-reveal-ready');
  });

  test('reduce motion langsung tampil tanpa menunggu perpotongan', () => {
    const io = installIO();
    setReducedMotion(true);
    render(<Harness />);
    expect(screen.getByText('Satu')).toHaveAttribute('data-revealed');
    expect(io.observe).not.toHaveBeenCalled();
  });

  test('menandai elemen saat berpotongan lalu berhenti mengamati', () => {
    const io = installIO();
    render(<Harness />);
    const p = screen.getByText('Satu');
    expect(p).not.toHaveAttribute('data-revealed');
    expect(document.documentElement).toHaveAttribute('data-reveal-ready');
    expect(io.observe).toHaveBeenCalledWith(p);

    io.callback([{ isIntersecting: true, target: p }]);
    expect(p).toHaveAttribute('data-revealed');
    expect(io.unobserve).toHaveBeenCalledWith(p);
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

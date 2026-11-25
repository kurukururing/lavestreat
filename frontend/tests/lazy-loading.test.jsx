import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageLoader } from '../src/app/PageLoader.jsx';
import { LazyImage } from '../src/components/ui/lazy-image.jsx';

describe('LazyImage', () => {
  it('dimuat malas dengan skeleton, lalu memudar masuk setelah selesai', () => {
    render(<LazyImage src="/a.jpg" alt="Sepatu" />);
    const img = screen.getByAltText('Sepatu');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('data-state', 'loading');
    expect(img).toHaveClass('animate-pulse');

    fireEvent.load(img);
    expect(img).toHaveAttribute('data-state', 'fading');
    expect(img).not.toHaveClass('animate-pulse');
  });

  it('gagal dimuat: skeleton berhenti agar teks alt terlihat', () => {
    render(<LazyImage src="/rusak.jpg" alt="Rusak" />);
    const img = screen.getByAltText('Rusak');
    fireEvent.error(img);
    expect(img).toHaveAttribute('data-state', 'done');
    expect(img).not.toHaveClass('animate-pulse');
  });
});

describe('PageLoader', () => {
  it.each(['public', 'admin', 'blank'])('varian %s tetap diumumkan ke pembaca layar', (variant) => {
    render(<PageLoader variant={variant} />);
    expect(screen.getByRole('status')).toHaveTextContent('Memuat…');
  });
});

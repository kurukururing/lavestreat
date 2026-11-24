import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, test } from 'vitest';

import { PublicHeader } from '../src/components/layout/PublicHeader.jsx';

describe('PublicHeader', () => {
  afterEach(() => {
    window.scrollY = 0;
  });

  test('lengket di atas dan menandai halaman sudah digulir', () => {
    render(
      <MemoryRouter>
        <PublicHeader />
      </MemoryRouter>,
    );
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0');
    expect(header).toHaveAttribute('data-scrolled', 'false');

    window.scrollY = 20;
    fireEvent.scroll(window);
    expect(header).toHaveAttribute('data-scrolled', 'true');

    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(header).toHaveAttribute('data-scrolled', 'false');
  });
});

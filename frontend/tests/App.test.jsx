import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from '../src/App.jsx';

test('menampilkan nama aplikasi dan label prototype', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'LAVE STREAT' })).toBeInTheDocument();
  expect(screen.getByText(/data dummy/i)).toBeInTheDocument();
});

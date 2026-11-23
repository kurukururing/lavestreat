import { describe, expect, test } from 'vitest';

import { formatDate, formatRupiah, formatSlot, initials } from '../src/lib/format.js';

describe('formatRupiah', () => {
  test('titik pemisah ribuan tanpa desimal', () => {
    expect(formatRupiah(15000)).toBe('Rp15.000');
    expect(formatRupiah(3450000)).toBe('Rp3.450.000');
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(500)).toBe('Rp500');
  });

  test('angka negatif tetap terbaca', () => {
    expect(formatRupiah(-5000)).toBe('-Rp5.000');
  });
});

describe('formatDate', () => {
  test('tanggal kalender tidak bergeser zona waktu', () => {
    expect(formatDate('2026-12-01')).toBe('1 Des 2026');
  });

  test('timestamp UTC dihitung dalam WIB', () => {
    // 30 Nov 20:00 UTC = 1 Des 03:00 WIB
    expect(formatDate('2026-11-30T20:00:00.000Z')).toBe('1 Des 2026');
  });
});

describe('formatSlot', () => {
  test('kode ke label BR-05', () => {
    expect(formatSlot('morning')).toBe('PAGI');
    expect(formatSlot('noon', { withTime: true })).toBe('SIANG 13:00–16:00');
  });

  test('kode tak dikenal dikembalikan apa adanya', () => {
    expect(formatSlot('midnight')).toBe('midnight');
  });
});

test('initials mengambil dua huruf awal', () => {
  expect(initials('Budi Contoh')).toBe('BC');
  expect(initials('Naufal')).toBe('N');
  expect(initials('  ')).toBe('');
});

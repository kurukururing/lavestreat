import { describe, expect, test } from 'vitest';

import { validateItems, validateSchedule } from '../src/features/order-form/order-form.js';
import { addDays, todayJakarta } from '../src/lib/format.js';

const today = todayJakarta();
const schedule = (over) => ({
  fulfillment: 'dropoff',
  area: null,
  address_text: '',
  scheduled_date: today,
  scheduled_slot: 'morning',
  ...over,
});

describe('validateSchedule (AC-01.4)', () => {
  test('hari ini sampai 30 hari ke depan diterima', () => {
    expect(validateSchedule(schedule())).toEqual({});
    expect(validateSchedule(schedule({ scheduled_date: addDays(today, 30) }))).toEqual({});
  });

  test('tanggal lampau dan lebih dari 30 hari ditolak', () => {
    expect(validateSchedule(schedule({ scheduled_date: addDays(today, -1) }))).toHaveProperty(
      'scheduled_date',
    );
    expect(validateSchedule(schedule({ scheduled_date: addDays(today, 31) }))).toHaveProperty(
      'scheduled_date',
    );
  });

  test('dijemput wajib area dan alamat 10–300 karakter', () => {
    const errors = validateSchedule(schedule({ fulfillment: 'pickup', address_text: 'Jl. A' }));
    expect(Object.keys(errors).sort()).toEqual(['address_text', 'area']);
  });
});

test('validateItems menolak add-on tanpa layanan cuci', () => {
  expect(validateItems([{ catalog_code: 'UNYELLOWING', qty: 1 }])).toHaveProperty('items');
  expect(validateItems([{ catalog_code: 'EASY', qty: 1 }])).toEqual({});
});

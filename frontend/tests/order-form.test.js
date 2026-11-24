import { describe, expect, test } from 'vitest';

import {
  orderTypeOf,
  publicItemsError,
  slotPassed,
  validateCustomer,
  validateItems,
  validateSchedule,
} from '../src/features/order-form/order-form.js';
import { addDays, todayJakarta } from '../src/lib/format.js';

const today = todayJakarta();
// 08:00 WIB hari ini: belum ada slot yang lewat, jadi hasil tes tidak bergantung jam menjalankan.
const EARLY = new Date(`${today}T01:00:00Z`);
const check = (v) => validateSchedule(v, EARLY);
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
    expect(check(schedule())).toEqual({});
    expect(check(schedule({ scheduled_date: addDays(today, 30) }))).toEqual({});
  });

  test('tanggal lampau dan lebih dari 30 hari ditolak', () => {
    expect(check(schedule({ scheduled_date: addDays(today, -1) }))).toHaveProperty(
      'scheduled_date',
    );
    expect(check(schedule({ scheduled_date: addDays(today, 31) }))).toHaveProperty(
      'scheduled_date',
    );
  });

  test('dijemput wajib area dan alamat 10–300 karakter', () => {
    const errors = check(schedule({ fulfillment: 'pickup', address_text: 'Jl. A' }));
    expect(Object.keys(errors).sort()).toEqual(['address_text', 'area']);
  });
});

test('validateItems menolak add-on tanpa layanan cuci', () => {
  expect(validateItems([{ catalog_code: 'UNYELLOWING', qty: 1 }])).toHaveProperty('items');
  expect(validateItems([{ catalog_code: 'EASY', qty: 1 }])).toEqual({});
});

describe('slot hari ini yang sudah lewat (AC-01.4)', () => {
  const at1230 = new Date(`${today}T05:30:00Z`); // 12:30 WIB

  test('PAGI lewat setelah 12:00 WIB, SIANG belum; besok tidak terpengaruh', () => {
    expect(slotPassed('morning', today, at1230)).toBe(true);
    expect(slotPassed('noon', today, at1230)).toBe(false);
    expect(slotPassed('morning', addDays(today, 1), at1230)).toBe(false);
  });

  test('validateSchedule menolak slot yang sudah lewat', () => {
    expect(validateSchedule(schedule({ scheduled_slot: 'morning' }), at1230)).toHaveProperty(
      'scheduled_slot',
    );
  });
});

describe('validateCustomer (AC-01.3, BR-06)', () => {
  const customer = (over) => ({
    name: 'Budi Contoh',
    phone: '0812-0000-0000',
    email: '',
    customer_notes: '',
    ...over,
  });

  test('format 08…, 628…, +628… dengan spasi atau tanda hubung diterima', () => {
    for (const phone of ['081200000000', '0812 0000 0000', '6281200000000', '+62 812-0000-0000']) {
      expect(validateCustomer(customer({ phone }))).toEqual({});
    }
  });

  test('nama pendek, nomor salah, email salah, dan catatan > 500 ditandai per path', () => {
    const errors = validateCustomer(
      customer({ name: 'B', phone: '0812', email: 'bukan-email', customer_notes: 'x'.repeat(501) }),
    );
    expect(Object.keys(errors).sort()).toEqual([
      'customer.email',
      'customer.name',
      'customer.phone',
      'customer_notes',
    ]);
  });
});

describe('publicItemsError (AC-01.1, BR-02)', () => {
  test('kosong ditolak dengan pesan AC-01.1', () => {
    expect(publicItemsError({})).toBe('Pilih minimal satu layanan atau produk.');
    expect(publicItemsError({ EASY: 0 })).toBe('Pilih minimal satu layanan atau produk.');
  });

  test('layanan saja atau dengan add-on dan produk diterima', () => {
    expect(publicItemsError({ EASY: 2, UNYELLOWING: 2, SHOE_CLEANER: 1 })).toBeNull();
  });

  test('produk saja diterima sebagai product_only (FR-09)', () => {
    expect(publicItemsError({ SHOE_CLEANER: 1, SHOE_REFRESHER: 2 })).toBeNull();
    expect(orderTypeOf({ SHOE_CLEANER: 1 })).toBe('product_only');
    expect(orderTypeOf({ SHOE_CLEANER: 1, EASY: 1 })).toBe('treatment');
  });

  test('add-on tanpa layanan, add-on melebihi pasang, dan Express + Fast Track ditolak', () => {
    expect(publicItemsError({ UNYELLOWING: 1, SHOE_CLEANER: 1 })).toMatch(/bersama layanan/);
    expect(publicItemsError({ EASY: 1, UNYELLOWING: 2 })).toMatch(/add-on/);
    expect(publicItemsError({ EXPRESS: 1, FASTTRACK: 1 })).toMatch(/bersamaan/);
  });
});

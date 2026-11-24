import { afterEach, describe, expect, test, vi } from 'vitest';

import { newId } from '../src/lib/utils.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.restoreAllMocks());

describe('newId', () => {
  test('tanpa crypto.randomUUID (HTTP lokal) tetap UUID v4 dan unik', () => {
    vi.spyOn(crypto, 'randomUUID', 'get').mockReturnValue(undefined);
    const a = newId();
    expect(a).toMatch(UUID_V4);
    expect(newId()).not.toBe(a);
  });
});

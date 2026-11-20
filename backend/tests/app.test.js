import path from 'node:path';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp({
  distDir: path.resolve(import.meta.dirname, 'fixtures/spa'),
  trustProxyHops: 1,
});

describe('penyajian SPA dan /api', () => {
  test.each(['/', '/lacak', '/admin/pesanan'])('GET %s memberi index.html', async (url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  test('rute /api tak dikenal memberi 404 NOT_FOUND JSON, bukan HTML', async () => {
    const res = await request(app).get('/api/xyz');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Data yang diminta tidak ditemukan.' },
    });
  });

  test('POST non-/api tidak jatuh ke fallback SPA', async () => {
    const res = await request(app).post('/lacak');
    expect(res.status).toBe(404);
  });

  test('trust proxy memakai TRUST_PROXY_HOPS', () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});

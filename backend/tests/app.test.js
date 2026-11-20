import path from 'node:path';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
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

  test('JSON rusak memberi 422 VALIDATION_ERROR dan body tidak masuk log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/x')
      .set('Content-Type', 'application/json')
      .send('{"phone":"081200000000"');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(log.mock.calls)).not.toContain('081200000000');
    log.mockRestore();
  });

  test('JSON di atas 100 kb ditolak 422, bukan 500', async () => {
    const res = await request(app)
      .post('/api/x')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ notes: 'x'.repeat(200_000) }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('trust proxy memakai TRUST_PROXY_HOPS', () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});

import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import { AppError } from './lib/errors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { spaFallback } from './middleware/spaFallback.js';

/**
 * @param {{ distDir: string, trustProxyHops: number }} options
 */
export function createApp({ distDir, trustProxyHops }) {
  const app = express();
  // Tanpa ini req.ip selalu IP proxy Render, rate limit dan hash IP jadi salah.
  app.set('trust proxy', trustProxyHops);
  app.disable('x-powered-by');
  // Bawaan helmet: CORP same-origin dan CSP 'self', cocok untuk hasil build Vite (satu origin).
  app.use(helmet());
  app.use(express.json({ limit: '16mb' }));

  // Rute /api/* didaftarkan di sini oleh modul fitur.

  app.use('/api', (req, res, next) =>
    next(new AppError(404, 'NOT_FOUND', 'Data yang diminta tidak ditemukan.')),
  );

  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        // Aset Vite ber-hash aman di-cache lama.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  app.use(spaFallback(distDir));
  app.use(errorHandler);
  return app;
}

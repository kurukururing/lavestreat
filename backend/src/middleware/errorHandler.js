import { AppError } from '../lib/errors.js';

// Express mengenali error handler dari 4 argumen, jadi _next wajib ada.
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    return res.status(err.status).json(body);
  }
  // Galat 4xx dari body-parser (JSON rusak, body terlalu besar): salah klien, bukan server.
  if (err.expose && err.status >= 400 && err.status < 500) {
    return res
      .status(422)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'Data yang dikirim belum valid.' } });
  }
  // Jangan log objek galat utuh: galat body-parser memuat body mentah dan pesan Prisma memuat
  // argumen query, keduanya bisa berisi PII (AGENTS aturan 10). Nama, kode, dan jejak saja.
  console.error(err?.name, err?.code ?? '', err?.stack?.split('\n').slice(1).join('\n') ?? '');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Terjadi kesalahan pada server.' } });
}

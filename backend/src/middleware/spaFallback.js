import path from 'node:path';

/** index.html untuk GET/HEAD non-/api agar /lacak dan /admin/... bisa dibuka langsung. */
export function spaFallback(distDir) {
  const indexFile = path.join(distDir, 'index.html');
  return (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || req.path.startsWith('/api')) return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(indexFile, (err) => err && next(err));
  };
}

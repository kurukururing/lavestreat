# LAVE STREAT

Aplikasi web **prototype** untuk UMKM jasa cuci sepatu (tim capstone A26-CS119, Asah 2026). Semua data adalah **data dummy**; hasilnya bukan klaim dampak bisnis nyata.

Dokumen: `docs/` (mulai dari `AGENTS.md`, lalu `docs/PRD.md`).

## Prasyarat

- Node.js 24 (lihat `.nvmrc`, minimum 22.22)
- Python 3.13 (lihat `ai-service/.python-version`)

## Mulai

```bash
npm install
cp .env.example backend/.env          # isi nilainya
npm run dev -w backend                # Express, port 3000
npm run dev -w frontend               # Vite, proxy /api ke Express

cd ai-service
python -m venv .venv
.venv/Scripts/pip install -r requirements-dev.txt   # Linux/macOS: .venv/bin/pip
uvicorn app.main:app --reload
```

Perintah lain (lint, tes, migrasi, seed, skrip admin) ada di `AGENTS.md` Bagian 8.

## Produksi (Render)

- Service 1 (Express + front-end). Build: `npm ci --include=dev && npm run build -w frontend && npm run db:generate -w backend`. Start: `npm run db:deploy -w backend && node backend/src/server.js`.
- Service 2 (FastAPI, root `ai-service`). Build: `pip install -r requirements.txt`. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

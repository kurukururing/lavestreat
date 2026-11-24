import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    // Satu origin juga saat dev: /api diteruskan ke Express, bukan CORS (AGENTS 6.3).
    server: {
      proxy: { '/api': env.VITE_DEV_API_TARGET || 'http://localhost:3000' },
    },
    // Tanpa ini rolldown memecah modul bersama (tiap ikon lucide, util kecil) menjadi ±30 berkas
    // yang harus diunduh sebelum render pertama. Modul yang dipakai ≥ 2 potongan digabung ke
    // `vendor` dan `shared`; modul milik satu halaman saja (mis. Recharts di dasbor) tetap lazy.
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'vendor', test: /node_modules/, minShareCount: 2 },
              { name: 'shared', test: /[\/]src[\/]/, minShareCount: 2 },
            ],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.js'],
      include: ['tests/**/*.test.{js,jsx}'],
    },
  };
});

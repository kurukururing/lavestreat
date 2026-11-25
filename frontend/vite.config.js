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
    // yang harus diunduh sebelum render pertama. `react`, `icons`, dan `core` (layout publik, util,
    // UI dasar) dimuat di awal; modul milik satu halaman saja (mis. Recharts di dasbor) tetap lazy.
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
                priority: 2,
              },
              { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/, priority: 2 },
              {
                name: 'core',
                // Hanya layout publik: layout admin ikut potongan AdminShell (lazy).
                test: /src[\\/]lib[\\/]|src[\\/]components[\\/]layout[\\/]Public|src[\\/]app[\\/]PageLoader|src[\\/]components[\\/]ui[\\/](button|alert|skeleton|logo|lazy-image|section-heading|sticky-action-bar|input)\.jsx|node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/,
                priority: 1,
              },
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

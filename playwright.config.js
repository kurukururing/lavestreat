import { defineConfig } from '@playwright/test';

// Dua viewport wajib (AGENTS 5): 360 px dan 1280 px.
// Uji berjalan terhadap Express yang menyajikan frontend/dist (satu origin, sama seperti produksi).
export default defineConfig({
  testDir: './frontend/tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'mobile-360', use: { viewport: { width: 360, height: 780 } } },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm run build -w frontend && node backend/src/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});

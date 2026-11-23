import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../src/mocks/server.js';
import { resetMockDb } from '../src/mocks/handlers.js';

// Tes komponen memakai handler mock yang sama dengan mode dev (ARCHITECTURE Bagian 13).
beforeAll(() => server.listen());
afterEach(() => {
  // Vitest tanpa globals: Testing Library tidak membersihkan DOM otomatis.
  cleanup();
  server.resetHandlers();
  resetMockDb();
});
afterAll(() => server.close());

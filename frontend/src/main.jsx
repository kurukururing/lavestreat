import { startTransition, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Mock API hanya pada `vite --mode mock`. Import dinamis agar MSW tidak ikut build produksi.
async function enableMocks() {
  if (import.meta.env.MODE !== 'mock') return;
  const { worker } = await import('./mocks/browser.js');
  await worker.start();
}

// Render awal di dalam transition: React memecahnya menjadi potongan kecil (time slicing) sehingga
// halaman tetap responsif di ponsel lambat (TBT). App shell di index.html tampil sampai selesai.
enableMocks().then(() => {
  const root = createRoot(document.getElementById('root'));
  startTransition(() =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
});

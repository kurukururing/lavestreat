import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Mock API hanya pada `vite --mode mock`. Import dinamis agar MSW tidak ikut build produksi.
async function enableMocks() {
  if (import.meta.env.MODE !== 'mock') return;
  const { worker } = await import('./mocks/browser.js');
  await worker.start();
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

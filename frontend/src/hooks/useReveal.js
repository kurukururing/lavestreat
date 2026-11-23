import { useEffect } from 'react';

const SELECTOR = '[data-reveal]:not([data-revealed])';

/**
 * Animasi muncul saat digulir (DESIGN Bagian 8). Elemen `[data-reveal]` di dalam `ref` diberi
 * `data-revealed` saat ≥ 15 % terlihat. CSS hanya menyembunyikan elemen bila `html[data-reveal-ready]`,
 * jadi tanpa IntersectionObserver atau dengan reduce motion konten langsung tampil.
 * MutationObserver menangkap elemen yang muncul belakangan (halaman lazy, katalog dari API).
 * @param {React.RefObject<HTMLElement>} ref
 */
export function useReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const show = (el) => el.setAttribute('data-revealed', '');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canObserve = typeof window.IntersectionObserver === 'function' && !reduced;

    let io;
    if (canObserve) {
      document.documentElement.dataset.revealReady = '';
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            show(e.target);
            io.unobserve(e.target);
          }
        },
        { threshold: 0.15 },
      );
    }
    const handle = (el) => (io ? io.observe(el) : show(el));
    const scan = () => root.querySelectorAll(SELECTOR).forEach(handle);

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io?.disconnect();
      delete document.documentElement.dataset.revealReady;
    };
  }, [ref]);
}

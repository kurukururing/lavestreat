import { useEffect } from 'react';

const SELECTOR = '[data-reveal]:not([data-revealed])';

/**
 * Animasi muncul saat digulir (DESIGN Bagian 8). Elemen `[data-reveal]` di dalam `ref` diamati
 * IntersectionObserver: yang dilaporkan di luar layar diberi `data-reveal-hidden` (disembunyikan
 * CSS), lalu `data-revealed` saat ≥ 15 % terlihat. Elemen yang sudah di layar tidak pernah
 * disembunyikan, jadi tidak berkedip. Posisi dibaca dari observer (asinkron), bukan
 * `getBoundingClientRect`, agar tidak memaksa layout seluruh halaman saat render (TBT ponsel).
 * Tanpa IntersectionObserver atau dengan reduce motion konten langsung tampil.
 * MutationObserver menangkap elemen yang muncul belakangan (halaman lazy, katalog dari API).
 * @param {React.RefObject<HTMLElement>} ref
 */
export function useReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const show = (el) => {
      el.removeAttribute('data-reveal-hidden');
      el.setAttribute('data-revealed', '');
    };
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canObserve = typeof window.IntersectionObserver === 'function' && !reduced;

    const io =
      canObserve &&
      new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              show(e.target);
              io.unobserve(e.target);
            } else {
              e.target.setAttribute('data-reveal-hidden', '');
            }
          }
        },
        { threshold: 0.15 },
      );
    const scan = () =>
      root.querySelectorAll(SELECTOR).forEach((el) => (io ? io.observe(el) : show(el)));
    // Fokus keyboard (Tab) ke kartu yang belum tampil tidak boleh mendarat di elemen tak terlihat.
    const onFocus = (e) => {
      const el = e.target.closest?.('[data-reveal]');
      if (el) show(el);
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    root.addEventListener('focusin', onFocus);

    return () => {
      mo.disconnect();
      root.removeEventListener('focusin', onFocus);
      if (io) io.disconnect();
    };
  }, [ref]);
}

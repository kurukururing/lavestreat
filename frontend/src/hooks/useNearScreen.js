import { useEffect, useState } from 'react';

/**
 * `true` setelah elemen `ref` berada ≤ `margin` dari layar (sekali saja, tidak kembali `false`).
 * Untuk menunda gambar dan grafik di bawah layar agar tidak berebut bandwidth/CPU dengan isi
 * pertama. Tanpa IntersectionObserver (tes, browser lama) langsung `true`.
 * @param {React.RefObject<Element>} ref
 * @param {{ margin?: string, skip?: boolean }} [options] `skip`: langsung `true` (mis. gambar LCP)
 */
export function useNearScreen(ref, { margin = '300px', skip = false } = {}) {
  const [near, setNear] = useState(() => skip || typeof IntersectionObserver !== 'function');

  useEffect(() => {
    if (near || !ref.current) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: margin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near, ref, margin]);

  return near;
}

import { useCallback, useRef, useState } from 'react';

import { useNearScreen } from '@/hooks/useNearScreen';
import { cn } from '@/lib/utils';

/**
 * Gambar yang dimuat saat mendekati layar, dengan skeleton berdenyut selama memuat lalu memudar
 * masuk. Gambar yang sudah ada di cache langsung tampil tanpa animasi.
 * `src` baru dipasang saat ≤ 300 px dari layar: ambang lazy bawaan Chrome (±1250–2500 px) membuat
 * gambar jauh di bawah ikut berebut bandwidth dengan JS halaman pertama.
 * Gambar hero/LCP: kirim `loading="eager"` agar langsung diminta tanpa menunggu observer.
 * @param {React.ImgHTMLAttributes<HTMLImageElement>} props
 */
function LazyImage({ className, src, loading = 'lazy', onLoad, onError, ...props }) {
  // 'loading' → skeleton, 'fading' → baru selesai dimuat, 'done' → dari cache atau gagal.
  const [state, setState] = useState('loading');
  const node = useRef(null);
  const near = useNearScreen(node, { skip: loading === 'eager' });

  const ref = useCallback((el) => {
    node.current = el;
    if (el?.complete && el.naturalWidth) setState('done');
  }, []);

  return (
    <img
      ref={ref}
      src={near ? src : undefined}
      loading={loading}
      decoding="async"
      data-state={state}
      onLoad={(e) => {
        setState((s) => (s === 'loading' ? 'fading' : s));
        onLoad?.(e);
      }}
      onError={(e) => {
        setState('done'); // tampilkan teks alt, bukan skeleton selamanya
        onError?.(e);
      }}
      className={cn(
        state === 'loading' && 'animate-pulse bg-brand-200/60',
        state === 'fading' && 'animate-img-in',
        className,
      )}
      {...props}
    />
  );
}

export { LazyImage };

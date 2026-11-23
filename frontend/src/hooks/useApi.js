import { useCallback, useEffect, useState } from 'react';

/**
 * Muat data dari API dengan status proses/berhasil/gagal (NFR-06).
 * `fetcher` dipanggil ulang saat `deps` (nilai primitif) berubah atau `reload()` dipanggil.
 * `loading` diturunkan dari kunci permintaan, jadi data lama tetap tampil selama memuat ulang
 * (mis. pindah halaman) dan respons yang terlambat tidak menimpa data terbaru.
 * @template T
 * @param {() => Promise<T>} fetcher
 * @param {unknown[]} deps
 */
export function useApi(fetcher, deps) {
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([...deps, tick]);
  const [state, setState] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    let active = true;
    fetcher().then(
      (data) => active && setState({ key, data, error: null }),
      (error) => active && setState((s) => ({ key, data: s.data, error })),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` mewakili `deps`
  }, [key]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback(
    (updater) =>
      setState((s) => ({
        ...s,
        data: typeof updater === 'function' ? updater(s.data) : updater,
      })),
    [],
  );
  const loading = state.key !== key;
  return { data: state.data, error: loading ? null : state.error, loading, reload, setData };
}

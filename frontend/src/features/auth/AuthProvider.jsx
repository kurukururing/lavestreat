import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import * as adminApi from '@/api/admin';
import { AUTH_EXPIRED_EVENT } from '@/api/client';
import { AuthContext } from '@/features/auth/auth-context';

/** Memeriksa sesi lewat ADM-03 sekali saat dimuat, lalu menyimpan status login. */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let active = true;
    adminApi.getMe().then(
      // Transition: kerangka admin dirender bertahap, bukan satu tugas panjang (TBT).
      (user) => active && startTransition(() => setState({ status: 'authed', user })),
      () => active && startTransition(() => setState({ status: 'guest', user: null })),
    );
    function onExpired() {
      setState((s) => {
        if (s.status === 'authed') toast.error('Sesi berakhir. Silakan masuk kembali.');
        return { status: 'guest', user: null };
      });
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => {
      active = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const login = useCallback(async (body) => {
    const user = await adminApi.login(body);
    setState({ status: 'authed', user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      // Sesi di klien tetap dihapus walau permintaan gagal, agar pemilik tidak terjebak.
      setState({ status: 'guest', user: null });
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

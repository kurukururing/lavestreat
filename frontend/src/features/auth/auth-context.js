import { createContext, useContext } from 'react';

/**
 * @typedef {{ status: 'loading'|'authed'|'guest', user: { username: string } | null,
 *   login: (body: { username: string, password: string }) => Promise<void>,
 *   logout: () => Promise<void> }} AuthValue
 */
export const AuthContext = createContext(/** @type {AuthValue|null} */ (null));

/** Sesi pemilik (AC-02.1). Dipakai di dalam `AuthProvider`. */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return value;
}

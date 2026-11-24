import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gabungkan kelas Tailwind tanpa bentrok (dipakai komponen shadcn/ui). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * UUID v4. `crypto.randomUUID` hanya ada di HTTPS atau localhost; saat tim menguji lewat IP
 * jaringan lokal (http://192.168…) fungsi itu tidak ada, jadi pakai `getRandomValues`.
 * @returns {string}
 */
export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

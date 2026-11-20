import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gabungkan kelas Tailwind tanpa bentrok (dipakai komponen shadcn/ui). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

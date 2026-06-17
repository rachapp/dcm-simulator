import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility: merge Tailwind class names with clsx + tailwind-merge.
 * Centralised here so no file duplicates it.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

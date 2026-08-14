import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatRs = (rs: number) =>
  rs >= 1e7 ? `₹${(rs / 1e7).toFixed(2)} Cr` : `₹${(rs / 1e5).toFixed(1)} L`;

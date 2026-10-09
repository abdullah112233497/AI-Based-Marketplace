import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'PKR 0';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount).replace('PKR', 'Rs.');
}

export function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

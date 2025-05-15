import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string or Date object into a human-readable format
 * @param date Date string or Date object
 * @param options Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string {
  if (!date) return 'No date provided';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  
  return d.toLocaleDateString('en-US', options);
}

/**
 * Date utility functions for statistics and reporting
 */

/**
 * Returns the start and end dates for the current month
 */
export function getMonthRange() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Returns the start and end dates for the previous month
 */
export function getPreviousMonthRange() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Returns the start and end dates for a specific month
 */
export function getSpecificMonthRange(year: number, month: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Returns the start and end dates for a date range
 */
export function getDateRange(startDate: Date, endDate: Date) {
  // Ensure start date is at the beginning of the day
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  // Ensure end date is at the end of the day
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return { startDate: start, endDate: end };
}

/**
 * Returns the start and end dates for the last N days
 */
export function getLastNDaysRange(days: number) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(today.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate: today };
}

/**
 * Returns an array of month names
 */
export function getMonthNames(short: boolean = false) {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return date.toLocaleString('default', { month: short ? 'short' : 'long' });
  });
}

/**
 * Format a date to a string (YYYY-MM-DD)
 */
export function formatDateToString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date to a localized string
 */
export function formatDateLocalized(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return date.toLocaleDateString(undefined, options);
} 
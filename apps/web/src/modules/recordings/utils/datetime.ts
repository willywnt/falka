import { format, isValid, parseISO } from 'date-fns';

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(value);
}

/** e.g. 27 May 2026, 19:42:05 */
export function formatOperationalDateTime(value: string | Date): string {
  return format(toDate(value), 'd MMM yyyy, HH:mm:ss');
}

/** e.g. 27 May 2026, 19:42:05 */
export function formatTimelineDateTime(value: string | Date): string {
  return format(toDate(value), 'd MMM yyyy, HH:mm:ss');
}

/** e.g. 27 May 2026 */
export function formatOperationalDateShort(value: string | Date): string {
  return format(toDate(value), 'd MMM yyyy');
}

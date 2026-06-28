/** Round to 2 decimals (rupiah cents) without float drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** The current and previous "YYYY-MM" months for an instant (UTC). Used by the monthly auto-gen. */
export function currentAndPreviousMonth(now: Date): { current: string; previous: string } {
  const fmt = (year: number, monthIndex: number): string =>
    `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth(); // 0..11
  const prev = new Date(Date.UTC(year, monthIndex - 1, 1));
  return {
    current: fmt(year, monthIndex),
    previous: fmt(prev.getUTCFullYear(), prev.getUTCMonth()),
  };
}

/** UTC bounds + parts for a "YYYY-MM" month (inclusive whole-day `to`). */
export function monthBounds(month: string): {
  year: number;
  monthNumber: number;
  from: Date;
  to: Date;
} {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7)); // 1..12
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    year,
    monthNumber,
    from: new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0)),
    to: new Date(Date.UTC(year, monthNumber - 1, lastDay, 23, 59, 59, 999)),
  };
}

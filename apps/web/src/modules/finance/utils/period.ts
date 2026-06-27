/** Round to 2 decimals (rupiah cents) without float drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

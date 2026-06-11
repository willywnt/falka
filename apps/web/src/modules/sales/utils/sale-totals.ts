/**
 * Discount + PPN math for a counter sale — pure and shared by the POS (live
 * summary) and the server service (authoritative persistence), so both always
 * agree to the rupiah.
 *
 * Semantics:
 * - discount applies to the gross subtotal, clamped to [0, subtotal];
 * - tax EXCLUSIVE: total = (subtotal − discount) + tax, tax = base × r/100;
 * - tax INCLUSIVE: prices already contain PPN — total = base and
 *   tax = base × r/(100 + r) is just carved out for reporting.
 * Net revenue (omzet) is therefore `totalAmount − taxAmount` in BOTH modes.
 */

export type SaleDiscount = { type: 'PERCENT' | 'AMOUNT'; value: number };

export type SaleTotals = {
  subtotal: number;
  discountAmount: number;
  /** Subtotal after discount — the base the tax applies to. */
  taxableBase: number;
  taxAmount: number;
  totalAmount: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeSaleTotals(
  subtotal: number,
  discount: SaleDiscount | null,
  taxRate: number,
  taxInclusive: boolean,
): SaleTotals {
  const safeSubtotal = round2(Math.max(0, subtotal));

  const rawDiscount = !discount
    ? 0
    : discount.type === 'PERCENT'
      ? (safeSubtotal * Math.min(100, Math.max(0, discount.value))) / 100
      : discount.value;
  const discountAmount = round2(Math.min(safeSubtotal, Math.max(0, rawDiscount)));

  const taxableBase = round2(safeSubtotal - discountAmount);
  const rate = Math.max(0, taxRate);
  const taxAmount =
    rate <= 0
      ? 0
      : round2(taxInclusive ? (taxableBase * rate) / (100 + rate) : (taxableBase * rate) / 100);
  const totalAmount = taxInclusive ? taxableBase : round2(taxableBase + taxAmount);

  return { subtotal: safeSubtotal, discountAmount, taxableBase, taxAmount, totalAmount };
}

/**
 * Split an amount across lines proportionally to their weights using integer
 * cents + largest remainder, so the parts always sum exactly to the whole
 * (mirrors the bundle price allocation; duplicated here because catalog's
 * util is module-internal — boundary beats dedup).
 */
export function allocateProportionally(amount: number, weights: number[]): number[] {
  const amountMinor = Math.round(amount * 100);
  const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (amountMinor <= 0 || totalWeight <= 0) return weights.map(() => 0);

  const raw = weights.map((weight) => (amountMinor * Math.max(0, weight)) / totalWeight);
  const floors = raw.map((value) => Math.floor(value));
  let remainder = amountMinor - floors.reduce((sum, value) => sum + value, 0);

  // Hand the leftover cents to the largest fractional parts first.
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  for (const entry of order) {
    if (remainder <= 0) break;
    floors[entry.index] = (floors[entry.index] ?? 0) + 1;
    remainder -= 1;
  }

  return floors.map((minor) => minor / 100);
}

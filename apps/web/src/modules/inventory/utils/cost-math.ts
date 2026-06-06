function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Weighted-average (moving-average) unit cost after receiving stock:
 *
 *   newAvg = (onHand · currentCost + receivedQty · receivedCost) / (onHand + receivedQty)
 *
 * Returns the new cost to persist, or `null` when the cost should be left as-is:
 * - a non-positive received cost or quantity carries no usable information;
 * - with no positive on-hand or no known current cost there is nothing to average
 *   against, so the received cost is adopted directly (covers the first-ever receive
 *   and oversold/negative on-hand, where a weighted formula would divide oddly).
 */
export function computeMovingAverageCost(input: {
  onHandQty: number;
  currentCost: number | null;
  receivedQty: number;
  receivedCost: number;
}): number | null {
  const { onHandQty, currentCost, receivedQty, receivedCost } = input;

  if (receivedCost <= 0 || receivedQty <= 0) return null;
  if (onHandQty <= 0 || currentCost == null || currentCost <= 0) return round2(receivedCost);

  const weighted =
    (onHandQty * currentCost + receivedQty * receivedCost) / (onHandQty + receivedQty);
  return round2(weighted);
}

import type {
  InventoryValuationProduct,
  InventoryValuationReport,
  InventoryValuationSummary,
} from '../types';

/** One variant's on-hand position, normalized for valuation. */
export type ValuationVariant = {
  productId: string;
  productName: string;
  category: string | null;
  available: number;
  /** Moving-average cost; null = no cost recorded yet (value excluded). */
  cost: number | null;
};

/** Stock value of a single variant, rounded to whole rupiah (cost-unknown = 0). */
function variantValue(variant: ValuationVariant): number {
  return variant.cost == null ? 0 : variant.cost * variant.available;
}

type ProductAcc = {
  productId: string;
  productName: string;
  category: string | null;
  variantCount: number;
  costUnknownVariants: number;
  availableUnits: number;
  value: number;
};

/**
 * Roll variants up into a stock-valuation report: a grand-total summary plus a
 * per-product breakdown (only products with units on hand, highest value first).
 * Pure — the service feeds it the variant + inventory rows.
 */
export function aggregateInventoryValuation(
  variants: ValuationVariant[],
): InventoryValuationReport {
  let totalValue = 0;
  let valuedVariants = 0;
  let costUnknownVariants = 0;
  let availableUnits = 0;
  const byProduct = new Map<string, ProductAcc>();

  for (const variant of variants) {
    const inStock = variant.available > 0;
    const value = variantValue(variant);

    totalValue += value;
    availableUnits += variant.available;
    if (inStock && variant.cost != null) valuedVariants += 1;
    if (inStock && variant.cost == null) costUnknownVariants += 1;

    const entry = byProduct.get(variant.productId) ?? {
      productId: variant.productId,
      productName: variant.productName,
      category: variant.category,
      variantCount: 0,
      costUnknownVariants: 0,
      availableUnits: 0,
      value: 0,
    };
    entry.variantCount += 1;
    entry.availableUnits += variant.available;
    entry.value += value;
    if (inStock && variant.cost == null) entry.costUnknownVariants += 1;
    byProduct.set(variant.productId, entry);
  }

  const products: InventoryValuationProduct[] = [...byProduct.values()]
    .filter((product) => product.availableUnits > 0)
    .map((product) => ({
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      variantCount: product.variantCount,
      costUnknownVariants: product.costUnknownVariants,
      availableUnits: product.availableUnits,
      stockValue: String(Math.round(product.value)),
    }))
    .sort((a, b) => Number(b.stockValue) - Number(a.stockValue));

  const summary: InventoryValuationSummary = {
    totalStockValue: String(Math.round(totalValue)),
    valuedVariants,
    costUnknownVariants,
    totalVariants: variants.length,
    availableUnits,
  };

  return { summary, byProduct: products };
}

/**
 * Shared variant-label formatting — one home so every module (catalog, inventory,
 * sales, purchasing, labels, QR) shows a variant the same way.
 *
 * A variant is either a standalone SKU (`variantGroup` null) or a subvariant under
 * a named group (siblings share a `variantGroup`, e.g. group "iPhone 16" →
 * subvariant "Hitam"). The leaf is always the SKU; the group is a display label.
 */
export type LabelledVariant = { variantGroup: string | null; name: string };

/** "iPhone 16 · Hitam" for a subvariant, or just "Hitam" for a standalone. */
export function formatVariantLabel(variant: LabelledVariant): string {
  return variant.variantGroup ? `${variant.variantGroup} · ${variant.name}` : variant.name;
}

/** "Kaos Polos - iPhone 16 · Hitam" — product + variant label, for pickers/lines. */
export function formatProductVariantLabel(productName: string, variant: LabelledVariant): string {
  return `${productName} - ${formatVariantLabel(variant)}`;
}

import type { VariantOption } from '../validators/options';

/** A set of variants sharing the same first-dimension option value. */
export type VariantGroup<T> = {
  /** The first option value, e.g. "iPhone 16". Empty string = no first option. */
  value: string;
  variants: T[];
};

/**
 * Group variants by their first option dimension's value, preserving the order
 * each group is first seen. Variants without a first option collect under the
 * trailing empty-key group. Returns `null` when no variant carries any option —
 * the caller renders a plain, ungrouped list (backward compatible).
 */
export function groupVariantsByFirstOption<T extends { options: VariantOption[] }>(
  variants: T[],
): VariantGroup<T>[] | null {
  if (!variants.some((variant) => variant.options.length > 0)) return null;

  const groups = new Map<string, T[]>();
  for (const variant of variants) {
    const key = variant.options[0]?.value ?? '';
    const bucket = groups.get(key);
    if (bucket) bucket.push(variant);
    else groups.set(key, [variant]);
  }

  return [...groups.entries()].map(([value, grouped]) => ({ value, variants: grouped }));
}

/** Option values after the first dimension, joined for a leaf label (e.g. "Hitam · 128GB"). */
export function formatSubOptions(options: VariantOption[]): string {
  return options
    .slice(1)
    .map((option) => option.value)
    .join(' · ');
}

/**
 * Order-independent, case-insensitive signature of an option combination —
 * used to enforce that no two variants of a product share the same options.
 * An empty options array yields an empty signature (uniqueness is not enforced).
 */
export function optionsSignature(options: VariantOption[]): string {
  return options
    .map((option) => `${option.name.trim().toLowerCase()}=${option.value.trim().toLowerCase()}`)
    .sort()
    .join('|');
}

/**
 * Validate a variant's options against the product's declared dimensions.
 * Returns the first problem as a message, or `null` when the options are valid.
 * Empty options are always valid (a plain variant under an options product).
 */
export function findOptionError(optionTypes: string[], options: VariantOption[]): string | null {
  if (options.length === 0) return null;

  const allowed = new Set(optionTypes);
  const seen = new Set<string>();
  for (const option of options) {
    if (!allowed.has(option.name)) {
      const declared = optionTypes.join(', ') || 'none';
      return `Unknown option "${option.name}". This product's options are: ${declared}.`;
    }
    if (seen.has(option.name)) return `Duplicate option "${option.name}".`;
    seen.add(option.name);
  }
  return null;
}

function slugifyPart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Suggest a SKU from the product name + option values, e.g. "IPHONE-16-HITAM". */
export function suggestVariantSku(productName: string, values: string[]): string {
  return [productName, ...values].map(slugifyPart).filter(Boolean).join('-');
}

/** Suggest a variant name from its option values, e.g. "16 / Hitam". */
export function suggestVariantName(values: string[]): string {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' / ');
}

export type BundleComponentStock = { quantity: number; availableStock: number };

/**
 * How many whole bundles can be built from current component stock: the minimum
 * of floor(component.availableStock / per-bundle quantity) across all components.
 * No components — or any component short — yields 0; never negative (an oversold
 * component clamps to 0). Components with a non-positive per-bundle qty are ignored.
 */
export function computeBuildableQty(components: BundleComponentStock[]): number {
  if (components.length === 0) return 0;

  let buildable = Infinity;
  for (const component of components) {
    if (component.quantity <= 0) continue;
    buildable = Math.min(buildable, Math.floor(component.availableStock / component.quantity));
  }

  return Number.isFinite(buildable) ? Math.max(0, buildable) : 0;
}

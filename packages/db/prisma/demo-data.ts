/**
 * Shared demo fixtures for the inventory/order lifecycle, used by both the seed
 * and the `db:reset-demo` script so they stay in lockstep. Each `index` mirrors the
 * stub import/order adapters' external ids (`${shopId}-P{index}`/`-V{index}`) and SKU.
 */
export const DEMO_USER_EMAIL = 'demo@falka.local';
/** A STAFF member of the demo org, so RBAC is testable out of the box. */
export const DEMO_STAFF_EMAIL = 'staff@falka.local';
export const DEMO_SHOP_ID = 'seed-shop-001';

export const DEMO_VARIANTS = [
  { index: 1, productName: 'Cotton Tee', variantName: 'Black / S', sku: 'BLACK-S', stock: 50 },
  { index: 2, productName: 'Cotton Tee', variantName: 'Black / M', sku: 'BLACK-M', stock: 50 },
  { index: 3, productName: 'Cotton Tee', variantName: 'White / M', sku: 'WHITE-M', stock: 50 },
  { index: 4, productName: 'Canvas Tote', variantName: 'Natural', sku: 'NATURAL', stock: 50 },
] as const;

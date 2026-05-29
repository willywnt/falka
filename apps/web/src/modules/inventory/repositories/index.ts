export { ProductRepository, productRepository } from './product.repository';

export { ProductVariantRepository, productVariantRepository } from './product-variant.repository';

export { InventoryRepository, inventoryRepository } from './inventory.repository';

export {
  InventoryEventRepository,
  inventoryEventRepository,
  type InventoryEventTimelineQuery,
} from './inventory-event.repository';

export type { Product, ProductVariant, Inventory } from '@prisma/client';

export {
  InventoryQueryRepository,
  inventoryQueryRepository,
  type RecentMutationRow,
} from './inventory-query.repository';

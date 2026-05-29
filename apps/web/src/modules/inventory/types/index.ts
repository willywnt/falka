export type {
  ProductListItemDto,
  ProductDetailDto,
  ProductVariantListItemDto,
  ProductVariantDetailDto,
  InventoryDetailDto,
  InventoryListItemDto,
  InventoryEventListItemDto,
  StockMutationResultDto,
  InventoryHistoryResultDto,
  InventoryOverviewDto,
  RecentMutationListItemDto,
  PaginationMetaDto,
} from '../dto/inventory.dto';
export const INVENTORY_EVENT_TYPE_LABELS = {
  INCREASE: 'Increase',
  DECREASE: 'Decrease',
  ADJUSTMENT: 'Adjustment',
  RESERVE: 'Reserve',
  RELEASE: 'Release',
  SYNC: 'Sync',
} as const;

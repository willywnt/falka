'use client';

import { Package, Plus } from 'lucide-react';

import { useInventoryFilters } from '../hooks/use-inventory-filters';
import {
  useInventoryListQuery,
  useProductsPaginatedQuery,
  useVariantsPaginatedQuery,
} from '../hooks/use-inventory';
import { useInventoryUiStore } from '../store/inventory-ui.store';
import { BulkSelectionBar } from './bulk-selection-bar';
import { CreateProductModal } from './create-product-modal';
import { CreateVariantModal } from './create-variant-modal';
import { InventoryFiltersBar } from './inventory-filters-bar';
import { InventoryOverviewPanel } from './inventory-overview-panel';
import { InventoryPagination } from './inventory-pagination';
import { InventoryTable } from './inventory-table';
import { InventoryTimelinePanel } from './inventory-timeline-panel';
import { ProductsManagementTable } from './products-management-table';
import { StockMutationModal } from './stock-mutation-modal';
import { VariantsManagementTable } from './variants-management-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function InventoryDashboard() {
  const {
    filters,
    patchFilters,
    searchInput,
    setSearchInput,
    productsQuery: productsListQuery,
    variantsQuery: variantsListQuery,
  } = useInventoryFilters();

  const createProductOpen = useInventoryUiStore((s) => s.createProductOpen);
  const createVariantOpen = useInventoryUiStore((s) => s.createVariantOpen);
  const setCreateProductOpen = useInventoryUiStore((s) => s.setCreateProductOpen);
  const setCreateVariantOpen = useInventoryUiStore((s) => s.setCreateVariantOpen);
  const mutationTarget = useInventoryUiStore((s) => s.mutationTarget);
  const mutationTab = useInventoryUiStore((s) => s.mutationTab);
  const closeMutation = useInventoryUiStore((s) => s.closeMutation);
  const selectedVariantIds = useInventoryUiStore((s) => s.selectedVariantIds);
  const toggleVariantSelection = useInventoryUiStore((s) => s.toggleVariantSelection);
  const selectAllVariants = useInventoryUiStore((s) => s.selectAllVariants);

  const productsQuery = useProductsPaginatedQuery(productsListQuery);
  const variantsQuery = useVariantsPaginatedQuery(variantsListQuery);
  const inventoryQuery = useInventoryListQuery();
  const modalProductsQuery = useProductsPaginatedQuery({
    page: 1,
    pageSize: 100,
    active: 'ALL',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const variantOptions =
    variantsQuery.data?.items.map((v) => ({ id: v.id, sku: v.sku, name: v.name })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            Operational inventory — internal stock management and audit trail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCreateProductOpen(true)}>
            <Package className="size-4" />
            New product
          </Button>
          <Button
            onClick={() => setCreateVariantOpen(true)}
            disabled={(modalProductsQuery.data?.items.length ?? 0) === 0}
          >
            <Plus className="size-4" />
            New variant
          </Button>
        </div>
      </div>

      <Tabs
        value={filters.tab}
        onValueChange={(tab) => patchFilters({ tab: tab as typeof filters.tab, page: 1 })}
      >
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <InventoryOverviewPanel
            onViewLowStock={() =>
              patchFilters({ tab: 'variants', stockStatus: 'LOW_STOCK', page: 1 })
            }
            onViewTimeline={() => patchFilters({ tab: 'timeline', page: 1 })}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          <InventoryFiltersBar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            filters={filters}
            onPatch={patchFilters}
          />
          {productsQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : productsQuery.error ? (
            <ErrorBanner message="Failed to load products." error={productsQuery.error} />
          ) : (
            <>
              <ProductsManagementTable products={productsQuery.data?.items ?? []} />
              {productsQuery.data?.meta ? (
                <InventoryPagination
                  meta={productsQuery.data.meta}
                  onPageChange={(page) => patchFilters({ page })}
                />
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="variants" className="mt-4 space-y-4">
          <InventoryFiltersBar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            filters={filters}
            onPatch={patchFilters}
            showStockFilter
          />
          <BulkSelectionBar />
          {variantsQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : variantsQuery.error ? (
            <ErrorBanner message="Failed to load variants." error={variantsQuery.error} />
          ) : (
            <>
              <VariantsManagementTable
                variants={variantsQuery.data?.items ?? []}
                selectedIds={selectedVariantIds}
                onToggleSelect={toggleVariantSelection}
                onSelectAll={selectAllVariants}
              />
              {variantsQuery.data?.meta ? (
                <InventoryPagination
                  meta={variantsQuery.data.meta}
                  onPageChange={(page) => patchFilters({ page })}
                />
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          <InventoryFiltersBar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            filters={filters}
            onPatch={patchFilters}
            showStockFilter
          />
          {inventoryQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : inventoryQuery.error ? (
            <ErrorBanner message="Failed to load inventory." error={inventoryQuery.error} />
          ) : (inventoryQuery.data?.length ?? 0) === 0 ? (
            <EmptyBanner
              title="No inventory yet"
              description="Create a product and variant to start tracking stock."
            />
          ) : (
            <InventoryTable
              items={inventoryQuery.data ?? []}
              onMutate={(item) => useInventoryUiStore.getState().openMutation(item)}
              onViewHistory={(item) =>
                patchFilters({ tab: 'timeline', variantId: item.variantId, page: 1 })
              }
            />
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <InventoryTimelinePanel
            variantId={filters.variantId ?? null}
            filters={filters}
            onPatch={patchFilters}
            variants={variantOptions}
          />
        </TabsContent>
      </Tabs>

      <CreateProductModal open={createProductOpen} onOpenChange={setCreateProductOpen} />
      <CreateVariantModal
        open={createVariantOpen}
        onOpenChange={setCreateVariantOpen}
        products={modalProductsQuery.data?.items ?? []}
      />
      <StockMutationModal
        item={mutationTarget}
        open={Boolean(mutationTarget)}
        defaultTab={mutationTab}
        onOpenChange={(open) => {
          if (!open) closeMutation();
        }}
      />
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function ErrorBanner({ message, error }: { message: string; error: unknown }) {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
      {message} {error instanceof Error ? error.message : 'Please try again.'}
    </div>
  );
}

function EmptyBanner({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

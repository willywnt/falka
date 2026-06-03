'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DownloadCloud, Link2, Link2Off } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useMarketplaceConnectionQuery } from '../hooks/use-marketplace-connections';
import {
  useImportListingsMutation,
  useMapListingMutation,
  useMarketplaceListingsQuery,
  useUnmapListingMutation,
} from '../hooks/use-marketplace-listings';
import { MapListingDialog } from './map-listing-dialog';
import { MarketplaceProviderBadge } from './marketplace-provider-badge';

export function MarketplaceConnectionDetail({ connectionId }: { connectionId: string }) {
  const [mapTarget, setMapTarget] = useState<string | null>(null);

  const connectionQuery = useMarketplaceConnectionQuery(connectionId);
  const listingsQuery = useMarketplaceListingsQuery(connectionId);
  const importMutation = useImportListingsMutation(connectionId);
  const mapMutation = useMapListingMutation(connectionId);
  const unmapMutation = useUnmapListingMutation(connectionId);

  async function handleImport() {
    try {
      const result = await importMutation.mutateAsync();
      toast.success('Import complete', {
        description: `${result.imported} listings imported, ${result.autoMapped} auto-mapped.`,
      });
    } catch (error) {
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function handleMap(marketplaceProductId: string, variantId: string) {
    try {
      await mapMutation.mutateAsync({ marketplaceProductId, variantId });
      toast.success('Listing mapped');
      setMapTarget(null);
    } catch (error) {
      toast.error('Mapping failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async function handleUnmap(marketplaceProductId: string) {
    try {
      await unmapMutation.mutateAsync(marketplaceProductId);
      toast.success('Listing unmapped');
    } catch (error) {
      toast.error('Unmap failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const connection = connectionQuery.data;
  const listings = listingsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/marketplace">
          <ArrowLeft className="size-4" />
          Back to channels
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {connection ? (
            <>
              <div className="flex items-center gap-3">
                <MarketplaceProviderBadge provider={connection.provider} />
                <h2 className="text-xl font-semibold tracking-tight">{connection.shopName}</h2>
              </div>
              <p className="text-muted-foreground text-sm">Shop ID: {connection.shopId}</p>
            </>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
        </div>
        <Button onClick={() => void handleImport()} disabled={importMutation.isPending}>
          <DownloadCloud className="size-4" />
          {importMutation.isPending ? 'Importing...' : 'Import listings'}
        </Button>
      </div>

      {listingsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">No listings imported yet</p>
          <p className="text-muted-foreground text-sm">
            Import this store&apos;s listings, then map each to an internal variant.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Mapped to</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.marketplaceProductId}>
                  <TableCell>
                    <div className="font-medium">{listing.externalProductName}</div>
                    <div className="text-muted-foreground text-xs">
                      {listing.externalVariantName ?? '—'}
                      {listing.externalSku ? ` · ${listing.externalSku}` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{listing.stock}</TableCell>
                  <TableCell>
                    {listing.mapping ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{listing.mapping.variantSku}</Badge>
                        {listing.mapping.autoMapped ? (
                          <span className="text-muted-foreground text-xs">auto</span>
                        ) : null}
                      </div>
                    ) : (
                      <Badge variant="outline">Unmapped</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {listing.mapping ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={unmapMutation.isPending}
                        onClick={() => void handleUnmap(listing.marketplaceProductId)}
                      >
                        <Link2Off className="size-4" />
                        Unmap
                      </Button>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {listing.suggestedVariant ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mapMutation.isPending}
                            onClick={() => {
                              if (listing.suggestedVariant) {
                                void handleMap(
                                  listing.marketplaceProductId,
                                  listing.suggestedVariant.id,
                                );
                              }
                            }}
                          >
                            <Link2 className="size-4" />
                            Map to {listing.suggestedVariant.sku}
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMapTarget(listing.marketplaceProductId)}
                        >
                          Choose…
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {mapTarget ? (
        <MapListingDialog
          open={Boolean(mapTarget)}
          onOpenChange={(open) => {
            if (!open) setMapTarget(null);
          }}
          isMapping={mapMutation.isPending}
          onSelect={(variantId) => void handleMap(mapTarget, variantId)}
        />
      ) : null}
    </div>
  );
}

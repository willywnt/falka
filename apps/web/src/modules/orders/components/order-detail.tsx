'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Link2, Undo2, Video } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState } from '@/components/error-state';
import { ImageThumb } from '@/components/image-thumb';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

import { VariantPickerDialog } from '@/components/variant-picker-dialog';
import { ShareEvidenceControl } from '@/modules/recordings/components/share-evidence-control';
import { useRecordingsByResiQuery } from '@/modules/recordings/hooks/use-recordings-management';
import { useCreateReturnMutation } from '@/modules/returns/hooks/use-returns';

import { useOrderQuery, useResolveOrderItemMutation } from '../hooks/use-orders';
import type { OrderItemDetail } from '../types';
import { OrderActionsMenu } from './order-actions-menu';
import { OrderStatusBadge } from './order-status-badge';

/** One label/value line in the "Pesanan" card — renders nothing when the value is absent. */
function OrderMetaLine({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useOrderQuery(orderId);
  const resolveMutation = useResolveOrderItemMutation(orderId);
  const createReturnMutation = useCreateReturnMutation();
  const {
    data: packingVideos,
    isLoading: isPackingVideosLoading,
    error: packingVideosError,
    refetch: refetchPackingVideos,
  } = useRecordingsByResiQuery(data?.trackingNumber ?? null);
  const [mapTarget, setMapTarget] = useState<{ id: string; label: string } | null>(null);

  async function handleCreateReturn() {
    try {
      const created = await createReturnMutation.mutateAsync({ orderId });
      toast.success('Retur dibuka', {
        description: 'Proses returnya untuk restok atau tandai sebagai stok rusak.',
      });
      router.push(`/dashboard/returns/${created.id}`);
    } catch (err) {
      toast.error('Gagal membuka retur', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    }
  }

  async function handleResolve(variantId: string) {
    if (!mapTarget) return;
    try {
      await resolveMutation.mutateAsync({ orderItemId: mapTarget.id, variantId });
      toast.success('Item dikaitkan', {
        description: 'Stok ikut diperbarui kalau pesanan sudah dibayar.',
      });
      setMapTarget(null);
    } catch (error) {
      toast.error('Gagal mengaitkan item', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  function openMapDialog(item: OrderItemDetail) {
    setMapTarget({
      id: item.id,
      label: `${item.externalName}${item.externalSku ? ` · ${item.externalSku}` : ''}`,
    });
  }

  /** Item photo + name (links to the listing) + external SKU — shared by row and card. */
  function renderItemName(item: OrderItemDetail) {
    return (
      <div className="flex min-w-0 items-start gap-3">
        {item.externalImageUrl ? (
          <ImageThumb src={item.externalImageUrl} alt={item.externalName} />
        ) : null}
        <div className="min-w-0">
          {item.externalDetailUrl ? (
            <a
              href={item.externalDetailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium break-words hover:underline"
            >
              {item.externalName}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <div className="font-medium break-words">{item.externalName}</div>
          )}
          {item.externalSku ? (
            <div className="num text-muted-foreground text-xs">{item.externalSku}</div>
          ) : null}
        </div>
      </div>
    );
  }

  /** Mapping state (variant chip OR warn badge + Kaitkan) — shared so table and card can't drift. */
  function renderItemMapping(item: OrderItemDetail, fullWidthAction: boolean) {
    if (item.variant) {
      return (
        <div className="flex items-center gap-3">
          <ImageThumb src={item.variant.imageUrl} alt={item.variant.name} />
          <div className="min-w-0">
            <Badge variant="secondary" className="num">
              {item.variant.sku}
            </Badge>
            <div className="text-muted-foreground text-xs">
              {item.variant.productName} / {item.variant.name}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={fullWidthAction ? 'space-y-2' : 'flex items-center gap-2'}>
        <StatusBadge tone="warn">Belum dikaitkan</StatusBadge>
        <Button
          variant="outline"
          size={fullWidthAction ? 'default' : 'sm'}
          className={fullWidthAction ? 'w-full' : undefined}
          onClick={() => openMapDialog(item)}
        >
          <Link2 className="size-4" />
          Kaitkan
        </Button>
      </div>
    );
  }

  /** Line total (qty × unit price); '—' when the channel didn't send a price. */
  function formatLineTotal(item: OrderItemDetail) {
    return item.unitPrice ? formatCurrency(Number(item.unitPrice) * item.quantity) : '—';
  }

  function renderItemRow(item: OrderItemDetail) {
    return (
      <TableRow key={item.id}>
        <TableCell>{renderItemName(item)}</TableCell>
        <TableCell className="num text-right">{item.quantity}</TableCell>
        <TableCell className="num text-right">
          {item.unitPrice ? formatCurrency(item.unitPrice) : '—'}
        </TableCell>
        <TableCell>{renderItemMapping(item, false)}</TableCell>
      </TableRow>
    );
  }

  /** One item card (<sm) — same data as the table row, the map action gets a full-width target. */
  function renderItemCard(item: OrderItemDetail) {
    return (
      <article key={item.id} className="bg-card space-y-3 rounded-xl border p-4">
        {renderItemName(item)}

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Harga</span>
            <span className="num">
              {item.quantity} × {item.unitPrice ? formatCurrency(item.unitPrice) : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span className="num font-medium">{formatLineTotal(item)}</span>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <p className="text-muted-foreground text-xs">Dikaitkan ke</p>
          {renderItemMapping(item, true)}
        </div>
      </article>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64 max-w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Skeleton className="h-5 w-20" />
            <div className="overflow-hidden rounded-xl border">
              <Skeleton className="h-10 w-full rounded-none" />
              <div className="divide-y">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 px-4 py-3.5">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="ml-auto h-4 w-10" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </aside>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/orders">
            <ArrowLeft className="size-4" />
            Kembali ke pesanan
          </Link>
        </Button>
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          {error instanceof Error ? error.message : 'Pesanan tidak ditemukan.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/orders">
          <ArrowLeft className="size-4" />
          Kembali ke pesanan
        </Link>
      </Button>

      <div className="space-y-1">
        <p className="eyebrow text-primary">Channel penjualan</p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="num text-2xl font-semibold tracking-tight">{data.externalOrderId}</h2>
          <OrderStatusBadge status={data.status} />
          {data.fulfilledAt ? <StatusBadge tone="info">Fulfillment</StatusBadge> : null}
          <div className="ml-auto">
            <OrderActionsMenu order={data} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <p className="text-sm font-medium">
            Item{' '}
            <span className="text-muted-foreground">
              · <span className="num">{data.items.length}</span>
            </span>
          </p>

          {/* Desktop table — the same items render as cards below sm. */}
          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Harga satuan</TableHead>
                  <TableHead>Dikaitkan ke</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{data.items.map((item) => renderItemRow(item))}</TableBody>
            </Table>
          </div>

          {/* Mobile card list — same data + Kaitkan action, full-width touch targets. */}
          <div className="space-y-3 sm:hidden">
            {data.items.map((item) => renderItemCard(item))}
          </div>
        </div>

        <aside className="space-y-4">
          {data.marketplace.cancelPending && data.status === 'PAID' ? (
            <div className="border-highlight/40 bg-highlight/15 text-status-warn rounded-lg border p-3 text-sm">
              Pembeli/sistem minta pembatalan — jangan dikirim dulu sampai statusnya jelas.
            </div>
          ) : null}

          {data.inventoryApplied ? (
            <div className="border-status-ok/30 bg-status-ok/10 text-status-ok rounded-lg border p-3 text-sm">
              Stok sudah diperbarui untuk pesanan ini.
            </div>
          ) : data.status === 'PAID' && data.unresolvedCount > 0 ? (
            <div className="border-highlight/40 bg-highlight/15 text-status-warn rounded-lg border p-3 text-sm">
              <span className="num">{data.unresolvedCount}</span> item belum dikaitkan ke produk,
              jadi stok belum diperbarui. Kaitkan listing-nya, lalu tarik pesanan lagi.
            </div>
          ) : data.status === 'PAID' ? (
            <div className="text-muted-foreground rounded-lg border p-3 text-sm">
              Stok belum diperbarui untuk pesanan ini.
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Toko</span>
                <span className="truncate text-right font-medium">{data.shopName}</span>
              </div>
              <OrderMetaLine label="No. pesanan" value={data.marketplace.orderNumber} />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Pembeli</span>
                <span className="truncate text-right font-medium">{data.buyerName ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="text-right font-medium" suppressHydrationWarning>
                  {formatDateTime(data.placedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Total</span>
                <span className="num text-right font-medium">
                  {data.totalAmount ? formatCurrency(data.totalAmount) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">No. resi</span>
                <span className="num truncate text-right font-medium">
                  {data.trackingNumber ?? '—'}
                </span>
              </div>
              <OrderMetaLine label="Metode bayar" value={data.marketplace.paymentMethod} />
              <OrderMetaLine
                label="Ongkir"
                value={
                  data.marketplace.shippingFee !== null
                    ? formatCurrency(data.marketplace.shippingFee)
                    : null
                }
              />
              {data.status === 'PENDING' || data.status === 'PAID' ? (
                <OrderMetaLine label="Batas kirim" value={data.marketplace.promisedShipTime} />
              ) : null}
              <OrderMetaLine label="Kurir" value={data.marketplace.courier} />
              <OrderMetaLine label="Gudang" value={data.marketplace.warehouseCode} />
              <OrderMetaLine label="Status retur" value={data.marketplace.returnStatus} />
              {data.status === 'CANCELLED' &&
              (data.cancelReason ?? data.marketplace.cancelReason) ? (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Alasan batal</span>
                  <span className="text-right font-medium">
                    {data.cancelReason ?? data.marketplace.cancelReason}
                  </span>
                </div>
              ) : null}
              {data.marketplace.buyerNote ? (
                <div className="space-y-1 border-t pt-3">
                  <span className="text-muted-foreground">Catatan pembeli</span>
                  <p className="bg-muted/50 rounded-md p-2 break-words">
                    {data.marketplace.buyerNote}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {data.trackingNumber ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Video packing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {isPackingVideosLoading ? (
                  <p className="text-muted-foreground text-xs">Memuat video...</p>
                ) : packingVideosError ? (
                  <ErrorState
                    title="Gagal memuat video packing"
                    onRetry={() => void refetchPackingVideos()}
                    className="p-4"
                  />
                ) : packingVideos && packingVideos.length > 0 ? (
                  <>
                    <p className="text-muted-foreground text-xs">
                      {packingVideos.length} rekaman untuk resi ini — bukti sengketa.
                    </p>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link
                        href={`/dashboard/recordings?search=${encodeURIComponent(data.trackingNumber)}`}
                      >
                        <Video className="size-4" />
                        Lihat video packing
                      </Link>
                    </Button>
                    <ShareEvidenceControl recordings={packingVideos} />
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                      Belum ada video packing untuk resi ini.
                    </p>
                    {data.status !== 'CANCELLED' ? (
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href={`/recordings?resi=${encodeURIComponent(data.trackingNumber)}`}>
                          <Video className="size-4" />
                          Rekam di station
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {data.status === 'SHIPPED' || data.status === 'COMPLETED' ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void handleCreateReturn()}
              disabled={createReturnMutation.isPending}
            >
              <Undo2 className="size-4" />
              {createReturnMutation.isPending ? 'Membuka...' : 'Buka retur'}
            </Button>
          ) : null}
        </aside>
      </div>

      {mapTarget ? (
        <VariantPickerDialog
          open={Boolean(mapTarget)}
          onOpenChange={(next) => {
            if (!next) setMapTarget(null);
          }}
          title="Kaitkan ke produk"
          description={mapTarget.label}
          busy={resolveMutation.isPending}
          onSelect={(variantId) => void handleResolve(variantId)}
        />
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Banknote,
  Boxes,
  Minus,
  Plus,
  ScanLine,
  ShoppingCart,
  Star,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SalePaymentMethod } from '@prisma/client';

import { ActionTooltip } from '@/components/ui/action-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ImageThumb } from '@/components/image-thumb';
import { TablePagination } from '@/components/table-pagination';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMediaQuery } from '@/hooks/use-media-query';
import { usePagination } from '@/hooks/use-pagination';
import { useScanSoundPref } from '@/hooks/use-scan-sound-pref';
import { useSoundUnlock } from '@/hooks/use-sound-unlock';
import { apiFetch } from '@/lib/api/fetch-client';
import { formatApiErrorMessage } from '@/lib/api/format-api-error';
import { apiRoutes } from '@/lib/api/routes';
import { formatCurrency } from '@/lib/formatters';
import { unlockScanSound } from '@/lib/scan-sound';
import { cn } from '@/lib/utils';
import { formatProductVariantLabel } from '@/lib/variant-label';
import { useBundlesQuery } from '@/modules/catalog/hooks/use-bundles';
import type { BundleDetail, BundleListItem, BundleResolution } from '@/modules/catalog/types';
import { ConnectScannerDialog } from '@/modules/scanner-pairing/components/connect-scanner-dialog';

import { useCreateSaleMutation, useSellableVariantsQuery } from '../hooks/use-sales';
import { usePosScanner, type PosScannerStatus } from '../hooks/use-pos-scanner';
import { usePosFavoritesStore } from '../store/pos-favorites.store';
import { computeSaleTotals } from '../utils/sale-totals';
import type { ScannedSaleItem, SellableVariant } from '../types';

const SCAN_SOUND_STORAGE_KEY = 'falka-pos-scan-sound';

/** Common rupiah notes for the quick-tender row, smallest first. */
const CASH_DENOMINATIONS = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000];

/** Subtle keyboard-hint chip (desktop only) — mirrors the command-palette style. */
function KbdHint({ label, className }: { label: string; className?: string }) {
  return (
    <kbd
      className={cn(
        'bg-muted text-muted-foreground pointer-events-none hidden rounded px-1.5 py-0.5 font-sans text-[10px] md:inline-block',
        className,
      )}
    >
      {label}
    </kbd>
  );
}

/** Per-state copy + accent for the POS phone-scanner indicator. */
const SCAN_STATUS_META: Record<
  PosScannerStatus,
  { dot: string; cta: string; hint: string | null }
> = {
  off: { dot: '', cta: '', hint: null },
  idle: { dot: 'bg-muted-foreground/40', cta: 'Scan dengan ponsel', hint: null },
  waiting: {
    dot: 'bg-highlight',
    cta: 'Tampilkan QR',
    hint: 'Menunggu ponsel kamu terhubung…',
  },
  connected: {
    dot: 'bg-status-ok',
    cta: 'Ponsel terhubung',
    hint: 'Ponsel terhubung — scan label produk buat masukin ke keranjang.',
  },
  disconnected: {
    dot: 'bg-destructive',
    cta: 'Hubungkan ulang',
    hint: 'Ponsel terputus. Ketuk Hubungkan ulang buat tampilin QR baru.',
  },
};

/** A single component variant a bundle line will consume (for oversell math + display). */
type BundleCartComponent = {
  productVariantId: string;
  name: string;
  quantity: number;
  availableStock: number;
};

type VariantCartLine = {
  kind: 'variant';
  variantId: string;
  sku: string;
  name: string;
  productName: string;
  variantGroup: string | null;
  unitPrice: number;
  /** Unit cost (modal) snapshot; null = unknown — drives the below-cost warning. */
  cost: number | null;
  quantity: number;
  availableStock: number;
  incomingStock: number;
  imageUrl: string | null;
};

type BundleCartLine = {
  kind: 'bundle';
  bundleId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
  components: BundleCartComponent[];
};

type CartLine = VariantCartLine | BundleCartLine;

export const PAYMENT_OPTIONS: ReadonlyArray<{ value: SalePaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'CARD', label: 'Kartu' },
  { value: 'OTHER', label: 'Lainnya' },
];

/** Human label for a payment-method enum — the single source for list/detail too. */
export function paymentMethodLabel(method: SalePaymentMethod): string {
  return PAYMENT_OPTIONS.find((option) => option.value === method)?.label ?? method;
}

/** Fetch a bundle's components on demand (Bundling-tab "Add" needs the full composition). */
function useResolveBundleDetail() {
  return useMutation({
    mutationFn: async (bundleId: string) => {
      const result = await apiFetch<BundleDetail>(`${apiRoutes.bundles}/${bundleId}`);
      if (!result.success) throw new Error(formatApiErrorMessage(result.error));
      return result.data;
    },
  });
}

export function PosTerminal() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const { page, setPage, pageSize, setPageSize } = usePagination(10);
  const {
    data: results,
    isLoading,
    error: variantsError,
    refetch: refetchVariants,
  } = useSellableVariantsQuery(debouncedSearch, page, pageSize);

  // A new search resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, setPage]);

  // Auto-focus the search box on desktop only — on a phone it would pop the
  // keyboard over the page on load. (autoFocus can't wait for matchMedia, so
  // focus imperatively once the query resolves to desktop.)
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const payButtonRef = useRef<HTMLButtonElement>(null);
  const didAutoFocusRef = useRef(false);
  useEffect(() => {
    if (isDesktop && !didAutoFocusRef.current) {
      didAutoFocusRef.current = true;
      searchInputRef.current?.focus();
    }
  }, [isDesktop]);

  const variants = results?.items ?? [];
  const meta = results?.meta;

  // Bundles for the Bundling tab (debounced search). A separate unfiltered query
  // decides whether the tab is worth showing at all (≥1 bundle exists).
  const {
    data: bundlesData,
    isLoading: bundlesLoading,
    error: bundlesError,
    refetch: refetchBundles,
  } = useBundlesQuery(debouncedSearch, 'all', 1, 100);
  const { data: bundleExistsData } = useBundlesQuery('', 'all', 1, 1);
  const hasBundles = (bundleExistsData?.summary.total ?? 0) > 0;
  const resolveBundleDetail = useResolveBundleDetail();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('CASH');
  const [customerName, setCustomerName] = useState('');
  // Change calculator (CASH only) — pure client math, never sent to the server.
  const [cashReceived, setCashReceived] = useState(0);
  // Cart-level discount (reset per sale) + PPN settings (sticky per register).
  const [discountType, setDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(11);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { soundOn, toggleSound } = useScanSoundPref(SCAN_SOUND_STORAGE_KEY);

  // Pinned favorites (ids only — the items themselves come from the queries above).
  const { favoriteVariantIds, favoriteBundleIds, toggleFavoriteVariant, toggleFavoriteBundle } =
    usePosFavoritesStore();

  // Unlock Web Audio on the first interaction so scan beeps can play.
  useSoundUnlock();

  function openScanner() {
    // Opening from a click unlocks audio so later socket-driven beeps can play.
    unlockScanSound();
    setScannerOpen(true);
  }

  const createSale = useCreateSaleMutation();

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );
  // Mirrors the server's authoritative math exactly (same shared util).
  const totals = useMemo(
    () =>
      computeSaleTotals(
        subtotal,
        discountValue > 0 ? { type: discountType, value: discountValue } : null,
        taxEnabled ? taxRate : 0,
        taxInclusive,
      ),
    [subtotal, discountType, discountValue, taxEnabled, taxRate, taxInclusive],
  );
  const total = totals.totalAmount;

  // Quick cash tender: the 3 smallest common notes that still cover the total.
  const quickTenderValues = useMemo(
    () => CASH_DENOMINATIONS.filter((value) => value >= total).slice(0, 3),
    [total],
  );

  // Minimal kasir shortcuts (desktop only): '/' jumps to the product search when
  // focus is NOT in an editable element; F8 jumps to payment from anywhere (its
  // whole point is escaping an input straight to the pay button).
  const canPay = cart.length > 0 && !createSale.isPending;
  useEffect(() => {
    if (!isDesktop) return;

    function isEditableTarget(target: EventTarget | null): boolean {
      return (
        target instanceof HTMLElement &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable)
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === 'F8') {
        event.preventDefault();
        paymentSectionRef.current?.scrollIntoView({ block: 'nearest' });
        if (canPay) payButtonRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, canPay]);

  // Total demand and known availability PER variant across the whole cart, so a
  // variant sold both standalone AND inside a bundle warns once their combined
  // demand exceeds its stock (oversell is allowed — this is just a heads-up).
  const { demandByVariant, availableByVariant } = useMemo(() => {
    const demand = new Map<string, number>();
    const available = new Map<string, number>();
    for (const line of cart) {
      if (line.kind === 'variant') {
        demand.set(line.variantId, (demand.get(line.variantId) ?? 0) + line.quantity);
        available.set(line.variantId, line.availableStock);
      } else {
        for (const component of line.components) {
          demand.set(
            component.productVariantId,
            (demand.get(component.productVariantId) ?? 0) + line.quantity * component.quantity,
          );
          available.set(component.productVariantId, component.availableStock);
        }
      }
    }
    return { demandByVariant: demand, availableByVariant: available };
  }, [cart]);

  /** A cart line oversells if ANY variant it contributes to is over its available stock. */
  function isLineOversold(line: CartLine): boolean {
    const variantIds =
      line.kind === 'variant'
        ? [line.variantId]
        : line.components.map((component) => component.productVariantId);
    return variantIds.some(
      (variantId) =>
        (demandByVariant.get(variantId) ?? 0) > (availableByVariant.get(variantId) ?? 0),
    );
  }

  function addVariantToCart(variant: SellableVariant) {
    setCart((prev) => {
      const existing = prev.find(
        (line) => line.kind === 'variant' && line.variantId === variant.variantId,
      );
      if (existing) {
        return prev.map((line) =>
          line.kind === 'variant' && line.variantId === variant.variantId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          kind: 'variant',
          variantId: variant.variantId,
          sku: variant.sku,
          name: variant.name,
          productName: variant.productName,
          variantGroup: variant.variantGroup,
          unitPrice: Number(variant.price),
          cost: variant.cost != null ? Number(variant.cost) : null,
          quantity: 1,
          availableStock: variant.availableStock,
          incomingStock: variant.incomingStock,
          imageUrl: variant.imageUrl,
        },
      ];
    });
  }

  /** Add or bump a bundle line. Components carry stock so the oversell math sees them. */
  function addBundleToCart(bundle: {
    id: string;
    name: string;
    sku: string;
    price: string;
    imageUrl: string | null;
    components: BundleCartComponent[];
  }) {
    setCart((prev) => {
      const existing = prev.find((line) => line.kind === 'bundle' && line.bundleId === bundle.id);
      if (existing) {
        return prev.map((line) =>
          line.kind === 'bundle' && line.bundleId === bundle.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          kind: 'bundle',
          bundleId: bundle.id,
          name: bundle.name,
          sku: bundle.sku,
          unitPrice: Number(bundle.price),
          quantity: 1,
          imageUrl: bundle.imageUrl,
          components: bundle.components,
        },
      ];
    });
  }

  function bundleResolutionToComponents(bundle: BundleResolution | BundleDetail) {
    return bundle.components.map((component) => ({
      productVariantId: component.productVariantId,
      name: component.name,
      quantity: component.quantity,
      availableStock: component.availableStock,
    }));
  }

  async function handleAddBundleFromList(item: BundleListItem) {
    try {
      const detail = await resolveBundleDetail.mutateAsync(item.id);
      addBundleToCart({
        id: detail.id,
        name: detail.name,
        sku: detail.sku,
        price: detail.price,
        imageUrl: detail.imageUrl,
        components: bundleResolutionToComponents(detail),
      });
    } catch (error) {
      toast.error('Gagal menambahkan bundel', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  // Mobile scan-to-cart: a paired phone scans a product/bundle label → add the line.
  function handleScanned(scanned: ScannedSaleItem) {
    if (scanned.kind === 'variant') {
      addVariantToCart(scanned.variant);
    } else {
      addBundleToCart({
        id: scanned.bundle.id,
        name: scanned.bundle.name,
        sku: scanned.bundle.sku,
        price: scanned.bundle.price,
        imageUrl: null,
        components: bundleResolutionToComponents(scanned.bundle),
      });
    }
  }

  const { scannerEnabled, status: scannerStatus } = usePosScanner({
    onResolved: handleScanned,
    soundEnabled: soundOn,
  });
  const scanMeta = SCAN_STATUS_META[scannerStatus];

  function patchVariantLine(variantId: string, patch: Partial<VariantCartLine>) {
    setCart((prev) =>
      prev.map((line) =>
        line.kind === 'variant' && line.variantId === variantId ? { ...line, ...patch } : line,
      ),
    );
  }

  function patchBundleLine(bundleId: string, patch: Partial<BundleCartLine>) {
    setCart((prev) =>
      prev.map((line) =>
        line.kind === 'bundle' && line.bundleId === bundleId ? { ...line, ...patch } : line,
      ),
    );
  }

  function removeVariantLine(variantId: string) {
    setCart((prev) =>
      prev.filter((line) => !(line.kind === 'variant' && line.variantId === variantId)),
    );
  }

  function removeBundleLine(bundleId: string) {
    setCart((prev) =>
      prev.filter((line) => !(line.kind === 'bundle' && line.bundleId === bundleId)),
    );
  }

  async function handleCheckout() {
    // The disabled button is only a UI hint, not a lock: the F8 shortcut focuses
    // the pay button and a fast Enter/double-tap can re-enter before isPending
    // flips, creating two sales that BOTH decrement stock. Guard in the handler.
    if (cart.length === 0 || createSale.isPending) return;
    try {
      const sale = await createSale.mutateAsync({
        items: cart.map((line) =>
          line.kind === 'variant'
            ? {
                kind: 'variant',
                variantId: line.variantId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
              }
            : {
                kind: 'bundle',
                bundleId: line.bundleId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
              },
        ),
        paymentMethod,
        customerName: customerName.trim() || undefined,
        ...(discountValue > 0 ? { discount: { type: discountType, value: discountValue } } : {}),
        ...(taxEnabled && taxRate > 0 ? { taxRate, taxInclusive } : {}),
      });
      toast.success(`Penjualan ${sale.code} tercatat`, {
        description: `${formatCurrency(sale.totalAmount)} · stok diperbarui`,
      });
      setCart([]);
      setCustomerName('');
      setCashReceived(0);
      // Discount is per-sale; the PPN setting stays (a register-level habit).
      setDiscountValue(0);
      setSearchInput('');
    } catch (error) {
      toast.error('Pembayaran gagal', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  }

  return (
    <div className="grid gap-6 pb-24 sm:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Product picker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Cari produk</CardTitle>
            {scannerEnabled ? (
              <div className="flex items-center gap-1.5">
                <ActionTooltip label={soundOn ? 'Bisukan suara scan' : 'Aktifkan suara scan'}>
                  <Button variant="ghost" size="icon" className="size-8" onClick={toggleSound}>
                    {soundOn ? (
                      <Volume2 className="size-4" />
                    ) : (
                      <VolumeX className="text-muted-foreground size-4" />
                    )}
                    <span className="sr-only">
                      {soundOn ? 'Bisukan suara scan' : 'Aktifkan suara scan'}
                    </span>
                  </Button>
                </ActionTooltip>
                <Button variant="outline" size="sm" onClick={openScanner}>
                  <span className={cn('size-2 rounded-full', scanMeta.dot)} aria-hidden />
                  <ScanLine className="size-4" />
                  {scanMeta.cta}
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input
              ref={searchInputRef}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari SKU atau nama produk..."
              className="md:pr-8"
            />
            <KbdHint label="/" className="absolute top-1/2 right-2 -translate-y-1/2" />
          </div>
          {scannerEnabled && scanMeta.hint ? (
            <p
              className={cn(
                'text-xs',
                scannerStatus === 'disconnected' ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {scanMeta.hint}
            </p>
          ) : null}

          {hasBundles ? (
            <Tabs defaultValue="products">
              <TabsList className="w-full">
                <TabsTrigger value="products" className="flex-1">
                  Produk
                </TabsTrigger>
                <TabsTrigger value="bundling" className="flex-1">
                  Bundel
                </TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="mt-3">
                <ProductResults
                  variants={variants}
                  isLoading={isLoading}
                  error={variantsError}
                  onRetry={() => void refetchVariants()}
                  hasSearch={Boolean(debouncedSearch)}
                  onAdd={addVariantToCart}
                  favoriteIds={favoriteVariantIds}
                  onToggleFavorite={toggleFavoriteVariant}
                />
              </TabsContent>
              <TabsContent value="bundling" className="mt-3">
                <BundleResults
                  bundles={bundlesData?.items.filter((bundle) => bundle.isActive)}
                  isLoading={bundlesLoading}
                  error={bundlesError}
                  onRetry={() => void refetchBundles()}
                  hasSearch={Boolean(debouncedSearch)}
                  isAdding={resolveBundleDetail.isPending}
                  onAdd={handleAddBundleFromList}
                  favoriteIds={favoriteBundleIds}
                  onToggleFavorite={toggleFavoriteBundle}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <ProductResults
              variants={variants}
              isLoading={isLoading}
              error={variantsError}
              onRetry={() => void refetchVariants()}
              hasSearch={Boolean(debouncedSearch)}
              onAdd={addVariantToCart}
              favoriteIds={favoriteVariantIds}
              onToggleFavorite={toggleFavoriteVariant}
            />
          )}

          {meta && meta.total > 0 ? (
            <TablePagination
              page={meta.page}
              pageSize={pageSize}
              total={meta.total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* Cart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keranjang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Keranjang kosong"
              description="Cari produk lalu tambahkan buat mulai jualan."
            />
          ) : (
            <div className="space-y-3">
              {cart.map((line) =>
                line.kind === 'variant' ? (
                  <VariantCartRow
                    key={`variant-${line.variantId}`}
                    line={line}
                    oversold={isLineOversold(line)}
                    onPatch={(patch) => patchVariantLine(line.variantId, patch)}
                    onRemove={() => removeVariantLine(line.variantId)}
                  />
                ) : (
                  <BundleCartRow
                    key={`bundle-${line.bundleId}`}
                    line={line}
                    oversold={isLineOversold(line)}
                    onPatch={(patch) => patchBundleLine(line.bundleId, patch)}
                    onRemove={() => removeBundleLine(line.bundleId)}
                  />
                ),
              )}
            </div>
          )}

          <div ref={paymentSectionRef} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="payment">Pembayaran</Label>
                <Select
                  id="payment"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as SalePaymentMethod)}
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer">Pelanggan (opsional)</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Pelanggan langsung"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="discount-value">Diskon</Label>
                <div className="flex gap-1.5">
                  <Select
                    value={discountType}
                    onChange={(event) =>
                      setDiscountType(event.target.value as 'PERCENT' | 'AMOUNT')
                    }
                    className="w-18 shrink-0"
                    aria-label="Jenis diskon"
                  >
                    <option value="PERCENT">%</option>
                    <option value="AMOUNT">Rp</option>
                  </Select>
                  <NumberInput
                    id="discount-value"
                    value={discountValue}
                    onChange={(value) => setDiscountValue(Math.max(0, value))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex h-5 items-center gap-2">
                  <Switch id="tax-enabled" checked={taxEnabled} onCheckedChange={setTaxEnabled} />
                  <Label htmlFor="tax-enabled">PPN</Label>
                </div>
                {taxEnabled ? (
                  <div className="flex gap-1.5">
                    <NumberInput
                      value={taxRate}
                      onChange={(value) => setTaxRate(Math.min(100, Math.max(0, value)))}
                      className="w-16 shrink-0"
                      aria-label="Tarif PPN (persen)"
                    />
                    <Select
                      value={taxInclusive ? 'inclusive' : 'exclusive'}
                      onChange={(event) => setTaxInclusive(event.target.value === 'inclusive')}
                      aria-label="Cara hitung PPN"
                    >
                      <option value="exclusive">Ditambahkan</option>
                      <option value="inclusive">Termasuk harga</option>
                    </Select>
                  </div>
                ) : (
                  <p className="text-muted-foreground pt-1.5 text-xs">Nonaktif</p>
                )}
              </div>
            </div>

            <div className="space-y-1 border-t pt-3">
              {totals.discountAmount > 0 || (taxEnabled && taxRate > 0) ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="num">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discountAmount > 0 ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Diskon{discountType === 'PERCENT' ? ` ${discountValue}%` : ''}
                      </span>
                      <span className="num text-signed-down">
                        −{formatCurrency(totals.discountAmount)}
                      </span>
                    </div>
                  ) : null}
                  {taxEnabled && taxRate > 0 ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        PPN <span className="num">{taxRate}%</span>
                        {taxInclusive ? ' (termasuk)' : ''}
                      </span>
                      <span className="num">
                        {taxInclusive ? '' : '+'}
                        {formatCurrency(totals.taxAmount)}
                      </span>
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground text-sm">Total harga</span>
                <span className="num text-lg font-semibold">{formatCurrency(total)}</span>
              </div>
            </div>

            {paymentMethod === 'CASH' ? (
              <div className="grid grid-cols-2 items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cash-received">Uang diterima</Label>
                  <NumberInput
                    id="cash-received"
                    value={cashReceived}
                    onChange={(value) => setCashReceived(Math.max(0, value))}
                  />
                </div>
                <p className="pb-2.5 text-right text-sm" aria-live="polite">
                  {cashReceived <= 0 ? (
                    <span className="text-muted-foreground">Kembalian —</span>
                  ) : cashReceived >= total ? (
                    <span className="text-muted-foreground">
                      Kembalian{' '}
                      <span className="num text-signed-up font-semibold">
                        {formatCurrency(cashReceived - total)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-status-warn">
                      Kurang{' '}
                      <span className="num font-semibold">
                        {formatCurrency(total - cashReceived)}
                      </span>
                    </span>
                  )}
                </p>
                {cart.length > 0 ? (
                  <div className="col-span-2 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCashReceived(total)}
                    >
                      Uang pas
                    </Button>
                    {quickTenderValues.map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="num"
                        onClick={() => setCashReceived(value)}
                      >
                        {formatCurrency(value)}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button
              ref={payButtonRef}
              className="w-full"
              size="lg"
              onClick={() => void handleCheckout()}
              disabled={cart.length === 0 || createSale.isPending}
            >
              <Banknote className="size-4" />
              {createSale.isPending ? 'Memproses...' : 'Bayar'}
              <KbdHint
                label="F8"
                className="bg-primary-foreground/15 text-primary-foreground/80 ml-1"
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sticky mobile checkout — the cart total + pay button stay reachable while
          the cart scrolls; same handler + disabled conditions as the card button. */}
      {cart.length > 0 ? (
        <div className="bg-card fixed inset-x-0 bottom-0 z-30 border-t p-3 sm:hidden">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="num-display truncate">{formatCurrency(total)}</p>
            </div>
            <Button
              size="lg"
              className="shrink-0"
              onClick={() => void handleCheckout()}
              disabled={cart.length === 0 || createSale.isPending}
            >
              <Banknote className="size-4" />
              {createSale.isPending ? 'Memproses...' : 'Bayar'}
            </Button>
          </div>
        </div>
      ) : null}

      <ConnectScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} purpose="POS" />
    </div>
  );
}

/** Star toggle for pinning a row to the POS favorites strip. */
function FavoriteToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const label = active ? 'Lepas dari favorit' : 'Sematkan ke favorit';
  return (
    <ActionTooltip label={label}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8 shrink-0"
        aria-pressed={active}
        onClick={onToggle}
      >
        <Star
          className={cn(
            'size-4',
            active ? 'text-highlight-strong fill-current' : 'text-muted-foreground',
          )}
        />
        <span className="sr-only">{label}</span>
      </Button>
    </ActionTooltip>
  );
}

/**
 * The "Favorit" quick-add strip above the results (search empty only). Favorites
 * resolve against the currently fetched page; the ones it can't find render as a
 * muted note instead of vanishing silently.
 */
function FavoritesStrip<T>({
  items,
  skippedCount,
  getKey,
  getLabel,
  onAdd,
}: {
  items: T[];
  skippedCount: number;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onAdd: (item: T) => void;
}) {
  if (items.length === 0 && skippedCount === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">Favorit</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Button
              key={getKey(item)}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onAdd(item)}
            >
              <Star className="text-highlight-strong size-3.5 fill-current" aria-hidden />
              <span className="max-w-40 truncate">{getLabel(item)}</span>
            </Button>
          ))}
        </div>
      ) : null}
      {skippedCount > 0 ? (
        <p className="text-muted-foreground text-xs">
          Sebagian favorit tidak tampil di halaman ini.
        </p>
      ) : null}
    </div>
  );
}

/** The variant search list (shared between the no-tabs and Products-tab layouts). */
function ProductResults({
  variants,
  isLoading,
  error,
  onRetry,
  hasSearch,
  onAdd,
  favoriteIds,
  onToggleFavorite,
}: {
  variants: SellableVariant[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  hasSearch: boolean;
  onAdd: (variant: SellableVariant) => void;
  favoriteIds: string[];
  onToggleFavorite: (variantId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState className="p-6" title="Gagal memuat produk" onRetry={onRetry} />;
  }

  const favoriteVariants = favoriteIds
    .map((id) => variants?.find((variant) => variant.variantId === id))
    .filter((variant): variant is SellableVariant => variant !== undefined);
  const favoritesStrip =
    !hasSearch && favoriteIds.length > 0 ? (
      <FavoritesStrip
        items={favoriteVariants}
        skippedCount={favoriteIds.length - favoriteVariants.length}
        getKey={(variant) => variant.variantId}
        getLabel={(variant) => formatProductVariantLabel(variant.productName, variant)}
        onAdd={onAdd}
      />
    ) : null;

  if ((variants?.length ?? 0) === 0) {
    return (
      <div className="space-y-3">
        {favoritesStrip}
        <p className="text-muted-foreground py-6 text-center text-sm">
          {hasSearch ? 'Tidak ada produk yang cocok.' : 'Ketik untuk mencari produk.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favoritesStrip}
      <ul className="divide-y rounded-lg border">
        {variants?.map((variant) => (
          <li key={variant.variantId} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <ImageThumb src={variant.imageUrl} alt={variant.name} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {formatProductVariantLabel(variant.productName, variant)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {variant.sku} · {formatCurrency(variant.price)} ·{' '}
                  <span className={variant.availableStock <= 0 ? 'text-destructive' : ''}>
                    {variant.availableStock} tersedia
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <FavoriteToggle
                active={favoriteIds.includes(variant.variantId)}
                onToggle={() => onToggleFavorite(variant.variantId)}
              />
              <Button size="sm" variant="outline" onClick={() => onAdd(variant)}>
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The bundle list for the Bundling tab. */
function BundleResults({
  bundles,
  isLoading,
  error,
  onRetry,
  hasSearch,
  isAdding,
  onAdd,
  favoriteIds,
  onToggleFavorite,
}: {
  bundles: BundleListItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  hasSearch: boolean;
  isAdding: boolean;
  onAdd: (bundle: BundleListItem) => void;
  favoriteIds: string[];
  onToggleFavorite: (bundleId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState className="p-6" title="Gagal memuat bundel" onRetry={onRetry} />;
  }

  const favoriteBundles = favoriteIds
    .map((id) => bundles?.find((bundle) => bundle.id === id))
    .filter((bundle): bundle is BundleListItem => bundle !== undefined);
  const favoritesStrip =
    !hasSearch && favoriteIds.length > 0 ? (
      <FavoritesStrip
        items={favoriteBundles}
        skippedCount={favoriteIds.length - favoriteBundles.length}
        getKey={(bundle) => bundle.id}
        getLabel={(bundle) => bundle.name}
        onAdd={onAdd}
      />
    ) : null;

  if ((bundles?.length ?? 0) === 0) {
    return (
      <div className="space-y-3">
        {favoritesStrip}
        <p className="text-muted-foreground py-6 text-center text-sm">
          {hasSearch ? 'Tidak ada bundel yang cocok.' : 'Belum ada bundel.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favoritesStrip}
      <ul className="divide-y rounded-lg border">
        {bundles?.map((bundle) => (
          <li key={bundle.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <ImageThumb src={bundle.imageUrl} alt={bundle.name} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{bundle.name}</span>
                  <Badge
                    variant="outline"
                    className="border-violet-500/40 text-violet-600 dark:text-violet-400"
                  >
                    Bundel
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {bundle.sku} · {formatCurrency(bundle.price)} · {bundle.totalVariant} item ·{' '}
                  <span className={bundle.available <= 0 ? 'text-destructive' : ''}>
                    {bundle.available} tersedia
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <FavoriteToggle
                active={favoriteIds.includes(bundle.id)}
                onToggle={() => onToggleFavorite(bundle.id)}
              />
              <Button size="sm" variant="outline" disabled={isAdding} onClick={() => onAdd(bundle)}>
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * − / + buttons flanking the qty input (kasir speed). Both paths go through the
 * SAME clamped (≥1) update the input itself reports — typing still works.
 */
function QtyStepper({
  id,
  quantity,
  onQuantityChange,
}: {
  id: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="shrink-0"
        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        aria-label="Kurangi jumlah"
      >
        <Minus className="size-4" />
      </Button>
      <NumberInput
        id={id}
        className="w-16 text-center"
        value={quantity}
        onChange={(value) => onQuantityChange(Math.max(1, value))}
      />
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="shrink-0"
        onClick={() => onQuantityChange(quantity + 1)}
        aria-label="Tambah jumlah"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

/** A standalone-variant cart row. */
function VariantCartRow({
  line,
  oversold,
  onPatch,
  onRemove,
}: {
  line: VariantCartLine;
  oversold: boolean;
  onPatch: (patch: Partial<VariantCartLine>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <ImageThumb src={line.imageUrl} alt={line.name} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {formatProductVariantLabel(line.productName, line)}
            </div>
            <div className="text-muted-foreground text-xs">
              {line.sku} · {line.availableStock} tersedia · {line.incomingStock} akan datang
            </div>
          </div>
        </div>
        <ActionTooltip label="Hapus dari keranjang">
          <Button size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="size-4" />
            <span className="sr-only">Hapus dari keranjang</span>
          </Button>
        </ActionTooltip>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={`cart-qty-${line.variantId}`}>Qty</Label>
          <QtyStepper
            id={`cart-qty-${line.variantId}`}
            quantity={line.quantity}
            onQuantityChange={(quantity) => onPatch({ quantity })}
          />
        </div>
        <div className="min-w-28 flex-1 space-y-1.5">
          <Label htmlFor={`cart-price-${line.variantId}`}>Harga satuan</Label>
          <NumberInput
            id={`cart-price-${line.variantId}`}
            value={line.unitPrice}
            onChange={(value) => onPatch({ unitPrice: Math.max(0, value) })}
          />
        </div>
        <div className="ml-auto text-right">
          <div className="text-muted-foreground text-xs">Total</div>
          <div className="num font-medium">{formatCurrency(line.unitPrice * line.quantity)}</div>
        </div>
      </div>
      {oversold ? (
        <Badge
          variant="outline"
          className="border-highlight/40 bg-highlight/15 text-status-warn mt-2"
        >
          Melebihi stok (boleh, barangnya ada di tangan) · sisa {line.availableStock} di sistem
        </Badge>
      ) : null}
      {line.cost != null && line.unitPrice < line.cost ? (
        <Badge
          variant="outline"
          className="border-highlight/40 bg-highlight/15 text-status-warn mt-2"
        >
          Di bawah modal (<span className="num">{formatCurrency(line.cost)}</span>) — margin minus
        </Badge>
      ) : null}
    </div>
  );
}

/** A bundle cart row: a violet badge + its component variants and resulting quantities. */
function BundleCartRow({
  line,
  oversold,
  onPatch,
  onRemove,
}: {
  line: BundleCartLine;
  oversold: boolean;
  onPatch: (patch: Partial<BundleCartLine>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <ImageThumb src={line.imageUrl} alt={line.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{line.name}</span>
              <Badge
                variant="outline"
                className="border-violet-500/40 text-violet-600 dark:text-violet-400"
              >
                <Boxes className="size-3" />
                Bundel
              </Badge>
            </div>
            <div className="text-muted-foreground text-xs">{line.sku}</div>
          </div>
        </div>
        <ActionTooltip label="Hapus dari keranjang">
          <Button size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="size-4" />
            <span className="sr-only">Hapus dari keranjang</span>
          </Button>
        </ActionTooltip>
      </div>

      <ul className="bg-muted/40 mt-2 space-y-1 rounded-md px-2.5 py-2">
        {line.components.map((component) => (
          <li
            key={component.productVariantId}
            className="text-muted-foreground flex items-center justify-between gap-2 text-xs"
          >
            <span className="truncate">{component.name}</span>
            <span className="num whitespace-nowrap">{line.quantity * component.quantity}×</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={`cart-qty-${line.bundleId}`}>Qty</Label>
          <QtyStepper
            id={`cart-qty-${line.bundleId}`}
            quantity={line.quantity}
            onQuantityChange={(quantity) => onPatch({ quantity })}
          />
        </div>
        <div className="min-w-28 flex-1 space-y-1.5">
          <Label htmlFor={`cart-price-${line.bundleId}`}>Harga bundel</Label>
          <NumberInput
            id={`cart-price-${line.bundleId}`}
            value={line.unitPrice}
            onChange={(value) => onPatch({ unitPrice: Math.max(0, value) })}
          />
        </div>
        <div className="ml-auto text-right">
          <div className="text-muted-foreground text-xs">Total</div>
          <div className="num font-medium">{formatCurrency(line.unitPrice * line.quantity)}</div>
        </div>
      </div>
      {oversold ? (
        <Badge
          variant="outline"
          className="border-highlight/40 bg-highlight/15 text-status-warn mt-2"
        >
          Melebihi stok (boleh, barangnya ada di tangan) · ada komponen yang kurang
        </Badge>
      ) : null}
    </div>
  );
}

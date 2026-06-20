import type { ProductImportRowResult, ProductImportSummary } from '../types';
import type { CreateVariantInput } from '../validators/variant';
import type { UpdateVariantDetailsInput } from '../validators/update-variant-details';
import type { RawProductRow } from './parse-products-csv';
import { suggestVariantSku } from './variants';

/** Mirrors the caps in validators/variant.ts (kept local so the planner is pure + testable). */
const MAX_MONEY = 9_999_999_999;
const MAX_STOCK = 1_000_000_000;
const MAX_NAME = 200;
const MAX_GROUP = 200;
const MAX_BARCODE = 64;
const MAX_SKU = 64;

/** A grouped create: N variant rows that become one product (new, or added to an existing one). */
export type CreateGroup = {
  /** Source line numbers feeding this group (so the committer can map outcomes back). */
  lines: number[];
  /** Existing product to add the variants to; null = create a fresh product. */
  targetProductId: string | null;
  name: string;
  category?: string;
  description?: string;
  variants: CreateVariantInput[];
};

export type UpdateOp = {
  line: number;
  variantId: string;
  input: UpdateVariantDetailsInput;
};

export type ImportPlan = {
  rows: ProductImportRowResult[];
  createGroups: CreateGroup[];
  updates: UpdateOp[];
  summary: ProductImportSummary;
};

export type ImportPlanContext = {
  /** SKU → live variant. An exact match means the row UPDATES that variant. */
  existingVariantsBySku: Map<string, { variantId: string; productId: string }>;
  /** Product name → live product ids (exact). Used to route new variants. */
  existingProductIdsByName: Map<string, string[]>;
};

type ParsedNumber = { value?: number; error?: string };

function parseNumber(raw: string, max: number, integer: boolean): ParsedNumber {
  const text = raw.trim();
  if (text === '') return {};
  const value = Number(text);
  if (!Number.isFinite(value)) return { error: 'bukan angka' };
  if (value < 0) return { error: 'tidak boleh negatif' };
  if (integer && !Number.isInteger(value)) return { error: 'harus bilangan bulat' };
  if (value > max) return { error: 'terlalu besar' };
  return { value };
}

/** Make `base` unique against `used` by appending -2, -3, … ; reserves the result. */
function uniqueSku(base: string, used: Set<string>): string {
  const root = base || 'SKU';
  if (!used.has(root)) {
    used.add(root);
    return root;
  }
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
}

/**
 * Decide, per CSV row, what the import will do — pure (no DB). Classify by SKU:
 * an exact match of a live variant = UPDATE its core fields (price/cost/name/
 * barcode/group); an unmatched/blank SKU = CREATE (blank SKUs auto-generate a
 * unique one). Create rows are grouped by product name and routed to an existing
 * product (1 match), a new product (0), or flagged ambiguous (≥2). Stock only
 * seeds NEW variants — a stock cell on an existing SKU is reported but ignored.
 */
export function planProductImport(rows: RawProductRow[], context: ImportPlanContext): ImportPlan {
  const resultByLine = new Map<number, ProductImportRowResult>();
  const updates: UpdateOp[] = [];
  const usedSkus = new Set(context.existingVariantsBySku.keys());

  // Create rows are resolved after grouping; stash them with their parsed variant.
  type CreateCandidate = {
    line: number;
    name: string;
    category?: string;
    description?: string;
    variant: CreateVariantInput;
  };
  const createCandidates: CreateCandidate[] = [];

  for (const row of rows) {
    const productName = row.productName.trim();
    const variantName = row.variantName.trim();
    const sku = row.sku.trim();
    const variantGroup = row.variantGroup.trim();
    const barcode = row.barcode.trim();
    const base: ProductImportRowResult = {
      line: row.line,
      status: 'error',
      sku: sku || null,
      productName,
      variantName,
      message: null,
    };

    const matched = sku ? context.existingVariantsBySku.get(sku) : undefined;

    if (matched) {
      // UPDATE — patch only the non-blank editable cells.
      const price = parseNumber(row.price, MAX_MONEY, false);
      const cost = parseNumber(row.cost, MAX_MONEY, false);
      const errors: string[] = [];
      if (price.error) errors.push(`Harga ${price.error}.`);
      if (cost.error) errors.push(`Modal ${cost.error}.`);
      if (variantName.length > MAX_NAME) errors.push('Nama varian terlalu panjang.');
      if (variantGroup.length > MAX_GROUP) errors.push('Grup varian terlalu panjang.');
      if (barcode.length > MAX_BARCODE) errors.push('Barcode terlalu panjang.');

      if (errors.length > 0) {
        resultByLine.set(row.line, { ...base, message: errors.join(' ') });
        continue;
      }

      const input: UpdateVariantDetailsInput = {};
      if (variantName) input.name = variantName;
      if (variantGroup) input.variantGroup = variantGroup;
      if (barcode) input.barcode = barcode;
      if (price.value !== undefined) input.price = price.value;
      if (cost.value !== undefined) input.cost = cost.value;

      if (Object.keys(input).length === 0) {
        resultByLine.set(row.line, {
          ...base,
          status: 'skip',
          message: 'Tidak ada kolom yang bisa diperbarui.',
        });
        continue;
      }

      const note = row.stock.trim() ? 'Stok diabaikan untuk SKU yang sudah ada.' : null;
      updates.push({ line: row.line, variantId: matched.variantId, input });
      resultByLine.set(row.line, { ...base, status: 'update', message: note });
      continue;
    }

    // CREATE — validate the required fields for a brand-new variant.
    const price = parseNumber(row.price, MAX_MONEY, false);
    const cost = parseNumber(row.cost, MAX_MONEY, false);
    const stock = parseNumber(row.stock, MAX_STOCK, true);
    const errors: string[] = [];
    if (!productName) errors.push('Nama produk wajib diisi untuk produk baru.');
    else if (productName.length > MAX_NAME) errors.push('Nama produk terlalu panjang.');
    if (!variantName) errors.push('Nama varian wajib diisi.');
    else if (variantName.length > MAX_NAME) errors.push('Nama varian terlalu panjang.');
    if (variantGroup.length > MAX_GROUP) errors.push('Grup varian terlalu panjang.');
    if (barcode.length > MAX_BARCODE) errors.push('Barcode terlalu panjang.');
    if (row.price.trim() === '') errors.push('Harga wajib diisi.');
    else if (price.error) errors.push(`Harga ${price.error}.`);
    if (cost.error) errors.push(`Modal ${cost.error}.`);
    if (stock.error) errors.push(`Stok ${stock.error}.`);
    if (sku && sku.length > MAX_SKU) errors.push('SKU terlalu panjang (maks 64).');
    if (sku && sku.length <= MAX_SKU && usedSkus.has(sku))
      errors.push(`SKU "${sku}" duplikat di file atau sudah dipakai.`);

    if (errors.length > 0) {
      resultByLine.set(row.line, { ...base, message: errors.join(' ') });
      continue;
    }

    let finalSku: string;
    if (sku) {
      usedSkus.add(sku);
      finalSku = sku;
    } else {
      finalSku = uniqueSku(suggestVariantSku(productName, variantName), usedSkus);
    }

    const variant: CreateVariantInput = {
      sku: finalSku,
      name: variantName,
      variantGroup: variantGroup || undefined,
      barcode: barcode || undefined,
      price: price.value ?? 0,
      cost: cost.value,
      lowStockThreshold: 0,
      alertEnabled: true,
      initialStock: stock.value ?? 0,
    };

    createCandidates.push({
      line: row.line,
      name: productName,
      category: row.category.trim() || undefined,
      description: row.description.trim() || undefined,
      variant,
    });
    // Provisional — finalized (or flagged ambiguous) during grouping below.
    resultByLine.set(row.line, { ...base, status: 'create', sku: finalSku, message: null });
  }

  // Group create rows by product name and route each group.
  const createGroups: CreateGroup[] = [];
  const byName = new Map<string, CreateCandidate[]>();
  for (const candidate of createCandidates) {
    const list = byName.get(candidate.name) ?? [];
    list.push(candidate);
    byName.set(candidate.name, list);
  }

  for (const [name, candidates] of byName) {
    const productIds = context.existingProductIdsByName.get(name) ?? [];
    if (productIds.length >= 2) {
      for (const candidate of candidates) {
        const previous = resultByLine.get(candidate.line);
        if (previous) {
          resultByLine.set(candidate.line, {
            ...previous,
            status: 'error',
            message: `Ada beberapa produk bernama "${name}" — tambah varian lewat halaman produk.`,
          });
        }
      }
      continue;
    }

    createGroups.push({
      lines: candidates.map((candidate) => candidate.line),
      targetProductId: productIds[0] ?? null,
      name,
      category: candidates.find((candidate) => candidate.category)?.category,
      description: candidates.find((candidate) => candidate.description)?.description,
      variants: candidates.map((candidate) => candidate.variant),
    });
  }

  const orderedRows = rows.map(
    (row) =>
      resultByLine.get(row.line) ?? {
        line: row.line,
        status: 'error' as const,
        sku: null,
        productName: row.productName.trim(),
        variantName: row.variantName.trim(),
        message: 'Baris tidak dapat diproses.',
      },
  );
  const summary: ProductImportSummary = {
    create: orderedRows.filter((row) => row.status === 'create').length,
    update: orderedRows.filter((row) => row.status === 'update').length,
    skip: orderedRows.filter((row) => row.status === 'skip').length,
    error: orderedRows.filter((row) => row.status === 'error').length,
    total: orderedRows.length,
  };

  return { rows: orderedRows, createGroups, updates, summary };
}

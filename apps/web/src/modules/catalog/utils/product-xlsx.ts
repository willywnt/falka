import * as XLSX from 'xlsx';

import type { ProductExportRow } from '../types';
import { PRODUCT_CSV_HEADERS, PRODUCT_TEMPLATE_HEADERS } from './product-csv';

const SHEET_NAME = 'Produk';

/** Prefix a leading formula sigil with `'` so a spreadsheet shows the cell literally (CSV/XLSX
 *  injection); plain (optionally-signed) numbers are exempt. */
function safeText(value: string): string {
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function rowToCells(row: ProductExportRow): (string | number)[] {
  return [
    safeText(row.productName),
    safeText(row.category ?? ''),
    safeText(row.description ?? ''),
    safeText(row.variantGroup ?? ''),
    safeText(row.variantName),
    safeText(row.sku),
    safeText(row.barcode ?? ''),
    row.price,
    row.cost ?? '',
    row.stock,
  ];
}

function workbookBytes(aoa: (string | number)[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, SHEET_NAME);
  // `type: 'array'` yields an ArrayBuffer — a clean Response BodyInit (a Node
  // Buffer / generic Uint8Array<ArrayBufferLike> is not, under current typings).
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

/** Full data workbook (header + one row per variant) as .xlsx bytes. */
export function buildProductsXlsx(rows: ProductExportRow[]): ArrayBuffer {
  return workbookBytes([PRODUCT_CSV_HEADERS, ...rows.map(rowToCells)]);
}

/** Header-only template workbook (required columns marked "*") as .xlsx bytes. */
export function buildProductTemplateXlsx(): ArrayBuffer {
  return workbookBytes([PRODUCT_TEMPLATE_HEADERS]);
}

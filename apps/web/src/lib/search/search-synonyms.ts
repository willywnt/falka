/*
 * Synonyms & common typos for the command palette. A query token is expanded
 * to itself plus any aliases here, so "invoice" finds the struk screen and a
 * fat-fingered "pesnan" still lands on Pesanan. The scorer caps a synonym hit
 * at the `substring` tier (see fuzzy-search.ts), so an alias never poses as an
 * exact match — the honesty rule extends into search.
 *
 * Keys and values are lowercase. Data-driven: add a row, no code change.
 */
export const SEARCH_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  // Vocabulary aliases (a different word for the same screen).
  invoice: ['struk', 'penjualan'],
  nota: ['struk', 'penjualan'],
  bon: ['struk', 'penjualan'],
  pembayaran: ['kasir', 'penjualan'],
  tunai: ['kasir'],
  qris: ['kasir'],
  gudang: ['inventaris', 'stok'],
  kosong: ['restok', 'menipis'],
  refund: ['retur', 'pengembalian'],
  komplain: ['retur'],
  reorder: ['restok', 'saran'],
  beli: ['pembelian'],
  terima: ['pembelian'],
  penerimaan: ['pembelian'],
  pengiriman: ['pesanan', 'resi'],
  vendor: ['pemasok', 'supplier'],
  distributor: ['pemasok'],
  pelacakan: ['resi'],
  tracking: ['resi'],
  kategori: ['katalog', 'produk'],
  tiktok: ['marketplace', 'tokopedia'],
  sync: ['sinkron', 'marketplace'],
  omset: ['omzet', 'laba'],
  keuntungan: ['laba'],
  untung: ['laba'],
  rugi: ['laba'],
  karyawan: ['pengaturan'],
  tim: ['pengaturan'],
  // Common misspellings (typo → the word that matches a menu).
  pesnan: ['pesanan'],
  pesakan: ['pesanan'],
  oder: ['pesanan', 'order'],
  inventori: ['inventaris'],
  inventory: ['inventaris'],
  prodk: ['produk'],
  produck: ['produk'],
  kasr: ['kasir'],
  pemasuk: ['pemasok'],
  pembeian: ['pembelian'],
  marketplce: ['marketplace'],
  retrun: ['retur'],
};

/** A token plus its aliases (the token itself first). */
export function expandQueryToken(token: string): readonly string[] {
  const synonyms = SEARCH_SYNONYMS[token];
  return synonyms ? [token, ...synonyms] : [token];
}

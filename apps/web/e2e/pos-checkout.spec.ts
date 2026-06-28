import { test, expect } from '@playwright/test';

/**
 * The flow that regressed when the stock advisory lock used $queryRaw: a CASH POS
 * sale. End-to-end proof that checkout commits (the sale transaction — decrement +
 * ledger + advisory lock — runs against the real DB). Uses the seeded sellable
 * variant KAOS-HTM-L; oversell is allowed, so the assertion holds regardless of the
 * current stock level across repeated runs.
 */
const SKU = 'KAOS-HTM-L';

test('CASH checkout records a sale', async ({ page }) => {
  await page.goto('/dashboard/sales/new');

  await page.getByPlaceholder(/Cari SKU atau nama produk/).fill(SKU);

  // Wait for the debounced search to surface the result, then add it to the cart.
  const addButton = page.getByRole('button', { name: 'Tambah' }).first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  // CASH is the default payment method; pay.
  const pay = page.getByRole('button', { name: 'Bayar' });
  await expect(pay).toBeEnabled();
  await pay.click();

  // Success toast "Penjualan S##### tercatat" proves the sale transaction committed.
  await expect(page.getByText(/Penjualan\s+S\d+\s+tercatat/i)).toBeVisible();
});

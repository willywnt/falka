import { test, expect } from '@playwright/test';

/**
 * Void path: ring up a CASH sale, then cancel it from the sale detail. Exercises
 * voidSale end-to-end — the per-sale advisory lock + the restock of every line —
 * against the real DB. Self-contained and stock-neutral (the sale is immediately
 * voided), so it's safe to run repeatedly.
 */
test('voiding a sale marks it cancelled', async ({ page }) => {
  // 1. Ring up a sale and capture its code from the success toast.
  await page.goto('/dashboard/sales/new');
  await page.getByPlaceholder(/Cari SKU atau nama produk/).fill('KAOS-HTM-L');
  await page.getByRole('button', { name: 'Tambah' }).first().click();
  await page.getByRole('button', { name: 'Bayar' }).click();

  const toast = page.getByText(/Penjualan\s+S\d+\s+tercatat/i);
  await expect(toast).toBeVisible();
  const code = (await toast.textContent())?.match(/S\d+/)?.[0];
  expect(code, 'sale code from toast').toBeTruthy();

  // 2. Open it from the sales list. Read the detail href off the link and navigate
  //    directly — a fast click on a Next <Link> can race hydration in the CI prod
  //    build (the click is swallowed before the client router is ready), leaving the
  //    URL on the list. goto(href) is deterministic.
  await page.goto('/dashboard/sales');
  const saleLink = page.getByRole('link', { name: code! }).first();
  await expect(saleLink).toBeVisible();
  const href = await saleLink.getAttribute('href');
  expect(href, 'sale detail href').toBeTruthy();
  await page.goto(href!);
  await expect(page).toHaveURL(/\/dashboard\/sales\/[^/]+$/);

  // 3. Cancel it (button is gated on status COMPLETED + the sales.refund permission,
  //    which the demo OWNER has). Retry the open until the confirm dialog appears — a
  //    too-early click can be swallowed by the same prod-build hydration race; the
  //    isVisible guard avoids re-clicking once the dialog is already up.
  const voidButton = page.getByRole('button', { name: 'Batalkan penjualan' });
  const dialog = page.getByRole('alertdialog');
  await expect(voidButton).toBeVisible();
  await expect(async () => {
    if (!(await dialog.isVisible())) await voidButton.click();
    await expect(dialog).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await dialog.getByRole('button', { name: 'Batalkan penjualan' }).click();

  // 4. The sale now shows the cancelled status badge. Match it EXACTLY ('Dibatalkan') so the
  //    locator doesn't also resolve to the transient void success toast ('Penjualan dibatalkan'),
  //    which contains the same word — a substring match races the toast's lifetime (strict-mode
  //    violation when both are on screen at once).
  await expect(page.getByText('Dibatalkan', { exact: true })).toBeVisible();
});

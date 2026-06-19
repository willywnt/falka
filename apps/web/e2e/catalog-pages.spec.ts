import { test, expect } from '@playwright/test';

/**
 * Read-only smoke over the surfaces touched by the catalog god-service split: the
 * products list (catalog service, listProducts) and the bundles list (the extracted
 * bundle-server.service, listBundles). A seeded row must render — a positive signal
 * that the data path works end-to-end in the real app after the refactor.
 */
test('products list renders a seeded product', async ({ page }) => {
  await page.goto('/dashboard/products');
  await expect(page.getByRole('heading', { name: 'Produk' })).toBeVisible();
  await page.getByPlaceholder('Cari produk...').fill('KAOS');
  await expect(page.getByText('Kaos Polos Premium').first()).toBeVisible();
});

test('bundles list renders a seeded bundle via the extracted bundle service', async ({ page }) => {
  await page.goto('/dashboard/bundles');
  await expect(page.getByRole('link', { name: 'Bundel baru' })).toBeVisible();
  await expect(page.getByText('Paket OOTD Hemat').first()).toBeVisible();
});

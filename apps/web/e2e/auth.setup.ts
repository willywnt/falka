import { test as setup, expect } from '@playwright/test';

/**
 * Log in once as the demo shop OWNER and persist the session cookie, so the test
 * project starts already authenticated. Creds default to the demo seed; override
 * with E2E_EMAIL / E2E_PASSWORD.
 */
const authFile = 'e2e/.auth/user.json';
const email = process.env.E2E_EMAIL ?? 'owner@palka.demo';
const password = process.env.E2E_PASSWORD ?? 'Demo123!';

setup('authenticate as shop owner', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();

  // Credentials sign-in lands on the shop dashboard, away from /login.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: authFile });
});

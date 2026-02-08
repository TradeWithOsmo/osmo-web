import { expect, test } from '@playwright/test';

test.describe('Trade app smoke', () => {
  test('loads trade page and shows primary navigation', async ({ page }) => {
    await page.goto('/trade', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/trade$/);
    await expect(page.getByRole('button', { name: /^Trade Mode$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Portfolio$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Usage$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Faucet$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect Wallet/i }).first()).toBeVisible();
  });

  test('shows autos chat input after switching to Assist layout', async ({ page }) => {
    await page.goto('/trade', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /Assist/i }).first().click();
    await expect(page.getByPlaceholder(/Ask osmo to help you trade/i)).toBeVisible({ timeout: 20_000 });
  });
});

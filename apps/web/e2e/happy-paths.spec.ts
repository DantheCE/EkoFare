import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// E2E happy paths (Spec §10). Run entirely in mock mode — no backend.
// ─────────────────────────────────────────────────────────────────────────────

test('home lists popular routes and opens a route detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('EkoFare')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Popular Routes' })).toBeVisible();

  await page.getByRole('link', { name: /end to end/ }).first().click();
  await expect(page).toHaveURL(/\/routes\/.+/);
});

test('selecting two stops computes a fare and shares a ticket', async ({ page }) => {
  await page.goto('/routes/mile2-cms');

  const stops = page.getByRole('button', { name: /tap to set as/ });
  await stops.first().click(); // origin
  await stops.last().click(); // destination

  await expect(page.getByText('Your fare')).toBeVisible();
  const share = page.getByRole('button', { name: /Share trip/ });
  await expect(share).toBeEnabled();
  await share.click();

  await expect(page).toHaveURL(/\/routes\/mile2-cms\/fare/);
  await expect(page.getByText('Total per person')).toBeVisible();
  // ₦550 shows twice (big total + destination cumulative); the total is first.
  await expect(page.getByText('₦550').first()).toBeVisible();
});

test('search surfaces matching routes and stops', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('textbox', { name: /Search stops or routes/ }).fill('oshodi');
  await expect(page.getByRole('heading', { name: 'Stops' })).toBeVisible();
  await expect(page.getByText('Oshodi', { exact: true }).first()).toBeVisible();
});

test('contribute: short route warns, then submits to the success screen', async ({ page }) => {
  await page.goto('/contribute');
  await page.getByLabel('Stop 1 name').fill('Yaba');
  await page.getByLabel('Stop 2 name').fill('Surulere');

  await page.getByRole('button', { name: 'Submit for review' }).click();
  // fewer than 4 stops → inline warning + Submit anyway
  const submitAnyway = page.getByRole('button', { name: 'Submit anyway' });
  await expect(submitAnyway).toBeVisible();
  await submitAnyway.click();

  await expect(page).toHaveURL(/\/contribute\/success/);
  await expect(page.getByText('in the queue')).toBeVisible();
});

test('saved shows the empty state when nothing is saved', async ({ page }) => {
  await page.goto('/saved');
  await expect(page.getByText('No saved routes yet')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse routes' })).toBeVisible();
});

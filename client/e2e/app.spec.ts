import { expect, test } from '@playwright/test';
import { mockApi } from './mock-api';

test('home works without an account', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Glass Summit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Popular series' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create a free account' })).toBeVisible();
});

test('private pages ask to sign in, then return to the page', async ({ page }) => {
  await mockApi(page);
  await page.goto('/stats');
  await expect(page).toHaveURL(/\/login\?next=%2Fstats/);

  await page.getByLabel('Email').fill('anna@example.org');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');

  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/stats$/);
  await expect(page.getByText('Time watched')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Account menu' })).toHaveText('A');
});

test('episode progress on a series', async ({ page }) => {
  const api = await mockApi(page, { signedIn: true });
  await page.goto('/tv/20');
  await expect(page.getByRole('heading', { name: 'Harbor Lights', level: 1 })).toBeVisible();
  await expect(page.getByText('0 of 3 aired episodes watched')).toBeVisible();

  const first = page.getByRole('button', { name: 'Mark watched: S1 · E1' });
  await first.click();
  await expect(page.getByRole('button', { name: 'Unmark S1 · E1' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('1 of 3 aired episodes watched')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Watching' })).toHaveAttribute('aria-pressed', 'true');
  expect(api.calls.some(c => c.method === 'PUT' && c.url.endsWith('/library/tv/20/episodes') && c.body.watched === true)).toBe(true);

  await page.getByRole('button', { name: 'Mark season watched' }).click();
  await expect(page.getByText('3 of 3 aired episodes watched')).toBeVisible();
  await expect(page.getByText('You finished Harbor Lights')).toBeVisible();
});

test('trailer opens and closes', async ({ page }) => {
  await mockApi(page, { signedIn: true });
  await page.goto('/tv/20');
  await page.getByRole('button', { name: 'Trailer' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/abc123/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('discover filters by genre through the URL', async ({ page }) => {
  await mockApi(page);
  await page.goto('/discover');
  await expect(page.getByRole('link', { name: 'Long Road' })).toBeVisible();
  await page.getByRole('button', { name: 'Comedy' }).click();
  await expect(page).toHaveURL(/genre=35/);
  await expect(page.getByRole('link', { name: 'Funny Thing' })).toBeVisible();
});

import { test, expect, Page } from '@playwright/test';
import { setupTrendingApiMocks } from './utils/trending-mocks';


function attachDebug(page: Page) {
  page.on('console', m => console.log(`[console:${m.type()}]`, m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  page.on('request', r => {
    const u = r.url();
    if (u.includes('/api/trending') || u.includes('/admin/trending/sync')) console.log('[request]', u);
  });
}

async function enableBypass(page: Page) {
  await page.context().addInitScript(() => {
    try {
      localStorage.setItem('E2E_DISABLE_AUTH', '1');
      document.cookie = 'access_token=e2e-token; Path=/;';
    } catch {}
  });
}

async function gotoTrend(page: Page) {
  const goto = async () =>
    page.goto('/trend', { waitUntil: 'domcontentloaded', timeout: 15000 });

  try {
    await goto();
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes('CONNECTION_REFUSED') || msg.includes('NS_ERROR_CONNECTION_REFUSED')) {
      await page.waitForTimeout(400);
      await goto();
    } else {
      throw e;
    }
  }
  await expect(page.getByRole('heading', { name: 'Trending Movies' }))
    .toBeVisible({ timeout: 10000 });
}

async function expectGridCount(page: Page, n: number, timeout = 10000) {
  await expect(page.locator('app-movie-card[role="listitem"]')).toHaveCount(n, { timeout });
}

async function muteImages(page: Page) {
  await page.route('**://image.tmdb.org/**', r => r.fulfill({ status: 204, headers: { 'content-type': 'image/jpeg' }, body: '' }));
}

test.describe('Trending', () => {
  test.beforeEach(async ({ page }) => {
    attachDebug(page);
    await enableBypass(page);
    await muteImages(page);
  });

  test('initial render (day, 20) shows heading, select value, Sync, and 20 cards', async ({ page }) => {
    const { calls } = setupTrendingApiMocks(page);

    await gotoTrend(page);
    await expect(page.getByRole('heading', { name: 'Trending Movies' })).toBeVisible();
    await expect(page.locator('.tw-select .mat-mdc-select-value')).toContainText('Today');
    await expect(page.getByRole('button', { name: 'Sync now' })).toBeVisible();
    await expectGridCount(page, 20);
    expect(calls.get.get('movie::day::20') ?? 0).toBe(1);
  });

  test('Load more → 40 then 50; new GETs each time', async ({ page }) => {
    const { calls } = setupTrendingApiMocks(page);

    await gotoTrend(page);
    await expectGridCount(page, 20);

    await page.getByRole('button', { name: 'Load more' }).click();
    await expectGridCount(page, 40);
    await page.getByRole('button', { name: 'Load more' }).click();
    await expectGridCount(page, 50);
    await expect(page.getByRole('button', { name: 'Load more' })).toBeHidden();

    expect(calls.get.get('movie::day::20') ?? 0).toBe(1);
    expect(calls.get.get('movie::day::40') ?? 0).toBe(1);
    expect(calls.get.get('movie::day::50') ?? 0).toBe(1);
  });

  test('switch to week resets to 20 and calls week endpoint', async ({ page }) => {
    const { calls } = setupTrendingApiMocks(page);

    await gotoTrend(page);
    await expectGridCount(page, 20);

    await page.locator('.tw-select .mat-mdc-select-trigger').click();
    await page.getByRole('option', { name: 'This week' }).click();
    await expect(page.locator('.tw-select .mat-mdc-select-value')).toContainText('This week');
    await expectGridCount(page, 20);
    expect(calls.get.get('movie::day::20') ?? 0).toBe(1);
    expect(calls.get.get('movie::week::20') ?? 0).toBe(1);
  });

//   test('Sync now invalidates cache and refetches current view', async ({ page }) => {
//     const { calls } = setupTrendingApiMocks(page);
//     await gotoTrend(page);
//     await expectGridCount(page, 20);
//     await page.getByRole('button', { name: 'Sync now' }).click();
//     await expectGridCount(page, 20);

//     expect(calls.sync).toBe(1);
//     expect(calls.get.get('movie::day::20') ?? 0).toBe(2);
//   });

  test('Empty state for week → "Fetch now" triggers sync and then items appear', async ({ page }) => {
    const { calls } = setupTrendingApiMocks(page, { emptyWeekInitially: true });

    await gotoTrend(page);
    await page.locator('.tw-select .mat-mdc-select-trigger').click();
    await page.getByRole('option', { name: 'This week' }).click();
    await expect(page.getByText('No trending cached yet for this window.')).toBeVisible();
    const fetchNow = page.getByRole('button', { name: 'Fetch now' });
    await expect(fetchNow).toBeVisible();
    await fetchNow.click();
    await expectGridCount(page, 20);
    expect(calls.sync).toBe(1);
    expect(calls.get.get('movie::week::20') ?? 0).toBeGreaterThanOrEqual(2);
  });

  test('Loading state appears briefly when API is slow', async ({ page }) => {
    setupTrendingApiMocks(page, { slowDayFirstLoadMs: 200 });
    await page.goto('/trend');
    await expect(page.getByText('Loading trending…')).toBeVisible({ timeout: 1000 });
    await expect(page.getByRole('heading', { name: 'Trending Movies' })).toBeVisible();
    await expectGridCount(page, 20);
  });
});

import { test, expect } from '@playwright/test';
import { primeAuth, setupHomeApiMocks } from './utils/api-mocks';

function attachDebugLogging(page: any) {
  page.on('console', (msg: any) => console.log(`[console:${msg.type()}]`, msg.text()));
  page.on('pageerror', (err: any) => console.log('[pageerror]', err.message));
  page.on('request', (req: any) => {
    const u = req.url();
    if (u.includes('/api/movies/')) console.log('[request]', u);
  });
}

async function enableBypassEarly(page: any) {
  await page.context().addInitScript(() => {
    try {
      localStorage.setItem('E2E_DISABLE_AUTH', '1');
      const keys = ['accessToken', 'auth.accessToken', 'access-token', 'token', 'jwt'];
      keys.forEach(k => {
        try {
          localStorage.setItem(k, 'e2e-token');
          sessionStorage.setItem(k, 'e2e-token');
        } catch {}
      });
      document.cookie = 'access_token=e2e-token; Path=/;';
    } catch {}
  });
  await primeAuth(page);
}

async function gotoHome(page: any) {
  await page.goto('/home');
  if (page.url().includes('/auth/login')) {
    await page.evaluate(() => {
      try {
        localStorage.setItem('E2E_DISABLE_AUTH', '1');
        document.cookie = 'access_token=e2e-token; Path=/;';
      } catch {}
    });
    await page.goto('/home');
  }

  const popularHeading = page.getByRole('heading', { name: 'Popular' });
  await expect(popularHeading).toBeVisible({ timeout: 10000 });
  await expect(page.locator('app-movie-card')).toHaveCount(8, { timeout: 10000 });
}

const RATING_REGEX = /^\d+([.,]\d)?$/;

test.describe('Home (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    attachDebugLogging(page);
    await enableBypassEarly(page);

    await page.route('**://image.tmdb.org/**', route =>
      route.fulfill({ status: 204, headers: { 'content-type': 'image/jpeg' }, body: '' })
    );
  });

  test('renders hero, meta & Watch + single discover/popular calls', async ({ page }) => {
    const { calls } = setupHomeApiMocks(page);

    await gotoHome(page);

    await expect(page.locator('.hero-title')).toHaveText('Hero Movie');
    await expect(page.locator('.pill.rating b')).toHaveText(RATING_REGEX);
    await expect(page.locator('.hero-meta')).toContainText('2021');
    await expect(page.locator('section.hero').getByRole('link', { name: 'Watch', exact: true })).toBeVisible();

    expect(calls.discover).toBe(1);
    expect(calls.popular.get(1) ?? 0).toBe(1);
  });

  test('popular grid paginates and appends, then hides at last page', async ({ page }) => {
    const { calls } = setupHomeApiMocks(page);
    await gotoHome(page);

    const gridCards = page.locator('app-movie-card');
    await expect(gridCards).toHaveCount(8);
    await expect(page.getByText('Page 1 / 3')).toBeVisible();

    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(gridCards).toHaveCount(16, { timeout: 10000 });
    await expect(page.getByText('Page 2 / 3')).toBeVisible();

    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(gridCards).toHaveCount(24, { timeout: 10000 });
    await expect(page.getByText('Page 3 / 3')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load more' })).toBeHidden();

    expect(calls.popular.get(1) ?? 0).toBe(1);
    expect(calls.popular.get(2) ?? 0).toBe(1);
    expect(calls.popular.get(3) ?? 0).toBe(1);
  });

  // test('navigates to details via hero Watch and hits details endpoint once', async ({ page }) => {
  //   const { calls } = setupHomeApiMocks(page);
  //   await gotoHome(page);
  //   const heroWatch = page.locator('section.hero').getByRole('link', { name: 'Watch', exact: true });
  //   await expect(heroWatch).toBeVisible();
  //   await heroWatch.click();
  //   await expect(page).toHaveURL(/\/movies\/\d+$/);
  //   await expect(page.locator('.hero-title')).toBeVisible();
  //   await expect.poll(() => calls.details, { timeout: 3000 }).toBe(1);
  // });


  test('hero image error hides image', async ({ page }) => {
    await page.route('**://image.tmdb.org/**', route => route.fulfill({ status: 404 }));
    setupHomeApiMocks(page);
    await gotoHome(page);
    const img = page.locator('.hero .hero-bg');
    await expect(img).toHaveAttribute('src', /image\.tmdb\.org\/t\/p\/w1280/);
    await expect.poll(async () => {
      return await img.evaluate(el => getComputedStyle(el as HTMLElement).visibility);
    }, { timeout: 3000, message: 'hero image should become hidden after error' }).toBe('hidden');
  });

  test('responsive grid columns: 4 → 3 → 2 → 1', async ({ page }) => {
    setupHomeApiMocks(page);
    await gotoHome(page);
    async function itemsPerRow() {
      const tops = await page.$$eval('app-movie-card', els => els.map(e => (e as HTMLElement).getBoundingClientRect().top));
      if (!tops.length) return 0;
      const first = tops[0];
      return tops.filter(t => Math.abs(t - first) < 0.75).length;
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect.poll(itemsPerRow, { timeout: 8000 }).toBe(4);
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect.poll(itemsPerRow, { timeout: 8000 }).toBe(3);
    await page.setViewportSize({ width: 800, height: 900 });
    await expect.poll(itemsPerRow, { timeout: 8000 }).toBe(2);
    await page.setViewportSize({ width: 500, height: 900 });
    await expect.poll(itemsPerRow, { timeout: 8000 }).toBe(1);
  });

  test('no duplicate network calls on initial render', async ({ page }) => {
    const { calls } = setupHomeApiMocks(page);
    await gotoHome(page);
    expect(calls.discover).toBe(1);
    expect(calls.popular.get(1) ?? 0).toBe(1);
  });
});

test('unauthenticated users are redirected to /auth/login when bypass is off', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('E2E_DISABLE_AUTH');
      ['accessToken', 'auth.accessToken', 'access-token', 'token', 'jwt'].forEach(k => {
        try {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        } catch {}
      });
      document.cookie = 'access_token=; Max-Age=0; Path=/;';
    } catch {}
  });
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth\/login$/);
});

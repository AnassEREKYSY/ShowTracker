import { test, expect } from '@playwright/test';
import { primeAuth } from './utils/api-mocks';

const PATH = '/watchlist/movies';
const API_WATCH = '**/api/watchlist/movie**';
const EXPECTED_BG = '#0b0b0b';

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) throw new Error(`Bad hex: ${hex}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function parseRgb(str: string): [number, number, number] | null {
  const m = str.replace(/\s+/g, '').match(/^rgba?\((\d+),(\d+),(\d+)(?:,(?:\d*\.?\d+))?\)$/i);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] as [number, number, number] : null;
}
function close(a: [number, number, number], b: [number, number, number], tol = 4) {
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;
}
async function enableAuthBypass(page: any) {
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

test.describe('Watchlist (UI checks)', () => {
  test.beforeEach(async ({ page }) => {
    await enableAuthBypass(page);

    await page.route('**://image.tmdb.org/**', r =>
      r.fulfill({ status: 204, headers: { 'content-type': 'image/jpeg' }, body: '' })
    );

    // Catch-all API safety nets so no real calls hit localhost:4000 during CSR
    await page.route('http://localhost:4000/api/**', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      }
    });
    await page.route('**/api/**', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      }
    });
  });

  test('URL, background color, and title + hint', async ({ page }) => {
    await page.route(API_WATCH, r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) })
    );

    await page.goto(PATH, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`${PATH.replace(/\//g, '\\/')}([?#].*)?$`));

    const h2 = page.getByRole('heading', { level: 2, name: /My Watchlist/i });
    await expect(h2).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Movies you saved to watch later.')).toBeVisible();

    const gotColor = await page.evaluate(() => {
      function firstRgbInString(s: string): string | null {
        const m = s && s.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:\d*\.?\d+))?\s*\)/);
        return m ? m[0] : null;
      }
      function nonTransparent(c: string | null | undefined) {
        if (!c) return false;
        const x = c.toLowerCase().replace(/\s+/g, '');
        return x !== 'transparent' && x !== 'rgba(0,0,0,0)';
      }
      let el: HTMLElement | null = document.elementFromPoint(1, 1) as HTMLElement | null;
      while (el) {
        const cs = getComputedStyle(el);
        if (nonTransparent(cs.backgroundColor)) return cs.backgroundColor;
        const img = cs.backgroundImage;
        if (img && img !== 'none') {
          const rgb = firstRgbInString(img);
          if (rgb && nonTransparent(rgb)) return rgb;
        }
        el = el.parentElement;
      }
      const body = getComputedStyle(document.body);
      if (nonTransparent(body.backgroundColor)) return body.backgroundColor;
      const html = getComputedStyle(document.documentElement);
      if (nonTransparent(html.backgroundColor)) return html.backgroundColor;
      const rgbFromBodyBg = firstRgbInString(body.backgroundImage || '');
      if (rgbFromBodyBg && nonTransparent(rgbFromBodyBg)) return rgbFromBodyBg;
      const rgbFromHtmlBg = firstRgbInString(html.backgroundImage || '');
      if (rgbFromHtmlBg && nonTransparent(rgbFromHtmlBg)) return rgbFromHtmlBg;
      return '';
    });

    expect(gotColor).not.toEqual('');
    const got = parseRgb(gotColor!);
    const exp = EXPECTED_BG.trim().startsWith('#') ? hexToRgb(EXPECTED_BG) : parseRgb(EXPECTED_BG)!;
    expect(got ? close(got, exp, 4) : false).toBeTruthy();
  });

  test('loading then empty state when API returns [] after delay', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>(r => (release = r));

    await page.route(API_WATCH, async route => {
      await gate;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    });

    await page.goto(PATH, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 2, name: /My Watchlist/i })).toBeVisible();
    await expect(page.getByText(/Loading your watchlist/i)).toBeVisible();

    release();

    await expect(page.getByText('Your watchlist is empty. Click the eye icon on any movie to add it.')).toBeVisible();
    await expect(page.getByRole('list')).toHaveCount(0);
  });

  test('empty state when API immediately returns []', async ({ page }) => {
    await page.route(API_WATCH, r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) })
    );

    await page.goto(PATH, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Your watchlist is empty. Click the eye icon on any movie to add it.')).toBeVisible();
    await expect(page.getByRole('list')).toHaveCount(0);
  });
});

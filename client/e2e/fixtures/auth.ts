import { Page, expect } from '@playwright/test';

/**
 * Auth mocks that keep the app unauthenticated until we submit the login form.
 */
export async function installAuthMocks(page: Page) {
  let loggedIn = false;

  await page.route('**/auth/me', async (route) => {
    if (loggedIn) {
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        json: { id: 'u1', email: 'user@example.com', createdAt: new Date().toISOString() },
      });
    }
    return route.fulfill({
      status: 401,
      headers: { 'content-type': 'application/json' },
      json: { error: 'unauthorized' },
    });
  });

  await page.route('**/auth/refresh', async (route) => {
    if (loggedIn) {
      return route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': 'accessToken=fake-token; Path=/; HttpOnly',
        },
        json: { ok: true },
      });
    }
    return route.fulfill({
      status: 401,
      headers: { 'content-type': 'application/json' },
      json: { error: 'unauthorized' },
    });
  });

  await page.route('**/auth/login', async (route) => {
    loggedIn = true;
    return route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'accessToken=fake-token; Path=/; HttpOnly',
      },
      json: { ok: true, userId: 'u1' },
    });
  });
}

/**
 * Robust UI login helper: works with placeholder or <mat-label>.
 */
export async function loginUI(
  page: Page,
  email = 'user@example.com',
  password = 'Password123!'
) {
  await page.goto('/auth/login');

  const emailInput = page.locator('input[formcontrolname="email"], input[type="email"]');
  const passwordInput = page.locator('input[formcontrolname="password"], input[type="password"]');

  await expect(emailInput.first()).toBeVisible();
  await expect(passwordInput.first()).toBeVisible();

  await emailInput.first().fill(email);
  await passwordInput.first().fill(password);

  const submit = page.getByRole('button', { name: /sign in|login|se connecter/i });
  await Promise.all([
    page.waitForURL((u) => /\/($|home|movies)/.test(u.pathname)),
    submit.click(),
  ]);
}

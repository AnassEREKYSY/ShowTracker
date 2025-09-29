import { Page } from '@playwright/test';

export async function mockLoginSuccess(page: Page) {
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      json: {
        accessToken: 'fake-jwt',
        user: { id: 1, username: 'demoUser', email: 'demo@example.com' },
      },
    });
  });

  await page.route('**/api/me', async route => {
    await route.fulfill({
      status: 200,
      json: {
        user: { id: 1, username: 'demoUser', email: 'demo@example.com' },
      },
    });
  });
}

export async function mockLoginFailure(page: Page) {
  await page.route('**/api/auth/login', route => {
    route.abort('failed');
  });
}


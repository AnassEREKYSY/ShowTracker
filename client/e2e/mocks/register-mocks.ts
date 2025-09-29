import { Page } from '@playwright/test';

export async function mockRegisterSuccess(page: Page) {
  await page.route('**/api/auth/register', async route => {
    const req = route.request();
    if (req.resourceType() === 'document' || req.method() !== 'POST') {
      return route.continue();
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'fake-jwt',
        user: { id: '123', email: 'demo@example.com' },
      }),
    });
  });
}

export async function mockRegisterFailure(page: Page) {
  await page.route('**/api/auth/register', async route => {
    const req = route.request();
    if (req.resourceType() === 'document' || req.method() !== 'POST') {
      return route.continue();
    }
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Email already exists' }),
    });
  });
}

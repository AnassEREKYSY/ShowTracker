import { test, expect } from '@playwright/test';

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
  });

  test('has correct URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/register$/);
  });

  test('renders title, inputs, primary button and helper link', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create account', level: 1 })).toBeVisible();

    const email   = page.locator('input[formcontrolname="email"]');
    const pwd     = page.locator('input[formcontrolname="password"]');
    const confirm = page.locator('input[formcontrolname="confirm"]');

    await expect(email).toBeVisible();
    await expect(pwd).toBeVisible();
    await expect(confirm).toBeVisible();
    await expect(page.locator('form input[type="email"], form input[type="password"]')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('.logo', { hasText: 'M' })).toBeVisible();
  });

  test('button disabled when form invalid or passwords mismatch; enabled when valid', async ({ page }) => {
    const email   = page.locator('input[formcontrolname="email"]');
    const pwd     = page.locator('input[formcontrolname="password"]');
    const confirm = page.locator('input[formcontrolname="confirm"]');
    const createBtn = page.getByRole('button', { name: 'Create account' });
    await expect(createBtn).toBeDisabled();
    await email.fill('john.doe@example.com');
    await pwd.fill('secret1');
    await confirm.fill('different');
    await email.blur(); await pwd.blur(); await confirm.blur();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await expect(createBtn).toBeDisabled();
    await confirm.clear();
    await confirm.fill('secret1');
    await confirm.blur();
    await expect(page.locator('mat-error')).toHaveCount(0);
    await expect(page.locator('form')).toHaveClass(/ng-valid/);
    await expect(createBtn).not.toHaveClass(/mat-mdc-button-disabled/);
    await expect.poll(async () => await createBtn.isEnabled()).toBe(true);
  });


  test('password visibility toggles work for both fields', async ({ page }) => {
    const pwd     = page.locator('input[formcontrolname="password"]');
    const confirm = page.locator('input[formcontrolname="confirm"]');

    await pwd.fill('secret1');
    await confirm.fill('secret1');

    const toggles = page.locator('button[aria-label="Toggle password"]');
    await expect(toggles).toHaveCount(2);
    await expect(pwd).toHaveAttribute('type', 'password');
    await toggles.nth(0).click();
    await expect(pwd).toHaveAttribute('type', 'text');
    await toggles.nth(0).click();
    await expect(pwd).toHaveAttribute('type', 'password');
    await expect(confirm).toHaveAttribute('type', 'password');
    await toggles.nth(1).click();
    await expect(confirm).toHaveAttribute('type', 'text');
    await toggles.nth(1).click();
    await expect(confirm).toHaveAttribute('type', 'password');
  });

  test('auth shell background is styled (not transparent; gradient/image allowed)', async ({ page }) => {
    const { bgColor, bgImage } = await page.locator('section.auth-shell').evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { bgColor: cs.backgroundColor, bgImage: cs.backgroundImage };
    });
    expect(bgColor === 'rgba(0, 0, 0, 0)').toBeFalsy();
    expect(typeof bgImage).toBe('string');
  });

  test('submits and navigates away on successful registration', async ({ page }) => {
    await page.route('**/auth/register', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    );

    const email   = page.locator('input[formcontrolname="email"]');
    const pwd     = page.locator('input[formcontrolname="password"]');
    const confirm = page.locator('input[formcontrolname="confirm"]');

    await email.fill('john.doe@example.com');
    await pwd.fill('secret1');
    await confirm.fill('secret1');

    await email.blur(); await pwd.blur(); await confirm.blur();

    const navPromise = page.waitForURL((u) => !/\/auth\/register$/.test(new URL(u).pathname));
    const reqPromise = page.waitForRequest('**/auth/register');

    await page.getByRole('button', { name: 'Create account' }).click();

    await reqPromise;
    await navPromise;
  });

});

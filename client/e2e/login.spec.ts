import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test('has correct URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('renders title, inputs, primary button and helper links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in', level: 1 })).toBeVisible();
    const email = page.getByPlaceholder('Email');
    const password = page.getByPlaceholder('Password');

    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(page.locator('form input')).toHaveCount(2);
    const signInBtn = page.getByRole('button', { name: 'Sign in' });
    await expect(signInBtn).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create new account' })).toBeVisible();
    await expect(page.locator('.logo', { hasText: 'M' })).toBeVisible();
  });

    test('button disabled when form invalid; enabled when valid', async ({ page }) => {
    const email = page.getByPlaceholder('Email');
    const password = page.getByPlaceholder('Password');
    const signInBtn = page.getByRole('button', { name: 'Sign in' });
    await expect(signInBtn).toBeDisabled();
    await email.fill('john.doe@example.com');
    await password.fill('secret1');
    await email.blur();
    await password.blur();
    await expect(page.locator('form')).toHaveClass(/ng-valid/, { timeout: 5000 });
    await expect(signInBtn).toBeEnabled();
    });

  test('password visibility toggle works', async ({ page }) => {
    const pwd = page.getByPlaceholder('Password');
    await pwd.fill('secret1');
    await expect(pwd).toHaveAttribute('type', 'password');
    const toggle = page.getByRole('button', { name: 'Toggle password' });
    await toggle.click();
    await expect(pwd).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(pwd).toHaveAttribute('type', 'password');
  });

  test('auth shell background is styled', async ({ page }) => {
    const { bgColor, bgImage } = await page.locator('section.auth-shell').evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { bgColor: cs.backgroundColor, bgImage: cs.backgroundImage };
    });
    expect(bgColor === 'rgba(0, 0, 0, 0)').toBeFalsy(); 
    expect(typeof bgImage).toBe('string');
  });
});

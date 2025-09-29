import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { RegisterPage } from '../pages/register.page';
import { mockRegisterFailure, mockRegisterSuccess } from '../mocks/register-mocks';

test.describe('Register flow', () => {
  test('Successful registration redirects to login', async ({ page, validUser }) => {
    await mockRegisterSuccess(page);

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(validUser.username, validUser.password, validUser.confirm);

    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('Failed registration shows error message', async ({ page, invalidUser }) => {
    await mockRegisterFailure(page);

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(invalidUser.username, invalidUser.password, invalidUser.confirm);

    await expect(registerPage.serverError).toHaveText(/Email already exists/);
  });

  test('Password mismatch shows validation error', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.email.fill('demo@example.com');
    await registerPage.password.fill('secret123');
    await registerPage.confirm.fill('other123');
    await registerPage.confirm.blur();

    await expect(registerPage.mismatchError).toHaveText(/Passwords do not match/i, { timeout: 10_000 });
  });
});

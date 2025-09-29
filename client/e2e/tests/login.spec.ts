import { expect } from '@playwright/test';
import { test, } from '../fixtures/auth.fixture';
import { mockLoginFailure, mockLoginSuccess } from '../mocks/login-mocks';
import { LoginPage } from '../pages/login.page';

test.describe('Login flow', () => {
    test('Successful login redirects to home', async ({ page, validUser }) => {
        await mockLoginSuccess(page);
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.loginSuccess(validUser.username, validUser.password);
        await page.waitForURL(/home/, { timeout: 10_000 });
        await expect(page).toHaveURL(/home/);
    });


    test('Failed login shows error message', async ({ page, invalidUser }) => {
        await mockLoginFailure(page);
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.loginFailure(invalidUser.username, invalidUser.password);
        
    });

});

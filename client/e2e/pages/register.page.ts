import { Page, Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly confirm: Locator;
  readonly submitBtn: Locator;
  readonly serverError: Locator;
  readonly mismatchError: Locator;

  constructor(private page: Page) {
    this.email = page.getByTestId('reg-email');
    this.password = page.getByTestId('reg-password');
    this.confirm = page.getByTestId('reg-confirm');
    this.submitBtn = page.getByTestId('reg-submit');
    this.serverError = page.getByTestId('reg-server-error');
    this.mismatchError = page.getByTestId('reg-mismatch-error');
  }

  async goto() {
    await this.page.goto('/auth/register');
    await expect(this.page).toHaveURL(/\/auth\/register/);
    await this.page.getByTestId('reg-form').waitFor({ state: 'visible', timeout: 20_000 });
  }

  async register(email: string, password: string, confirm: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.confirm.fill(confirm);
    await this.confirm.blur();
    await expect(this.submitBtn).toBeEnabled({ timeout: 5_000 });
    await this.submitBtn.click();
  }
}

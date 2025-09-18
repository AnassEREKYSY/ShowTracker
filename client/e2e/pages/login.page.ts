import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginBtn: Locator;
  readonly errorMsg: Locator;

  constructor(private page: Page) {
    this.username = page.locator('#login');
    this.password = page.locator('#login_password');
    this.loginBtn = page.getByRole('button', { name: /sign in/i });
    this.errorMsg = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/auth/login');
    await this.username.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async loginSuccess(email: string, password: string) {
    await this.username.fill(email);
    await this.password.fill(password);
    await this.loginBtn.click();
  }

  async loginFailure(email: string, password: string) {
    await this.username.fill(email);
    await this.password.fill(password);
    await this.loginBtn.click();
  }
}

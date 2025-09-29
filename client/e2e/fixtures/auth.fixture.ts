import { test as base } from '@playwright/test';

export const test = base.extend<{
  validUser: { username: string; password: string; confirm: string };
  invalidUser: { username: string; password: string; confirm: string  };
}>({
    validUser: async ({}, use) => {
        await use({ username: 'demo@example.com', password: 'demoPass123', confirm: 'demoPass123' });
    },
    invalidUser: async ({}, use) => {
        await use({ username: 'wrong@example.com', password: 'badPass', confirm: 'demoPass123' });
    },
});

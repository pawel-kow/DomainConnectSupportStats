import { test as base, expect } from '@playwright/test';

/**
 * Every page test fails on an uncaught page error or a console error. A test that provokes an
 * error on purpose sets `expectErrors` to true.
 */
export const test = base.extend<{ expectErrors: boolean; consoleErrors: string[] }>({
  expectErrors: [false, { option: true }],
  consoleErrors: [
    async ({ page, expectErrors }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`console: ${m.text()}`);
      });
      await use(errors);
      if (!expectErrors) expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const PAGES = [
  'index',
  'dns-providers',
  'stacks',
  'service-providers',
  'templates',
  'dns-provider',
  'stack',
  'service-provider',
  'template',
] as const;

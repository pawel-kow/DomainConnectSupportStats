import { test as base, expect } from '@playwright/test';

/** The deploy writes `registry/registry.json`; the example registry has none, so it is routed. */
export const REGISTRY_SOURCE = { repository: 'Domain-Connect/DnsProviders', commit: 'abc1234' };

/**
 * Every page test fails on an uncaught page error or a console error. A test that provokes an
 * error on purpose sets `expectErrors` to true.
 */
export const test = base.extend<{
  expectErrors: boolean;
  consoleErrors: string[];
  registrySource: void;
}>({
  expectErrors: [false, { option: true }],
  registrySource: [
    async ({ page }, use) => {
      await page.route('**/registry/registry.json', (route) =>
        route.fulfill({ json: REGISTRY_SOURCE }),
      );
      await use();
    },
    { auto: true },
  ],
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

import { expect, test } from './fixtures';

function section(page: import('@playwright/test').Page, heading: string) {
  return page.locator('section', { has: page.getByRole('heading', { name: heading }) });
}

test.describe('DNS provider card (dns-provider.html)', () => {
  test('shows the provider, its stack and its support', async ({ page }) => {
    await page.goto('dns-provider.html?id=1');
    await expect(page.getByTestId('card-title')).toContainText('Cloudflare');
    await expect(page).toHaveTitle(/^Cloudflare - DNS provider/);
    await expect(page.getByTestId('stack-link')).toHaveAttribute(
      'href',
      './stack.html?id=cloudflare.com',
    );
    const headline = page.getByTestId('headline');
    await expect(headline).toContainText('of 6 template versions (66.7%)');
    await expect(headline).toContainText('33.3% of 12,000 scanned domains');
    await expect(headline).toContainText('#1');
    await expect(page.getByTestId('provider-record')).toContainText('ns2.example.net');
  });

  test('links supported templates to their template and service provider cards', async ({
    page,
  }) => {
    await page.goto('dns-provider.html?id=1');
    const templates = section(page, 'Supported templates (current state)');
    await expect(templates.locator('tbody tr')).toHaveCount(3);
    await expect(templates.getByRole('link', { name: 'Example Website' })).toHaveAttribute(
      'href',
      './template.html?spid=exampleservice.domainconnect.org&sid=template1',
    );
    await templates.getByRole('link', { name: 'Acme Mail Inc.' }).first().click();
    await expect(page).toHaveURL(/service-provider\.html\?id=mail\.acme\.example$/);
  });

  test('draws both charts over time and lists their data', async ({ page }) => {
    await page.goto('dns-provider.html?id=1');
    await expect(page.getByRole('img', { name: 'Supported templates over time' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Domain share over time' })).toBeVisible();
    await expect(section(page, 'Domain share over time').locator('tbody tr')).toHaveCount(3);
    await expect(section(page, 'Supported templates over time').locator('tbody tr')).toHaveCount(3);
  });

  test('shows no stack link without a stack', async ({ page }) => {
    await page.goto('dns-provider.html?id=4');
    await expect(page.getByTestId('card-title')).toContainText('No stack');
    await expect(page.getByTestId('stack-link')).toHaveCount(0);
    await expect(section(page, 'Supported templates (current state)')).toContainText(
      'No template supported in the latest probes',
    );
  });

  test('shows an unranked provider as unknown, not zero', async ({ page }) => {
    await page.goto('dns-provider.html?id=6');
    const rank = page.getByTestId('headline').locator('.stat-card', { hasText: 'Rank' });
    await expect(rank.locator('.stat-value')).toHaveText('–');
  });

  for (const query of ['', '?id=', '?id=abc']) {
    test(`shows "not found" for dns-provider.html${query}`, async ({ page }) => {
      await page.goto(`dns-provider.html${query}`);
      const notFound = page.getByTestId('not-found');
      await expect(notFound).toBeVisible();
      await notFound.getByRole('link', { name: /DNS providers/ }).click();
      await expect(page).toHaveURL(/dns-providers\.html$/);
    });
  }

  test.describe('unknown id', () => {
    // The browser logs the card's 404 as a console error.
    test.use({ expectErrors: true });

    test('shows "not found" for an id without a card', async ({ page, consoleErrors }) => {
      await page.goto('dns-provider.html?id=999');
      await expect(page.getByTestId('not-found')).toContainText('DNS provider 999');
      expect(consoleErrors.every((e) => e.includes('404'))).toBe(true);
    });
  });

  test('fits the screen without horizontal page scroll', async ({ page }) => {
    await page.goto('dns-provider.html?id=1');
    await expect(page.getByTestId('headline')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

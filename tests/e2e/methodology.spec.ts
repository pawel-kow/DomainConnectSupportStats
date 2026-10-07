import { expect, test } from './fixtures';

test.describe('Methodology (methodology.html)', () => {
  test('shows the release facts and the methodology document', async ({ page }) => {
    await page.goto('methodology.html');
    const facts = page.getByTestId('release-facts');
    await expect(facts).toContainText('.com, .org');
    await expect(facts).toContainText('240K');
    await expect(facts).toContainText('random sample of 5.0%');
    await expect(facts).toContainText('12K');
    await expect(page.getByRole('heading', { name: '8. Limitations' })).toBeVisible();
    await expect(page.locator('[id="22-census-and-probability-sample"]')).toHaveText(
      '2.2 Census and probability sample',
    );
    await expect(page.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      /DomainConnectSupportStats\/issues\/new$/,
    );
  });

  test('scrolls to a linked section', async ({ page }) => {
    await page.goto('methodology.html#61-status-values');
    await expect(page.locator('[id="61-status-values"]')).toBeInViewport();
  });

  test('is linked from the footer', async ({ page }) => {
    await page.goto('index.html');
    await page.getByTestId('methodology-link').click();
    await expect(page).toHaveURL(/methodology\.html$/);
  });

  for (const path of [
    'index.html',
    'dns-providers.html',
    'stacks.html',
    'service-providers.html',
    'templates.html',
  ]) {
    test(`caveats of ${path} link to existing sections`, async ({ page }) => {
      await page.goto(path);
      const caveats = page.locator('a[href*="methodology.html#"]');
      await expect(caveats.first()).toBeVisible();
      const anchors = await caveats.evaluateAll((as) =>
        as.map((a) => new URL((a as HTMLAnchorElement).href).hash.slice(1)),
      );
      await page.goto('methodology.html');
      for (const id of anchors) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    });
  }
});

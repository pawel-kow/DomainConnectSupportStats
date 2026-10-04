import { expect, test } from './fixtures';

test.describe('overview (index.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
  });

  test('shows the release in the header', async ({ page }) => {
    await expect(page.getByTestId('generated-at')).toHaveText('01-10-2026 00:00 UTC');
    await expect(page.getByTestId('share-import')).toHaveText(
      'scan completed 01-06-2026 07:00 UTC',
    );
  });

  test('shows the latest values as headline numbers', async ({ page }) => {
    const headline = page.getByTestId('headline');
    await expect(headline).toContainText('60.1%');
    await expect(headline).toContainText('7,210 of 12,000 scanned domains');
    await expect(headline).toContainText('Supporting DNS providers');
    await expect(headline).toContainText('of 6');
  });

  test('draws the support-over-time chart', async ({ page }) => {
    const chart = page.getByRole('img', { name: /adoption per import and support per full sweep/ });
    await expect(chart).toBeVisible();
    await expect(chart.locator('canvas')).toBeVisible();
  });

  test('shows no internal id', async ({ page }) => {
    await expect(page.getByTestId('headline')).toContainText('scan of 01-06-2026');
    for (const header of ['IMPORT', 'SWEEP']) {
      await expect(page.getByRole('columnheader', { name: header, exact: true })).toHaveCount(0);
    }
    await expect(page.locator('main')).not.toContainText('1780272000');
  });

  test('lists every import and every full sweep', async ({ page }) => {
    const adoption = page.locator('section', {
      has: page.getByRole('heading', { name: 'Adoption per import' }),
    });
    await expect(adoption.locator('tbody tr')).toHaveCount(3);
    const ecosystem = page.locator('section', {
      has: page.getByRole('heading', { name: 'Support ecosystem per full sweep' }),
    });
    await expect(ecosystem.locator('tbody tr')).toHaveCount(3);
  });

  test('fits the screen without horizontal page scroll', async ({ page }) => {
    await expect(page.getByTestId('headline')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('data unavailable', () => {
  test.use({ expectErrors: true });

  test('shows an error state instead of a blank page', async ({ page }) => {
    await page.route('**/data/manifest.json', (route) =>
      route.fulfill({ status: 503, body: 'down' }),
    );
    await page.goto('index.html');
    await expect(page.getByTestId('load-error')).toContainText('Could not load the data');
  });
});

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
    await expect(headline).toContainText('7,210 of 12K scanned domains');
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
    await expect(page.locator('main')).not.toContainText('1780272000');
  });

  test('shows the chart without data tables', async ({ page }) => {
    const chart = page.getByRole('img', { name: /adoption per import/ });
    await expect(chart).toBeVisible();
    await expect(page.locator('section', { has: chart }).locator('table')).toHaveCount(0);
  });

  test('shows the most improved top 5 and links to the leaderboards', async ({ page }) => {
    const board = page.getByTestId('overview-improved');
    await expect(board.locator('tbody tr')).toHaveCount(1);
    await expect(board).toContainText(/IONOS.*\+1/s);
    await board.getByRole('link', { name: 'All leaderboards' }).click();
    await expect(page).toHaveURL(/leaderboards\.html$/);
  });

  test('says that no DNS provider started supporting in the last 30 days', async ({ page }) => {
    await expect(page.getByTestId('overview-new')).toContainText(
      'No DNS provider started supporting Domain Connect in the last 30 days',
    );
  });

  test('fits the screen without horizontal page scroll', async ({ page }) => {
    await expect(page.getByTestId('headline')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test('lists every new supporting DNS provider of the last 30 days', async ({ page }) => {
  await page.route('**/data/derived/leaderboards.json', (route) =>
    route.fulfill({
      json: {
        generated_at: '2026-10-01T00:00:00Z',
        first_sweep: { sweep_id: 1, started_at: '2026-03-02 02:00:00' },
        first_support: [
          {
            dns_provider_id: 5,
            sweep_id: 9,
            started_at: '2026-09-28 02:00:00',
            supported_templates: 1,
          },
          {
            dns_provider_id: 2,
            sweep_id: 8,
            started_at: '2026-09-23 02:00:00',
            supported_templates: 1,
          },
        ],
      },
    }),
  );
  await page.goto('index.html');
  const rows = page.getByTestId('new-supporters').locator('tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText(/IONOS.*28-09-2026/s);
  await rows.nth(1).getByRole('link', { name: 'Plesk' }).first().click();
  await expect(page).toHaveURL(/dns-provider\.html\?id=2$/);
});

test('shows a derived data error in its panel only', async ({ page }) => {
  await page.route('**/data/derived/leaderboards.json', (route) =>
    route.fulfill({
      json: { generated_at: '2027-01-01T00:00:00Z', first_sweep: null, first_support: [] },
    }),
  );
  await page.goto('index.html');
  await expect(page.getByTestId('overview-new').getByTestId('load-error')).toBeVisible();
  await expect(page.getByTestId('overview-improved').locator('tbody tr')).toHaveCount(1);
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

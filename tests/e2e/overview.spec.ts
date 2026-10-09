import { expect, expectLoadError, test } from './fixtures';

test.describe('overview (index.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
  });

  test('shows the latest values as headline numbers', async ({ page }) => {
    const headline = page.getByTestId('headline');
    await expect(headline).toContainText('60.1%');
    await expect(headline).toContainText('7,210 of 12K scanned domains');
    await expect(headline).toContainText(/6\s*Discovered DNS providers\s*with DC TXT record/);
    await expect(headline).toContainText(/4\s*Supporting DNS providers\s*with at least 1 template/);
    await expect(headline).toContainText(
      /1\.5\s*Templates per domain\s*weighted by reach, sweep of 02-09-2026/,
    );
    await expect(headline).not.toContainText('Supported pairs');
  });

  test('draws four charts, the first-scan shadow on all but adoption', async ({ page }) => {
    const charts: [string, string][] = [
      ['support-history', 'DC adoption'],
      ['supporting-dns-providers', 'Supporting DNS providers'],
      ['supported-templates', 'Supported templates'],
      ['ecosystem-growth', 'Ecosystem growth'],
    ];
    for (const [id, title] of charts) {
      const panel = page.locator(`#${id}`);
      await expect(panel.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(panel.locator('canvas')).toBeVisible();
      await expect(panel.getByTestId('before-scans')).toHaveCount(id === 'support-history' ? 0 : 1);
    }
  });

  test('lays the charts out 2×2 on desktop, one column on a phone', async ({ page, isMobile }) => {
    await expect(page.locator('#ecosystem-growth canvas')).toBeVisible();
    const [adoption, providers, templates] = await Promise.all(
      ['support-history', 'supporting-dns-providers', 'supported-templates'].map((id) =>
        page.locator(`#${id}`).boundingBox(),
      ),
    );
    if (isMobile) {
      expect(providers!.y).toBeGreaterThan(adoption!.y);
    } else {
      expect(providers!.y).toBe(adoption!.y);
      expect(templates!.x).toBe(adoption!.x);
      expect(templates!.y).toBeGreaterThan(adoption!.y);
    }
  });

  test('shows no internal id', async ({ page }) => {
    await expect(page.locator('main')).not.toContainText('1780272000');
  });

  test('shows the chart without data tables', async ({ page }) => {
    await expect(page.locator('#ecosystem-growth canvas')).toBeVisible();
    await expect(page.locator('.charts table')).toHaveCount(0);
  });

  test('shows the most improved DNS providers, top 5, and links to the leaderboards', async ({
    page,
  }) => {
    const board = page.getByTestId('overview-improved');
    await expect(board.locator('tbody tr')).toHaveCount(1);
    await expect(board).toContainText(/IONOS.*domainconnect\.ionos\.example.*\+1/s);
    await expect(board.locator('tbody tr td:nth-child(2) > a')).toHaveAttribute(
      'href',
      './dns-provider.html?id=5',
    );
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

test('shows "not available" in a panel whose data failed, without details', async ({ page }) => {
  await page.route('**/data/derived/leaderboards.json', (route) =>
    route.fulfill({
      json: { generated_at: '2027-01-01T00:00:00Z', first_sweep: null, first_support: [] },
    }),
  );
  await page.goto('index.html');
  await expect(page.getByTestId('overview-new').getByTestId('unavailable')).toHaveText(
    'Not available at the moment',
  );
  await expect(page.locator('main')).not.toContainText('leaderboards.json');
  await expect(page.getByTestId('overview-improved').locator('tbody tr')).toHaveCount(1);
});

test('shows "not available" for ecosystem growth when its derived data failed', async ({
  page,
}) => {
  await page.route('**/data/derived/ecosystem.json', (route) =>
    route.fulfill({ json: { generated_at: '2027-01-01T00:00:00Z', ecosystem: [] } }),
  );
  await page.goto('index.html');
  await expect(page.locator('#ecosystem-growth').getByTestId('unavailable')).toBeVisible();
  await expect(page.locator('#supported-templates canvas')).toBeVisible();
});

test.describe('data unavailable', () => {
  test.use({ expectErrors: true });

  test('shows an error state instead of a blank page', async ({ page }) => {
    await page.route('**/data/manifest.json', (route) =>
      route.fulfill({ status: 503, body: 'down' }),
    );
    await page.goto('index.html');
    await expect(page.getByTestId('load-error')).toContainText('Could not load the data');
    await expectLoadError(page);
  });

  test('asks for a reload when a file is from another release', async ({ page }) => {
    await page.route('**/data/overview.json', async (route) => {
      const json = await (await route.fetch()).json();
      await route.fulfill({ json: { ...json, generated_at: '2000-01-01T00:00:00Z' } });
    });
    await page.goto('index.html');
    await expectLoadError(page, 'The data was just updated');
    await expect(page.getByTestId('load-error')).toContainText('Reload the page.');
    // The annotation's own request may still be in the handler when the test ends.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});

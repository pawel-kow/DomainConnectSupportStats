import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

function names(page: Page, board: string) {
  return page.getByTestId(board).locator('tbody tr td:nth-child(2) > a');
}

/** Serves `leaderboards.json` with the given first supports. */
async function routeDerived(page: Page, firstSupport: [number, string][]) {
  await page.route('**/data/derived/leaderboards.json', (route) =>
    route.fulfill({
      json: {
        generated_at: '2026-10-01T00:00:00Z',
        first_sweep: { sweep_id: 1, started_at: '2026-03-02 02:00:00' },
        first_support: firstSupport.map(([id, at], i) => ({
          dns_provider_id: id,
          sweep_id: 10 - i,
          started_at: at,
          supported_templates: 1,
        })),
      },
    }),
  );
}

test.describe('Leaderboards (leaderboards.html)', () => {
  test('ranks stacks and DNS providers by templates and by domains reached', async ({ page }) => {
    await page.goto('leaderboards.html');
    await expect(names(page, 'board-templates')).toHaveText(['Cloudflare', 'IONOS', 'Plesk']);
    const plesk = page.getByTestId('board-templates').locator('tbody tr', { hasText: 'Plesk' });
    await expect(plesk).toContainText('Stack · 2 deployments');
    await expect(plesk.locator('td').first()).toHaveText('3');
    // Plesk reaches only its supporting deployment's 900 domains.
    await expect(page.getByTestId('board-domains').locator('tbody tr').nth(2)).toContainText(
      /Plesk.*900/s,
    );
  });

  test('links a stack row to the stack card', async ({ page }) => {
    await page.goto('leaderboards.html');
    await names(page, 'board-templates').filter({ hasText: 'Plesk' }).click();
    await expect(page).toHaveURL(/stack\.html\?id=plesk\.com$/);
    await expect(page.getByTestId('card-title')).toContainText('Plesk');
  });

  test('switches the most improved window in place, keeping ?window= in the URL', async ({
    page,
  }) => {
    await page.route('**/data/dns-providers.json', async (route) => {
      const file = await (await route.fetch()).json();
      const row = file.tables.dns_providers.rows.find(
        (r: Record<string, unknown>) => r.name === 'Small Registrar',
      );
      row.supported_templates_change_90d = 3;
      await route.fulfill({ json: file });
    });
    await page.goto('leaderboards.html');
    const board = page.getByTestId('board-improved');
    const sweep = board.getByRole('button', { name: 'Since the previous sweep' });
    const days = board.getByRole('button', { name: 'Over about 90 days' });
    await expect(names(page, 'board-improved')).toHaveText(['IONOS']);
    await expect(sweep).toHaveAttribute('aria-pressed', 'true');

    await days.scrollIntoViewIfNeeded();
    await page.evaluate(() => Object.assign(window, { notReloaded: true }));
    const scrollY = await page.evaluate(() => window.scrollY);
    await days.click();
    await expect(page).toHaveURL(/leaderboards\.html\?window=90d$/);
    await expect(days).toHaveAttribute('aria-pressed', 'true');
    await expect(names(page, 'board-improved')).toHaveText(['Small Registrar', 'IONOS']);
    expect(await page.evaluate(() => 'notReloaded' in window)).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);

    await sweep.click();
    await expect(page).toHaveURL(/leaderboards\.html$/);
    await expect(names(page, 'board-improved')).toHaveText(['IONOS']);
  });

  test('opens the window of ?window=90d', async ({ page }) => {
    await page.goto('leaderboards.html?window=90d');
    await expect(
      page.getByTestId('board-improved').getByRole('button', { name: 'Over about 90 days' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('says when a window is not measured yet', async ({ page }) => {
    await page.route('**/data/{dns-providers,stacks}.json', async (route) => {
      const file = await (await route.fetch()).json();
      for (const table of Object.values(file.tables) as { rows: Record<string, unknown>[] }[])
        for (const row of table.rows) row.supported_templates_change_90d = null;
      await route.fulfill({ json: file });
    });
    await page.goto('leaderboards.html?window=90d');
    await expect(page.getByTestId('board-improved')).toContainText(
      'Not measured yet: the history does not reach back about 90 days',
    );
  });

  test('ranks templates and service providers by reach', async ({ page }) => {
    await page.goto('leaderboards.html');
    await expect(names(page, 'board-template-reach')).toHaveText([
      'Example Website',
      'Domain Verification',
      'Acme Mail',
    ]);
    await expect(names(page, 'board-service-provider-reach')).toHaveText([
      'Acme Mail Inc.',
      'Example Service',
    ]);
    await names(page, 'board-template-reach').first().click();
    await expect(page).toHaveURL(
      /template\.html\?spid=exampleservice\.domainconnect\.org&sid=template1$/,
    );
  });

  test('says that no DNS provider started supporting in the last 30 days', async ({ page }) => {
    await page.goto('leaderboards.html');
    await expect(page.getByTestId('new-supporters')).toContainText(
      'No DNS provider started supporting Domain Connect in the last 30 days',
    );
  });

  test('lists new supporting DNS providers with their stack, newest first', async ({ page }) => {
    await routeDerived(page, [
      [4, '2026-09-29 02:00:00'],
      [5, '2026-09-25 02:00:00'],
      [3, '2026-08-01 02:00:00'],
    ]);
    await page.goto('leaderboards.html');
    const table = page.getByTestId('new-supporters');
    await expect(table.locator('tbody tr')).toHaveCount(2);
    await expect(table.locator('tbody tr').first()).toContainText(/Small Registrar.*29-09-2026/s);
    await expect(table.locator('tbody tr').nth(1)).toContainText(/IONOS.*Stack IONOS.*25-09-2026/s);
  });

  test('fits the screen without horizontal page scroll', async ({ page }) => {
    await page.goto('leaderboards.html');
    await expect(page.getByTestId('board-templates')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('derived data unavailable', () => {
  test('shows the boards and an error in place of the new supporters', async ({ page }) => {
    await page.route('**/data/derived/leaderboards.json', (route) =>
      route.fulfill({
        json: { generated_at: '2027-01-01T00:00:00Z', first_sweep: null, first_support: [] },
      }),
    );
    await page.goto('leaderboards.html');
    await expect(names(page, 'board-templates')).toHaveCount(3);
    await expect(page.getByTestId('board-new').getByTestId('load-error')).toBeVisible();
  });
});

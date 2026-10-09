import { expect, test } from './fixtures';

const CARD = 'service-provider.html?id=mail.acme.example';
const CHART = 'Supporting DNS providers per template over time';

function section(page: import('@playwright/test').Page, heading: string | RegExp) {
  return page.locator('section', { has: page.getByRole('heading', { name: heading }) });
}

test.describe('Service provider card (service-provider.html)', () => {
  test('shows the service provider, its templates and its reach', async ({ page }) => {
    await page.goto(CARD);
    const title = page.getByTestId('card-title');
    await expect(title.getByRole('heading')).toHaveText('Acme Mail Inc.');
    await expect(title).toContainText('mail.acme.example');
    await expect(page).toHaveTitle(/^Acme Mail Inc\. - Service provider/);
    const headline = page.getByTestId('headline');
    await expect(headline).toContainText(/2\s*Templates/);
    await expect(headline).toContainText('2 supported by a DNS provider');
    await expect(headline).toContainText(/3\s*Supporting DNS providers/);
    await expect(
      headline.getByTitle('6,900 of 12K scanned domains in the partial scan of 01-06-2026'),
    ).toHaveText('57.5%');
    const record = page.getByTestId('service-provider-record');
    await expect(record).toContainText('02-02-2020');
  });

  test('links templates to their cards', async ({ page }) => {
    await page.goto(CARD);
    const templates = section(page, 'Templates (current state)');
    await expect(templates.locator('tbody tr')).toHaveCount(2);
    await expect(templates.locator('tbody tr').first()).toContainText('verify');
    await templates.getByRole('link', { name: 'Domain Verification' }).click();
    await expect(page).toHaveURL(/template\.html\?spid=mail\.acme\.example&sid=verify$/);
  });

  test('links its templates in the templates list', async ({ page }) => {
    await page.goto(CARD);
    await page.getByTestId('templates-link').click();
    await expect(page).toHaveURL(/templates\.html\?spid=mail\.acme\.example$/);
  });

  test('draws a line per template and turns lines on and off', async ({ page }) => {
    await page.goto(CARD);
    await expect(page.getByRole('img', { name: CHART })).toBeVisible();
    const picker = page.getByTestId('template-picker');
    await expect(picker).toContainText('Templates shown (2 of 2)');
    await picker.getByRole('checkbox', { name: 'Acme Mail' }).uncheck();
    await expect(picker).toContainText('Templates shown (1 of 2)');
    await picker.getByRole('checkbox', { name: 'Domain Verification' }).uncheck();
    await expect(section(page, CHART)).toContainText('No template chosen');
    await picker.getByRole('checkbox', { name: 'Acme Mail' }).check();
    await expect(page.getByRole('img', { name: CHART })).toBeVisible();
  });

  test('shows a service provider without name or support', async ({ page }) => {
    await page.goto('service-provider.html?id=unnamed.example');
    await expect(page.getByTestId('card-title').getByRole('heading')).toHaveText('unnamed.example');
    await expect(page.getByTestId('headline')).toContainText('0 supported by a DNS provider');
    // One template: no picker.
    await expect(page.getByRole('img', { name: CHART })).toBeVisible();
    await expect(page.getByTestId('template-picker')).toHaveCount(0);
  });

  test('orders the card: title, headline, chart, templates, details, notes', async ({ page }) => {
    await page.goto(CARD);
    const blocks = [
      page.getByTestId('card-title'),
      page.getByTestId('headline'),
      section(page, CHART),
      section(page, 'Templates (current state)'),
      section(page, 'Details'),
      section(page, 'Notes'),
    ];
    for (const block of blocks) await expect(block).toBeVisible();
    await expect(page.getByRole('img', { name: CHART })).toBeVisible();
    const ys = await Promise.all(blocks.map(async (b) => (await b.boundingBox())!.y));
    expect(ys).toEqual([...ys].sort((x, y) => x - y));
  });

  for (const query of ['', '?id=']) {
    test(`shows "not found" for service-provider.html${query}`, async ({ page }) => {
      await page.goto(`service-provider.html${query}`);
      const notFound = page.getByTestId('not-found');
      await expect(notFound).toBeVisible();
      await notFound.getByRole('link', { name: /Service providers/ }).click();
      await expect(page).toHaveURL(/service-providers\.html$/);
    });
  }

  test.describe('failures', () => {
    test.use({ expectErrors: true });

    test('shows "not found" for a service provider without a card', async ({
      page,
      consoleErrors,
    }) => {
      await page.goto('service-provider.html?id=nope.example');
      await expect(page.getByTestId('not-found')).toContainText('This service provider');
      expect(consoleErrors.every((e) => e.includes('404'))).toBe(true);
    });
  });

  test('fits the screen without horizontal scroll at phone width', async ({ page }, testInfo) => {
    await page.goto(CARD);
    await expect(page.getByTestId('headline')).toBeVisible();
    if (testInfo.project.name === 'mobile') {
      await expect(
        section(page, 'Templates (current state)').locator('thead th:visible'),
      ).toHaveText([/TEMPLATE/, /SUPPORTING/, /REACH %/]);
    }
    for (const wrapper of await page.locator('.table-wrapper').all()) {
      expect(await wrapper.evaluate((w) => w.scrollWidth - w.clientWidth)).toBeLessThanOrEqual(0);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

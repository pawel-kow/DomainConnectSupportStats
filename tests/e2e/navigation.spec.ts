import { expect, PAGES, test } from './fixtures';

for (const name of PAGES) {
  test(`${name}.html renders the shared header and navigation`, async ({ page }) => {
    await page.goto(`${name}.html`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Domain Connect Support' }),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveCount(6);
    await expect(page.getByTestId('registry-commit')).toHaveText('Registry abc1234');
  });
}

test('main navigation links are plain page links', async ({ page }) => {
  await page.goto('index.html');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await nav.getByRole('link', { name: 'Stacks' }).click();
  await expect(page).toHaveURL(/\/stacks\.html$/);
  await expect(nav.getByRole('link', { name: 'Stacks' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'Overview' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
});

const RELEASE =
  'Data generated 01-10-2026 00:00 UTC · Domain figures: scan completed 01-06-2026 07:00 UTC ' +
  '(12K domains scanned) · Support figures: sweep started 02-09-2026 02:00 UTC';

for (const url of [
  'index.html',
  'dns-providers.html',
  'stacks.html',
  'service-providers.html',
  'templates.html',
  'dns-provider.html?id=3',
  'stack.html?id=cloudflare.com',
  'service-provider.html?id=mail.acme.example',
  'template.html?spid=unnamed.example&sid=x',
  'leaderboards.html',
]) {
  test(`${url} annotates its data at the end of the page`, async ({ page }) => {
    await page.goto(url);
    const note = page.getByTestId('data-annotation');
    await expect(note).toHaveText(`${RELEASE} · Methodology`);
    await expect(note.getByRole('link', { name: 'Methodology' })).toHaveAttribute(
      'href',
      './methodology.html',
    );
    const main = await page.getByRole('main').boundingBox();
    const box = await note.boundingBox();
    expect(box!.y + box!.height).toBeGreaterThan(main!.y + main!.height - 80);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
}

test('methodology.html has no data annotation', async ({ page }) => {
  await page.goto('methodology.html');
  await expect(page.getByTestId('release-facts')).toBeVisible();
  await expect(page.getByTestId('data-annotation')).toHaveCount(0);
});

test.describe('a card that is not found', () => {
  test.use({ expectErrors: true });

  test('annotates no sweep', async ({ page }) => {
    await page.goto('dns-provider.html?id=999');
    await expect(page.getByTestId('support-sweep')).toHaveText('–');
  });
});

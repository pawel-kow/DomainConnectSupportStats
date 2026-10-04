import { expect, PAGES, test } from './fixtures';

for (const name of PAGES) {
  test(`${name}.html renders the shared header and navigation`, async ({ page }) => {
    await page.goto(`${name}.html`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Domain Connect Support' }),
    ).toBeVisible();
    await expect(page.getByTestId('generated-at')).toHaveText('01-10-2026 00:00 UTC');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveCount(5);
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

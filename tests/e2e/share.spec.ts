import { resolve } from 'node:path';
import { expect, test } from './fixtures';

const LOGO = resolve(import.meta.dirname, '../../public/assets/DomainConnectBlackSmall.png');

/** Each page with the anchors of its chart and table panels, in page order. */
const PANELS: [string, string[]][] = [
  ['index.html', ['support-history', 'new-supporting', 'most-improved']],
  ['dns-providers.html', ['dns-providers']],
  ['stacks.html', ['stacks']],
  ['service-providers.html', ['service-providers']],
  ['templates.html', ['templates']],
  ['dns-provider.html?id=1', ['domain-share-history', 'support-history', 'templates', 'urls']],
  ['stack.html?id=plesk.com', ['domain-share-history', 'deployments', 'coverage']],
  ['service-provider.html?id=mail.acme.example', ['support-history', 'templates']],
  ['template.html?spid=mail.acme.example&sid=mail', ['support-history', 'supporters', 'records']],
  [
    'leaderboards.html',
    [
      'most-templates',
      'most-domains',
      'most-improved',
      'new-supporting',
      'template-reach',
      'service-provider-reach',
    ],
  ],
];

test.describe('Share panels', () => {
  // Template logos load from the service provider's host; the example hosts do not exist.
  test.beforeEach(async ({ page }) => {
    await page.route('https://*/logo.png', (route) => route.fulfill({ path: LOGO }));
  });

  for (const [url, anchors] of PANELS) {
    test(`${url} has an anchor and a share icon on every chart and table panel`, async ({
      page,
    }) => {
      await page.goto(url);
      const panels = page.locator('section.panel:has(> .title-row)');
      await expect(panels).toHaveCount(anchors.length);
      for (const [i, anchor] of anchors.entries()) {
        const panel = panels.nth(i);
        await expect(panel).toHaveAttribute('id', anchor);
        await expect(panel.locator('.title-row > a.anchor')).toHaveAttribute('href', `#${anchor}`);
        await expect(panel.getByRole('button', { name: /^Share: / })).toBeVisible();
      }
    });
  }

  test('every page has link-preview tags with an absolute image', async ({ page }) => {
    for (const url of [...PANELS.map(([u]) => u), 'methodology.html']) {
      await page.goto(url);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /\S/);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        /\S/,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
      const image = page.locator('meta[property="og:image"]');
      await expect(image).toHaveAttribute(
        'content',
        /^http:\/\/localhost:\d+\/assets\/DomainConnectSquareBlack\.png$/,
      );
      expect((await page.request.get((await image.getAttribute('content'))!)).ok()).toBe(true);
    }
  });

  test('a link with an anchor scrolls to the panel once loaded and highlights it', async ({
    page,
  }) => {
    await page.goto('leaderboards.html#service-provider-reach');
    const panel = page.locator('#service-provider-reach');
    await expect(panel).toBeInViewport();
    await expect(panel).toHaveClass(/highlighted/);
    await expect(panel).not.toHaveClass(/highlighted/, { timeout: 5000 });
  });

  test('an unknown anchor opens the page normally', async ({ page }) => {
    await page.goto('stack.html?id=plesk.com#no-such-panel');
    await expect(page.locator('#coverage')).toBeVisible();
    await expect(page.locator('.highlighted')).toHaveCount(0);
  });

  test('copy link puts the page URL with its query and the anchor on the clipboard', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('stack.html?id=plesk.com');
    const panel = page.locator('#coverage');
    await panel.getByRole('button', { name: /^Share: / }).click();
    await panel.getByRole('menuitem', { name: 'Copy link' }).click();
    await expect(panel.getByRole('status')).toHaveText('Link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `${baseURL}stack.html?id=plesk.com#coverage`,
    );
    await expect(panel.getByRole('status')).toHaveText('');
  });

  test('copy link uses the configured share base URL', async ({ page, context }) => {
    await page.route('**/config.js', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: "window.DC_STATS_CONFIG = { shareBaseUrl: 'https://stats.example.org/site' };",
      }),
    );
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('stack.html?id=plesk.com');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://stats.example.org/site/assets/DomainConnectSquareBlack.png',
    );
    const panel = page.locator('#coverage');
    await panel.getByRole('button', { name: /^Share: / }).click();
    await panel.getByRole('menuitem', { name: 'Copy link' }).click();
    await expect(panel.getByRole('status')).toHaveText('Link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'https://stats.example.org/site/stack.html?id=plesk.com#coverage',
    );
  });

  test('the menu works with the keyboard and fits the screen', async ({ page }) => {
    await page.goto('template.html?spid=mail.acme.example&sid=mail');
    const panel = page.locator('#records');
    const toggle = panel.getByRole('button', { name: /^Share: / });
    await toggle.focus();
    await page.keyboard.press('Enter');
    const menu = panel.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(panel.getByRole('menuitem', { name: 'Bluesky' })).toBeFocused();
    const box = (await menu.boundingBox())!;
    const width = page.viewportSize()!.width;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('ArrowDown');
    await expect(panel.getByRole('menuitem', { name: 'Mastodon (mastodon.social)' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(panel.getByLabel('Mastodon instance')).toBeFocused();
    await page.keyboard.type('.example');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    const bluesky = new URL(
      (await panel.getByRole('menuitem', { name: 'Bluesky' }).getAttribute('href'))!,
    );
    expect(bluesky.host).toBe('bsky.app');
    expect(bluesky.searchParams.get('text')).toMatch(
      /^Records – .+ – Domain Connect support statistics http:\/\/localhost:\d+\/template\.html\?spid=mail\.acme\.example&sid=mail#records$/,
    );
  });

  test('list pages keep the anchor while the filter rewrites the URL', async ({ page }) => {
    await page.goto('dns-providers.html#dns-providers');
    await page.getByRole('searchbox').fill('ionos');
    await expect(page).toHaveURL(/dns-providers\.html\?q=ionos#dns-providers$/);
  });
});

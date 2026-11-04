import { expect, test, type Page } from '@playwright/test';

const ROUTES = [
  { path: '/', h1: /Build your empire/i },
  { path: '/how-to-play', h1: /fourteen steps/i },
  { path: '/rulebook', h1: /complete rules/i },
  { path: '/map-generator', h1: /every map tells/i },
  { path: '/components', h1: /built to be held/i },
  { path: '/print-export', h1: /bring it to the table/i },
  { path: '/3d-printing', h1: /print the pieces/i },
];

const WIDTHS = [375, 768, 1024, 1440, 1920];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

test.describe('every route', () => {
  for (const r of ROUTES) {
    test(`${r.path} renders without errors`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(r.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(r.h1);
      await expect(page).toHaveTitle(/Tax the Richmen/);
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
      expect(errors).toEqual([]);
    });
  }

  test('deep links work on a hard refresh (SPA fallback)', async ({ page }) => {
    await page.goto('/rulebook#steel-vault');
    await expect(page.locator('#steel-vault')).toBeVisible();
  });
});

test.describe('responsive layout', () => {
  test.skip(({ isMobile }) => isMobile, 'widths are set explicitly');
  for (const width of WIDTHS)
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const r of ROUTES) {
        await page.goto(r.path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${r.path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
});

test.describe('navigation', () => {
  test('mobile menu navigates between pages', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: /Map Generator/ }).click();
    await expect(page).toHaveURL(/\/map-generator$/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('skip link moves focus to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard test');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe('rulebook', () => {
  test('search narrows the rules and highlights matches', async ({ page }) => {
    await page.goto('/rulebook');
    await page.getByLabel('Search the rules').fill('toll');
    await expect(page.locator('main mark').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Toll access' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Starting order' })).toHaveCount(0);
  });
});

test.describe('map generator', () => {
  test('a seed link reproduces the same board', async ({ page }) => {
    await page.goto('/map-generator?mode=balanced&seed=PLAYWRIGHT-1');
    const score = await page.getByTestId('map-score').first().textContent();
    const terrain = await page.locator('[role="application"] [data-slot]').evaluateAll((els) => els.map((e) => e.getAttribute('data-terrain')).join());
    await page.goto('/map-generator?mode=balanced&seed=PLAYWRIGHT-1');
    await expect(page.getByTestId('map-score').first()).toHaveText(score!);
    expect(await page.locator('[role="application"] [data-slot]').evaluateAll((els) => els.map((e) => e.getAttribute('data-terrain')).join())).toBe(terrain);
  });

  test('dragging one tile onto another swaps them', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse drag');
    await page.goto('/map-generator');
    await page.getByRole('button', { name: 'Reset to Classic' }).click();
    const a = page.locator('[role="application"] [data-slot="0"]');
    const b = page.locator('[role="application"] [data-slot="4"]');
    const before = [await a.getAttribute('data-terrain'), await b.getAttribute('data-terrain')];
    expect(before[0]).not.toBe(before[1]);
    const ba = (await a.boundingBox())!;
    const bb = (await b.boundingBox())!;
    await page.mouse.move(ba.x + ba.width / 2, ba.y + ba.height / 2);
    await page.mouse.down();
    await page.mouse.move(ba.x + ba.width / 2 + 20, ba.y + ba.height / 2 + 20, { steps: 4 });
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(a).toHaveAttribute('data-terrain', before[1]!);
    await expect(b).toHaveAttribute('data-terrain', before[0]!);
  });

  test('exports PNG, SVG and JSON files', async ({ page }) => {
    await page.goto('/map-generator');
    await page.getByRole('tab', { name: 'Save & export' }).click();
    for (const [label, ext] of [
      ['PNG', 'png'],
      ['SVG', 'svg'],
      ['Export JSON', 'json'],
    ] as const) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: label, exact: true }).click()]);
      expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${ext}$`));
    }
  });
});

test.describe('print & export hub', () => {
  test('downloads the rulebook and Steel Card PDFs', async ({ page }) => {
    await page.goto('/print-export#rulebook-pdf');
    const [rulebook] = await Promise.all([page.waitForEvent('download'), page.locator('#rulebook-pdf').getByRole('button', { name: 'Download rulebook PDF' }).click()]);
    expect(rulebook.suggestedFilename()).toBe('tax-the-richmen-complete-rulebook.pdf');
    const [cards] = await Promise.all([page.waitForEvent('download', { timeout: 30_000 }), page.locator('#steel-cards').getByRole('button', { name: 'Download PDF' }).click()]);
    expect(cards.suggestedFilename()).toBe('tax-the-richmen-steel-card-deck.pdf');
  });
});

test.describe('components', () => {
  test('all component images load and the lightbox opens', async ({ page }) => {
    await page.goto('/components');
    const imgs = page.locator('main article img');
    await expect(imgs.first()).toBeVisible();
    for (const img of await imgs.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    await page.getByRole('button', { name: /Enlarge Tax Inspector/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

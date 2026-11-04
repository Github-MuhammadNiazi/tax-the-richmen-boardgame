import { test } from '@playwright/test';

/** Visual QA capture, opt-in: QA_SCREENS=1 npx playwright test screenshots --project=desktop */
const ROUTES = ['/', '/how-to-play', '/rulebook', '/map-generator', '/components', '/print-export', '/3d-printing'];
const WIDTHS = [375, 768, 1024, 1440, 1920];

test.skip(!process.env.QA_SCREENS, 'set QA_SCREENS=1 to capture screenshots');

for (const width of WIDTHS)
  test(`capture ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    for (const route of ROUTES) {
      await page.goto(route);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.evaluate(async () => {
        for (const img of document.images) img.loading = 'eager';
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
        const loads = [...document.images].map((img) => (img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r)))));
        await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 5000))]);
      });
      await page.waitForTimeout(400);
      const name = route === '/' ? 'home' : route.slice(1);
      await page.screenshot({ path: `test-results/qa/${width}-${name}.png`, fullPage: true, animations: 'disabled' });
    }
  });

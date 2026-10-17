/**
 * Runs the Jasmine suite from `test/index.html` in each browser engine
 * configured in `playwright.config.js`.
 */
const { test, expect } = require('@playwright/test');

test('Jasmine suite passes', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/test/index.html');
  await page.waitForFunction(() => window.jsApiReporter && window.jsApiReporter.finished);

  const specs = await page.evaluate(() => window.jsApiReporter.specs());
  const failed = specs
    .filter(spec => spec.status === 'failed')
    .map(spec => `${spec.fullName}: ${spec.failedExpectations.map(e => e.message).join('; ')}`);

  expect(pageErrors).toEqual([]);
  expect(failed).toEqual([]);
  expect(specs.length).toBeGreaterThan(0);
});

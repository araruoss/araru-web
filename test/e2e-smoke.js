import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.E2E_BASE_URL;
if (!baseUrl) throw new Error('E2E_BASE_URL is required and must point to a running Araru Web stack.');

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true
});

try {
  const viewports = [
    { width: 375, height: 667, name: '375px Mobile SE' },
    { width: 768, height: 1024, name: '768px Tablet iPad' },
    { width: 1024, height: 768, name: '1024px Desktop' },
    { width: 1440, height: 900, name: '1440px Wide Screen' }
  ];

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, hasTouch: viewport.width < 1024 });
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    assert.ok(response?.ok(), `Araru Web failed at ${viewport.width}px.`);
    await page.locator('body').waitFor();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(hasOverflow, false, `Horizontal overflow at ${viewport.width}px.`);
    await page.close();
  }
  console.log('Araru Web E2E smoke passed against the independent full stack across all responsive viewports.');
} finally {
  await browser.close();
}

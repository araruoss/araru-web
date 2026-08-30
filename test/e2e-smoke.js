import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const baseUrl = process.env.E2E_BASE_URL;
if (!baseUrl) throw new Error('E2E_BASE_URL is required and must point to a running Araru Web stack.');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport, hasTouch: viewport.width < 1024 });
    const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
    assert.ok(response?.ok(), `Araru Web failed at ${viewport.width}px.`);
    await page.locator('body').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `Horizontal overflow at ${viewport.width}px.`);
    await page.close();
  }
  console.log('Araru Web E2E smoke passed against the independent full stack.');
} finally { await browser.close(); }

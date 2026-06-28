import { chromium } from '@playwright/test';

const baseURL = process.argv[2];
if (!baseURL) {
  console.error('Usage: node scripts/smoke.mjs <baseURL>');
  process.exit(1);
}

const routesToVisit = ['/', '/about', '/privacy-policy', '/terms', '/articles', '/search', '/section/arabic'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
const consoleIssues = [];
const requestIssues = [];
const pageErrors = [];
const pageSummaries = [];

page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) {
    consoleIssues.push({ type: msg.type(), text: msg.text() });
  }
});

page.on('pageerror', (error) => {
  pageErrors.push({ message: error.message, stack: error.stack });
});

page.on('response', async (response) => {
  const status = response.status();
  if (status >= 400) {
    const url = response.url();
    requestIssues.push({ status, url });
  }
});

const normalizeUrl = (route) => {
  if (route === '/') return baseURL;
  return new URL(route.replace(/^\//, ''), baseURL.endsWith('/') ? baseURL : `${baseURL}/`).toString();
};

for (const route of routesToVisit) {
  const url = normalizeUrl(route);
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const title = await page.title();
  const bodyText = (await page.locator('body').innerText()).slice(0, 300).replace(/\s+/g, ' ').trim();
  const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0;
  pageSummaries.push({ route, status: response?.status() ?? null, title, hasSkeleton, bodyText });
}

await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);
const articleLinks = page.locator('a[href*="/article/"]');
if ((await articleLinks.count()) > 0) {
  const href = await articleLinks.first().getAttribute('href');
  await articleLinks.first().click();
  await page.waitForTimeout(3500);
  pageSummaries.push({
    route: href || page.url(),
    status: null,
    title: await page.title(),
    hasSkeleton: (await page.locator('.animate-pulse').count()) > 0,
    bodyText: (await page.locator('body').innerText()).slice(0, 300).replace(/\s+/g, ' ').trim(),
  });
}

console.log(JSON.stringify({ baseURL, pageSummaries, consoleIssues, pageErrors, requestIssues }, null, 2));
await browser.close();

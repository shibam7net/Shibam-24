import { chromium } from '@playwright/test';

const baseURL = process.argv[2];
if (!baseURL) {
  console.error('Usage: node scripts/userflows.mjs <baseURL>');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
const result = { baseURL, checks: [], pageErrors: [], consoleIssues: [], requestIssues: [] };

page.on('pageerror', (error) => result.pageErrors.push(error.message));
page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) result.consoleIssues.push(`${msg.type()}: ${msg.text()}`);
});
page.on('response', (response) => {
  if (response.status() >= 400) result.requestIssues.push(`${response.status()} ${response.url()}`);
});

const wait = () => page.waitForTimeout(3000);

await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await wait();
result.checks.push({ flow: 'home-load', title: await page.title(), hasRootText: (await page.locator('body').innerText()).includes('شبام24') });

const worldButton = page.getByRole('button', { name: /World News/i });
if (await worldButton.count()) {
  await worldButton.click();
  await wait();
  const body = await page.locator('body').innerText();
  result.checks.push({ flow: 'world-tab', url: page.url(), hasWorldLabel: body.includes('World News') });
}

await page.goto(new URL('search?q=بوتين', baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await wait();
const searchBody = await page.locator('body').innerText();
result.checks.push({
  flow: 'search-putin',
  title: await page.title(),
  queryRendered: searchBody.includes('نتائج البحث') && searchBody.includes('بوتين'),
  returnedState: searchBody.includes('لا توجد نتائج') || searchBody.includes('تم العثور')
});

await page.goto(new URL('articles', baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await wait();
result.checks.push({
  flow: 'articles-page',
  title: await page.title(),
  hasHeading: (await page.locator('body').innerText()).includes('مقالات')
});

await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await wait();
const articleLink = page.locator('a[href*="/article/"]').first();
if (await articleLink.count()) {
  await articleLink.click();
  await wait();
  const articleBody = await page.locator('body').innerText();
  result.checks.push({
    flow: 'article-open',
    url: page.url(),
    title: await page.title(),
    hasBackButton: articleBody.includes('رجوع') || articleBody.includes('Back'),
    hasSourceOrCategory: articleBody.includes('RT عربي') || articleBody.includes('سياسة') || articleBody.includes('أخبار')
  });
}

console.log(JSON.stringify(result, null, 2));
await browser.close();

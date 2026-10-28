// Optional browser checks: PLAYWRIGHT_MODULE can point to an installed playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.SITE_URL || 'http://127.0.0.1:5178/';
const root = path.resolve(__dirname, '..');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'prices-snapshot.json'), 'utf8'));
const pages = JSON.parse(fs.readFileSync(path.join(root, 'site-manifest.json'), 'utf8')).pages;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const errors = [], failures = [];
  let failFeed = false;
  let requests = 0;
  const feed = { status: 'ok', fetchedAt: snapshot.fetchedAt, metals: structuredClone(snapshot.metals), products: structuredClone(snapshot.products) };
  await context.route('**/api/prices', async route => {
    requests++;
    if (failFeed) return route.fulfill({ status: 503, body: 'Unavailable', headers: { 'access-control-allow-origin': '*' } });
    assert.equal(route.request().headers().authorization, undefined);
    await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify(feed) });
  });
  context.on('page', page => {
    page.on('pageerror', error => errors.push(page.url() + ': ' + error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) failures.push(response.url()); });
  });
  for (const width of [320, 390, 768, 1440]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 844 });
    for (const filename of pages) {
      await page.goto(base + filename, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').count(), 1, filename);
      const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(overflow.scroll <= width, JSON.stringify({ filename, ...overflow }));
      if (filename.startsWith('cennik-') || filename.startsWith('monety-') || filename.startsWith('sztabki-') || filename === 'cennik.html') {
        await page.waitForSelector('#price-status[data-state="ready"]');
        const metal = await page.locator('[data-price-metal]').getAttribute('data-price-metal');
        assert.equal(await page.locator('#price-rows tr').count(), Object.keys(feed.metals[metal].purities).length);
        assert.equal(await page.getByText('Brylanty', { exact: true }).count(), 0);
        assert.equal(await page.locator('.metal-tabs a').count(), 4);
        assert.match(await page.locator('.jewelry-premium').innerText(), /płacimy więcej niż za złom/);
      }
    }
    if (width === 390) {
      await page.goto(base);
      assert.equal(await page.locator('#main-navigation').isVisible(), false);
      await page.locator('.mobile-navigation summary').click();
      await page.locator('#main-navigation').getByRole('link', { name: 'Cennik skupu', exact: true }).click();
      await page.waitForURL('**/cennik.html');
      assert.equal(await page.locator('[data-price-metal]').getAttribute('data-price-metal'), 'gold');
      assert.equal(await page.locator('.metal-tabs').isVisible(), true);
      await page.getByRole('navigation', { name: 'Wybierz metal' }).getByRole('link', { name: 'Srebro', exact: true }).click();
      await page.waitForURL('**/cennik-srebra.html');
      await page.getByRole('navigation', { name: 'Wybierz metal' }).getByRole('link', { name: 'Pallad', exact: true }).click();
      await page.waitForURL('**/cennik-palladu.html');
      await page.waitForSelector('#price-status[data-state="ready"]');
      feed.metals.palladium.purities['999'].price = 123.45;
      await page.getByRole('button', { name: 'Odśwież cennik' }).click();
      await page.waitForFunction(() => document.querySelector('#price-rows').textContent.includes('123,45 zł/g'));
      failFeed = true;
      await page.getByRole('button', { name: 'Odśwież cennik' }).click();
      await page.waitForSelector('#price-status[data-state="error"]');
      assert.match(await page.locator('#price-rows').innerText(), /123,45 zł\/g/);
      failFeed = false;
      await page.goto(base + 'kalkulator-oplat.html');
      assert.equal(await page.locator('[name="fee-period"][value="15"]').isChecked(), true);
      assert.match(await page.locator('#fee-cost').innerText(), /25,00/);
      await page.locator('[name="fee-period"][value="30"]').check();
      assert.match(await page.locator('#fee-cost').innerText(), /50,00/);
      await page.locator('#fee-amount').fill('2000');
      assert.match(await page.locator('#fee-total').innerText(), /2\s?100,00/);
      await page.goto(base + 'blog.html');
      await page.locator('.read-article[href="blog/co-przyjmujemy-do-lombardu.html"]').click();
      await page.waitForURL('**/blog/co-przyjmujemy-do-lombardu.html');
      assert.ok((await page.locator('.article-body').innerText()).length > 1000);
    }
    await page.close();
    console.log('PASS all pages, width', width);
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await noJS.newPage();
  await page.goto(base + 'cennik-zlota.html');
  assert.equal(await page.locator('#main-navigation').isVisible(), false);
  await page.locator('.mobile-navigation summary').click();
  assert.equal(await page.locator('#main-navigation').isVisible(), true);
  await page.locator('.mobile-navigation summary').click();
  await page.getByRole('navigation', { name: 'Wybierz metal' }).getByRole('link', { name: 'Platyna', exact: true }).click();
  await page.waitForURL('**/cennik-platyny.html');
  assert.equal(await page.locator('#price-rows tr').count(), 4);
  await noJS.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  assert.ok(requests > 0);
  await browser.close();
  console.log('PASS navigation, 4 feeds, panel price change, failure fallback, calculator, blog, no-JS menu and metal selection.');
})().catch(error => { console.error(error); process.exit(1); });

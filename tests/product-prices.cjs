const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.SITE_URL||'http://127.0.0.1:5198/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
 const snapshot=JSON.parse(fs.readFileSync(path.join(__dirname,'../prices-snapshot.json'),'utf8'));
 const feed={...structuredClone(snapshot),status:'ok'};
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:844}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/prices',r=>r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify(feed)}));
  await page.goto(base+'kontakt.html');assert.equal(await page.locator('form').count(),0);
  await page.goto(base+'cennik.html');await page.waitForSelector('#price-status[data-state="ready"]');
  assert.equal(await page.locator('.kind-unavailable[aria-disabled="true"]').count(),2);
  assert.equal(await page.locator('.kind-tabs a[data-kind="coins"]').count(),0);
  assert.ok(await page.locator('.purity-view').isVisible());
  for(const file of ['monety-zlote.html','sztabki-zlote.html']){
   await page.goto(base+file);await page.waitForSelector('#price-status[data-state="ready"]',{state:'attached'});
   assert.match(await page.locator('.price-coming-soon').innerText(),/W budowie/);
   assert.equal(await page.locator('.product-price-row').count(),0);
   assert.equal(await page.locator('.products-view').isVisible(),false);
   assert.equal(await page.locator('#refresh-prices').isVisible(),false);
   assert.equal(await page.locator('.reading-section').isVisible(),false);
  }
  await page.goto(base+'monety-srebrne.html');await page.waitForSelector('#price-status[data-state="ready"]');
  assert.equal(await page.locator('.product-price-row').count(),Math.min(12,snapshot.products.silverCoins.length));
  await page.locator('#product-search').fill('nieistniejacy-produkt');assert.equal(await page.locator('.product-price-row').count(),0);
  await page.locator('.kind-tabs a[data-kind="bars"]').click();await page.waitForURL('**/sztabki-srebrne.html');
  assert.equal(await page.locator('.product-price-row').count(),Math.min(12,snapshot.products.silverBars.length));
  await page.locator('.metal-tabs a[data-metal="gold"]').click();await page.waitForURL('**/cennik-zlota.html');
  assert.ok(await page.locator('.purity-view').isVisible());assert.equal(await page.locator('.kind-unavailable').count(),2);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  await page.close();console.log('PASS disabled gold products, active silver products and no form:',width);
 }
 const page=await browser.newPage({javaScriptEnabled:false});
 await page.goto(base+'monety-zlote.html');assert.ok(await page.locator('.price-coming-soon').isVisible());assert.equal(await page.locator('.product-price-row').count(),0);assert.equal(await page.locator('.reading-section').isVisible(),false);
 await page.goto(base+'sztabki-srebrne.html');assert.ok(await page.locator('.product-price-row').count()>0);
 console.log('PASS no-JS gold notice and silver price list');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

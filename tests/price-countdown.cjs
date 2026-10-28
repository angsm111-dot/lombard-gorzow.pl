const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:5205/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const feed={...structuredClone(require('../prices-snapshot.json')),status:'ok'};
  let requests=0,fail=false;
  await page.clock.install({time:new Date('2026-10-28T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-28T12:00:01Z'));
  await page.route('**/api/prices',route=>{
   requests++;
   return fail?route.fulfill({status:503,body:'Unavailable',headers:{'access-control-allow-origin':'*'}}):route.fulfill({json:feed,headers:{'access-control-allow-origin':'*'}});
  });
  await page.goto(base+'cennik.html');await page.waitForSelector('#price-status[data-state="ready"]');
  assert.equal(await page.locator('#price-countdown-value').innerText(),'05:00');assert.equal(requests,1);
  await page.clock.fastForward(299000);
  assert.equal(await page.locator('#price-countdown-value').innerText(),'00:01');assert.equal(requests,1);
  feed.metals.gold.purities['585'].price+=7.11;
  await page.clock.fastForward(1000);
  await page.waitForFunction(()=>document.querySelector('#price-countdown-value').textContent==='05:00');assert.equal(requests,2);
  const updated=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(feed.metals.gold.purities['585'].price);
  assert.ok((await page.locator('#price-rows').innerText()).includes(updated));
  await page.locator('#price-metal-select').selectOption('silver');
  assert.match(await page.locator('#purity-caption-label').innerText(),/srebra/);assert.ok(await page.locator('.price-countdown').isVisible());
  await page.clock.fastForward(10000);assert.equal(await page.locator('#price-countdown-value').innerText(),'04:50');
  await page.locator('#refresh-prices').click();await page.waitForFunction(()=>document.querySelector('#price-countdown-value').textContent==='05:00');assert.equal(requests,3);
  const before=await page.locator('#price-rows').innerText();fail=true;
  await page.locator('#refresh-prices').click();await page.waitForSelector('#price-status[data-state="error"]');
  assert.equal(await page.locator('#price-countdown-label').textContent(),'Ponowna próba za');assert.equal(await page.locator('#price-rows').innerText(),before);
  assert.equal(await page.locator('#price-countdown-value').innerText(),'05:00');
  const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(base+'cennik.html');
  assert.equal(await noJS.locator('.price-countdown').isVisible(),false);assert.ok(await noJS.locator('.purity-view').isVisible());
  console.log('PASS countdown, exact five-minute refresh, new prices, manual reset, metal switch, honest failure state and no-JS fallback.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});

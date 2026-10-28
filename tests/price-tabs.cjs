const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.SITE_URL||'http://127.0.0.1:5180/';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const snapshot=JSON.parse(fs.readFileSync(path.join(__dirname,'../prices-snapshot.json'),'utf8'));
 for(const width of [320,390,768,1440]){
  const p=await b.newPage({viewport:{width,height:844}});let documentRequests=0;
  p.on('request',r=>{if(r.isNavigationRequest())documentRequests++});
  await p.route('**/api/prices',r=>r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({...snapshot,status:'ok'})}));
  await p.goto(base+'cennik.html',{waitUntil:'networkidle'});
  const note=await p.locator('.jewelry-premium').boundingBox();assert.ok(note.height<115,'compact notice '+width);
  await p.locator('.price-controls').evaluate(e=>window.scrollTo({top:e.getBoundingClientRect().top+scrollY-40,behavior:'instant'}));
  for(const [label,key,rows] of [['Srebro','silver',9],['Platyna','platinum',4],['Pallad','palladium',4],['Złoto','gold',9]]){
   const before=await p.locator('.price-controls').boundingBox();
   await p.locator('#price-metal-select').selectOption(key);
   await p.waitForFunction(k=>document.querySelector('[data-price-metal]').dataset.priceMetal===k,key);
   await p.waitForTimeout(70);
   const after=await p.locator('.price-controls').boundingBox();
   assert.ok(Math.abs(before.y-after.y)<2,JSON.stringify({width,label,before:before.y,after:after.y}));
   assert.equal(await p.locator('#price-rows tr').count(),rows);
   assert.equal(await p.locator('#price-metal-select').inputValue(),key);
   assert.equal(documentRequests,1,'no page reload');
   assert.ok(await p.evaluate(()=>scrollY)>0,'not scrolled to top');
  }
  await p.goBack();assert.equal(await p.locator('[data-price-metal]').getAttribute('data-price-metal'),'palladium');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.close();console.log('PASS stationary tabs',width);
 }
 const p=await b.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await p.goto(base+'cennik.html');await p.getByRole('link',{name:'Srebro',exact:true}).click();await p.waitForURL('**/cennik-srebra.html');assert.equal(await p.locator('#price-rows tr').count(),9);
 await b.close();console.log('PASS compact notice, in-place changes, prices, scroll stability, back button and no-JS links.');
})().catch(e=>{console.error(e);process.exit(1)});

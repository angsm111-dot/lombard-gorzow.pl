const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://127.0.0.1:5207/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const width of [320,390,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.goto(base+'kalkulator-oplat.html');
   const slider=page.locator('#fee-range'),amount=page.locator('#fee-amount');
   await slider.focus();await page.keyboard.press('Home');assert.equal(await amount.inputValue(),'50');
   await page.keyboard.press('ArrowRight');assert.equal(await amount.inputValue(),'100');
   await page.keyboard.press('ArrowRight');assert.equal(await amount.inputValue(),'200');
   await slider.evaluate(e=>{e.value=20;e.dispatchEvent(new Event('input',{bubbles:true}))});
   assert.equal(await amount.inputValue(),'2000');await page.keyboard.press('ArrowRight');assert.equal(await amount.inputValue(),'2200');
   await page.keyboard.press('ArrowLeft');assert.equal(await amount.inputValue(),'2000');
   await slider.evaluate(e=>{e.value=60;e.dispatchEvent(new Event('input',{bubbles:true}))});
   assert.equal(await amount.inputValue(),'10000');await page.keyboard.press('ArrowRight');assert.equal(await amount.inputValue(),'11000');
   await page.keyboard.press('ArrowLeft');assert.equal(await amount.inputValue(),'10000');
   await page.keyboard.press('End');assert.equal(await amount.inputValue(),'100000');
   assert.ok(await page.locator('#fee-negotiation').isVisible());
   await page.keyboard.press('ArrowLeft');assert.equal(await amount.inputValue(),'99000');
   await amount.fill('1234.56');assert.equal(await amount.inputValue(),'1234.56');
   assert.match(await page.locator('#fee-cost').innerText(),/30,86/);
   assert.match(await slider.getAttribute('aria-valuetext'),/1\s?200/);
   await page.locator('[data-fee-amount="80000"]').click();assert.equal(await slider.inputValue(),'130');
   await slider.focus();await page.keyboard.press('Home');assert.equal(await page.locator('#fee-negotiation').isVisible(),false);
   const values=await slider.evaluate(e=>Array.from({length:151},(_,i)=>{e.value=i;e.dispatchEvent(new Event('input',{bubbles:true}));return Number(document.querySelector('#fee-amount').value)}));
   assert.equal(values[0],50);assert.equal(values.at(-1),100000);
   for(let i=2;i<values.length;i++)assert.equal(values[i]-values[i-1],values[i]<=2000?100:values[i]<=10000?200:1000);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.close();console.log('PASS slider steps, both boundaries, keyboard, exact typed amount, fees and negotiation:',width);
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});

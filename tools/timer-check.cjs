const {chromium}=require(process.env.PND_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.PND_BASE_URL||'http://127.0.0.1:8898';
const output=path.resolve(__dirname,'../browser-results');
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.PND_BROWSER||undefined});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1024,height:900},serviceWorkers:'block'});
  await context.route('**/__local/**',r=>r.fulfill({json:{ticktick:false}}));
  if(process.argv.includes('--negative-control')){
   const source=await fs.readFile(path.resolve(__dirname,'../src/app.mjs'),'utf8');
   const broken=source.replace('String(100-p*100)','String(100)');assert.notEqual(broken,source);
   await context.route('**/src/app.mjs',r=>r.fulfill({contentType:'text/javascript',body:broken}));
  }
  await context.addInitScript(()=>{window.timerNow=Date.now();Date.now=()=>window.timerNow;const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=5;return a;}return original(a);};});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('[data-act=roll]').waitFor();
  await page.waitForFunction(()=>performance.getEntriesByType('resource').some(x=>x.name.endsWith('/__local/status')));
  await page.locator('[data-act=roll]').press('Enter');await page.locator('[data-act=start]').click();
  await page.locator('.quiet-timer').waitFor();
  const started=await page.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return (await read('game')).current.started;});
  let lastWater=null;
  for(const fraction of [0,.25,.5,.9,1]){
   await page.evaluate(now=>window.timerNow=now,started+fraction*15*60*1000);
   await page.waitForFunction(p=>Number(document.querySelector('.quiet-timer')?.getAttribute('aria-valuenow'))===p,fraction*100);
   assert.equal(Number(await page.locator('#time-arc').getAttribute('stroke-dashoffset')),100-fraction*100,'Arc must follow elapsed time');
   const position=(await page.locator('#time-marker').getAttribute('transform')).match(/[-\d.]+/g).map(Number);
   assert(Math.abs(position[0]-(120+101*Math.sin(fraction*2*Math.PI)))<.001);
   assert(Math.abs(position[1]-(120-101*Math.cos(fraction*2*Math.PI)))<.001);
   const water=await page.locator('#water').evaluate(e=>e.style.transform);
   if(lastWater!==null)assert.notEqual(water,lastWater,'The pool must rise with elapsed time');lastWater=water;
   assert.equal(await page.locator('[data-act=leave]').count(),0);
   assert(!/\d\d:\d\d/.test(await page.locator('#stage').innerText()));
   await page.screenshot({path:path.join(output,`timer-${fraction*100}.png`),fullPage:true,animations:'disabled'});
   if(fraction===.25){
    const wave=await page.locator('.water-flow').evaluate(e=>getComputedStyle(e).transform);
    await page.waitForFunction(before=>getComputedStyle(document.querySelector('.water-flow')).transform!==before,wave);
   }
   if(fraction===.5){
    await page.setViewportSize({width:768,height:1024});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(output,'timer-portrait.png'),fullPage:true,animations:'disabled'});
    await page.setViewportSize({width:1024,height:900});
   }
   if(fraction===.9){
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.water-flow').evaluate(e=>getComputedStyle(e).animationName),'none');
    assert.equal(await page.locator('.marker-halo').evaluate(e=>getComputedStyle(e).animationName),'none');
   }
  }
  await page.locator('.receipt').waitFor();
  let game=await page.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return read('game');});
  assert.equal(game.history.length,1);assert.equal(game.history[0].ended,game.history[0].deadline);
  await page.reload();await page.locator('.receipt').waitFor();
  game=await page.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return read('game');});assert.equal(game.history.length,1);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,frames:[0,25,50,90,100],checks:['arc and marker follow saved deadline','pool rises','water visibly moves','no numerical countdown','no Try exit','tablet portrait and landscape','reduced motion','deadline completion once and reload'],browserErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

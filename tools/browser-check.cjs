const {chromium}=require(process.env.PND_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.PND_BASE_URL||'http://127.0.0.1:8896';
const output=path.resolve(__dirname,'../browser-results');
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.PND_BROWSER||undefined,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block'});
  const errors=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
  const task={id:'creative-today',projectId:'personal',title:'Build a small recipe picker',content:'Choose two recipes and make a simple prototype. <img src=x onerror="window.bad=true">',desc:'Keep it small.',tags:['creative'],status:0,isFloating:true,dueDate:today,items:[{title:'Sketch the inputs',status:0}]};
  await context.route('**/__local/**',route=>{
   const p=new URL(route.request().url()).pathname;
   const body=p.endsWith('/status')?{ticktick:true}:p.endsWith('/project')?[{id:'personal',name:'Personal'},{id:'queue',name:'Claude Queue'}]:p.endsWith('/task/creative-today')?task:p.endsWith('/personal/data')?{tasks:[task,{...task,id:'old',title:'Older idea',dueDate:'2020-01-01'},{...task,id:'undated',title:'An undated idea',dueDate:null}]}:{tasks:[]};
   return route.fulfill({json:body});
  });
  await context.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=window.dieValue??5;return a;}return original(a);};});
  const page=await context.newPage();
  await page.goto(base);await page.locator('[data-act=roll]').waitFor();
  await page.waitForFunction(()=>document.querySelector('#connection').textContent.includes('updated'));
  await page.screenshot({path:path.join(output,'desktop-cast.png'),fullPage:true});
  await page.locator('[data-act=roll]').click();await page.locator('[data-act=start]').waitFor();
  assert.match(await page.locator('#stage h2').innerText(),/Create/);
  assert.equal(await page.locator('.task-start').count(),3);
  assert.equal(await page.locator('.task-start strong').first().innerText(),task.title);
  await page.waitForFunction(()=>document.querySelector('.first-result').getAnimations().every(a=>a.playState==='finished'));
  const ratio=await page.evaluate(()=>document.querySelector('.first-result').getBoundingClientRect().width/document.querySelector('.mode-aside').getBoundingClientRect().width);
  assert(ratio>1.9&&ratio<2.1);
  await page.screenshot({path:path.join(output,'desktop-discover.png'),fullPage:true});
  await page.locator('[data-act=veto]').click();await page.locator('[data-act=roll]').waitFor();
  await page.locator('[data-act=roll]').click();assert(await page.locator('[data-act=veto]').isDisabled());
  await page.evaluate(()=>window.dieValue=3);await page.locator('[data-act=mode]').click();
  await page.waitForFunction(()=>document.querySelector('#stage h2')?.textContent.includes('Wander'));
  await page.locator('[data-task=creative-today]').click();await page.locator('.quiet-timer').waitFor();
  assert.equal(await page.locator('#stage h2').innerText(),'Create');
  assert.match(await page.locator('.task-body').first().innerText(),/<img/);
  assert.equal(await page.locator('.task-detail img').count(),0);
  assert.equal(await page.evaluate(()=>window.bad),undefined);
  assert(!/\d\d:\d\d/.test(await page.locator('#stage').innerText()));
  await page.screenshot({path:path.join(output,'desktop-doing.png'),fullPage:true});
  await page.evaluate(()=>{window.realNow=Date.now;Date.now=()=>window.realNow()+7.5*60*1000;});
  await page.waitForFunction(()=>Number(document.querySelector('.quiet-timer')?.getAttribute('aria-valuenow'))>=50);
  await page.screenshot({path:path.join(output,'quiet-timer.png'),fullPage:true,animations:'disabled'});
  await page.evaluate(()=>Date.now=window.realNow);
  await page.reload();await page.locator('.quiet-timer').waitFor();assert.equal(await page.locator('#stage h2').innerText(),'Create');
  const tab2=await context.newPage();await tab2.goto(base);await tab2.locator('[data-act=done]').waitFor();
  await Promise.all([page.evaluate(()=>document.querySelector('[data-act=done]')?.click()),tab2.evaluate(()=>document.querySelector('[data-act=done]')?.click())]);
  await page.locator('.receipt').waitFor();await tab2.locator('.receipt').waitFor();
  let game=await page.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return read('game');});
  assert.equal(game.history.length,1);assert.equal(game.credits,2);
  await tab2.close();await page.locator('[data-act=next]').click();await page.evaluate(()=>window.dieValue=5);await page.locator('[data-act=roll]').click();await page.evaluate(()=>window.dieValue=3);await page.locator('[data-act=mode]').click();await page.waitForFunction(()=>document.querySelector('#stage h2')?.textContent.includes('Wander'));await page.locator('[data-act=start]').click();
  await page.locator('.quiet-timer').waitFor();assert.match(await page.locator('#stage h2').innerText(),/Wander/);
  await page.evaluate(()=>{const original=Date.now;Date.now=()=>original()+16*60*1000;});
  await page.locator('.receipt').waitFor({timeout:5000});
  game=await page.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return read('game');});
  assert.equal(game.history.length,2);assert.equal(game.history[1].reason,'elapsed');assert.equal(game.history[1].ended,game.history[1].deadline);
  await page.reload();await page.locator('.receipt').waitFor();
  game=await page.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return read('game');});assert.equal(game.history.length,2);
  await page.locator('[data-act=next]').click();await page.locator('[data-act=roll]').click();
  await page.waitForFunction(()=>document.getAnimations().every(a=>a.playState==='finished'));
  for(const viewport of [{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
   await page.setViewportSize(viewport);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(output,`discover-${viewport.width}.png`),fullPage:true});
  }
  await page.locator('[data-act=settings]').click();await page.locator('#settings-dialog').waitFor();
  assert.match(await page.locator('#settings-dialog').innerText(),/Connected through Eco/);
  await page.locator('[data-settings=close]').click();
  assert.deepEqual(errors,[]);
  await context.close();
  let counts=null;
  if(process.env.PND_LIVE_CHECK==='1'){
  // Real read-only TickTick connection and real service worker, in an isolated browser profile.
  const live=await browser.newContext({viewport:{width:1280,height:1000}});const actual=await live.newPage();await actual.goto(base);
  await actual.waitForFunction(()=>document.querySelector('#connection').textContent.includes('updated'),{},{timeout:60000});
  counts=await actual.evaluate(async()=>{const {read}=await import('./src/storage.mjs');const c=await read('taskCache');return {tasks:c.tasks.length,projects:c.projects.length,failed:c.failed};});
  assert(counts.tasks>0);assert.deepEqual(counts.failed,[]);
  await actual.evaluate(async()=>{await navigator.serviceWorker.ready;});await actual.reload();
  await actual.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const cached=await actual.evaluate(async()=>{const names=await caches.keys();const keys=await Promise.all(names.map(async n=>(await(await caches.open(n)).keys()).map(r=>r.url)));return keys.flat();});
  assert(!cached.some(x=>x.includes('__local')||x.includes('ticktick')));assert(cached.some(x=>x.includes('icon-512.png')));
  await live.setOffline(true);await actual.reload();await actual.locator('[data-act=roll]').waitFor();
  await actual.locator('[data-act=roll]').click();await actual.locator('#stage h2').waitFor();
  await live.close();
  }
  const result={passed:true,checks:['weighted cast UI','early veto','2:1 result layout','today-first task suggestions','task mode discarded','task content escaped','own mode retained','quiet timer','reload persistence','multi-tab completion once','deadline completion once','responsive widths 1024/768/390','settings',...(counts?['live read-only TickTick','offline shell with no API caching']:[])],live:counts,browserErrors:errors};
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

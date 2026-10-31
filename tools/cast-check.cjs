const {chromium}=require(process.env.PND_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.PND_BASE_URL||'http://127.0.0.1:8897';
const output=path.resolve(__dirname,'../browser-results');
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.PND_BROWSER||undefined});
 const errors=[];
 async function setup(options={}){
  const context=await browser.newContext({viewport:{width:1024,height:900},serviceWorkers:'block',...options});
  await context.route('**/__local/**',r=>r.fulfill({json:{ticktick:false}}));
  await context.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=5;return a;}return original(a);};});
  if(process.argv.includes('--negative-control')){
   // Break the 3D rotation at its source: dragging no longer changes the orientation.
   const source=await fs.readFile(path.resolve(__dirname,'../src/dice3d.mjs'),'utf8');
   const broken=source.replace('q = qNorm(qMul(step, q));','q = q;');assert.notEqual(source,broken,'negative control must patch the rotation');
   await context.route('**/src/dice3d.mjs',r=>r.fulfill({contentType:'text/javascript',body:broken}));
  }
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('.spin-die').waitFor();
  // Wait for boot's local-status request/render before grabbing the control.
  await page.waitForFunction(()=>performance.getEntriesByType('resource').some(x=>x.name.endsWith('/__local/status')));
  return {context,page};
 }
 const game=p=>p.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return read('game');});
 const faceState=p=>p.locator('.spin-die .die-canvas').first().evaluate(e=>({front:e.dataset.frontFace,visible:e.dataset.visible}));
 async function center(page,selector='.spin-die'){
  await page.locator(selector).scrollIntoViewIfNeeded();
  const r=await page.locator(selector).boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2,r};
 }
 try{
  const {context,page}=await setup();

  // The die is a real 3D object: dragging changes the set of faces toward the viewer.
  let c=await center(page);
  await page.mouse.move(c.x,c.y);await page.mouse.down();
  const before=await faceState(page);
  await page.mouse.move(c.x+70,c.y+10,{steps:8});await page.mouse.move(c.x+40,c.y+90,{steps:8});
  const after=await faceState(page);
  assert(before.visible&&after.visible,'the 3D die must report its visible faces');
  assert.notEqual(after.visible,before.visible,'dragging must change which faces face the viewer (real spatial rotation)');
  assert.equal((await game(page)).rolls,0,'holding/spinning must not cast early');
  await page.screenshot({path:path.join(output,'die-held.png'),fullPage:true});
  await page.keyboard.press('Escape');await page.mouse.up();
  assert.equal(await page.locator('.gathering,.casting').count(),0);
  assert.equal((await game(page)).rolls,0,'Escape cancels the spin');

  c=await center(page);await page.mouse.move(c.x+35,c.y);await page.mouse.down();
  await page.mouse.move(c.x,c.y+60,{steps:8});await page.mouse.move(c.x-60,c.y,{steps:8});
  await page.mouse.move(c.x,c.y-80,{steps:8});
  await page.mouse.move(c.x+c.r.width,c.y-90,{steps:8}); // outside original hit area
  await page.mouse.up();await page.locator('[data-act=start]').waitFor();
  assert.equal((await game(page)).rolls,1,'release outside the die still casts exactly once');

  c=await center(page,'[data-act=mode]');await page.mouse.move(c.x+25,c.y);await page.mouse.down();
  await page.mouse.move(c.x,c.y+35,{steps:8});await page.mouse.up();
  await page.waitForFunction(()=>document.querySelector('#stage h2')?.textContent.includes('Delight'));
  assert.equal((await game(page)).current.mode,5);
  await page.locator('[data-act=unavailable]').click();await page.locator('[data-act=roll]').waitFor();
  await page.locator('[data-act=roll]').press('Enter');await page.locator('[data-act=start]').waitFor();
  assert.equal((await game(page)).rolls,2);
  await page.locator('[data-act=unavailable]').click();await page.locator('[data-act=roll]').click();
  await page.locator('[data-act=start]').waitFor();assert.equal((await game(page)).rolls,3);

  // Landing agreement: spinTo(n) must leave face n toward the viewer, for both dice.
  const landing=await page.evaluate(async()=>{
   const {createDie}=await import('./src/dice3d.mjs');
   const out={};
   for(const sides of [20,6]){
    const canvas=document.createElement('canvas');canvas.style.width='160px';canvas.style.height='160px';
    document.body.appendChild(canvas);Object.defineProperty(canvas,'clientWidth',{value:160});Object.defineProperty(canvas,'clientHeight',{value:160});
    const die=createDie(canvas,{sides});const landed=[];
    for(const n of (sides===20?[1,6,13,20]:[1,3,6])){await die.spinTo(n,{reduced:true});landed.push([n,Number(canvas.dataset.frontFace)]);}
    out[sides]=landed;canvas.remove();
   }
   return out;
  });
  for(const sides of [20,6])for(const [asked,got] of landing[sides])assert.equal(got,asked,`d${sides}: spinTo(${asked}) must land on ${asked}, landed on ${got}`);
  await context.close();

  const touch=await setup({hasTouch:true,isMobile:true});const tp=touch.page;
  const cdp=await touch.context.newCDPSession(tp);
  c=await center(tp);
  const point=(x,y)=>({x,y,id:1,radiusX:8,radiusY:8,force:1});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(c.x+30,c.y)]});
  const tBefore=await faceState(tp);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(c.x-20,c.y+60)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(c.x+40,c.y+80)]});
  const tAfter=await faceState(tp);
  assert.notEqual(tAfter.visible,tBefore.visible,'touch drag must rotate the die in space');
  assert.equal(await tp.locator('.spin-die').evaluate(e=>getComputedStyle(e).touchAction),'none');
  assert.equal((await game(tp)).rolls,0);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await tp.locator('.gathering,.casting').count(),0);assert.equal((await game(tp)).rolls,0);
  c=await center(tp);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(c.x+30,c.y)]});
  for(const [dx,dy] of [[20,30],[0,50],[-30,20],[-50,0]])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(c.x+dx,c.y+dy)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await tp.locator('[data-act=start]').waitFor();assert.equal((await game(tp)).rolls,1);
  await touch.context.close();

  const quiet=await setup({reducedMotion:'reduce'});
  await quiet.page.locator('[data-act=roll]').press('Space');await quiet.page.locator('[data-act=start]').waitFor();
  assert.equal((await game(quiet.page)).rolls,1);await quiet.context.close();

  const offline=await setup({serviceWorkers:'allow'});const op=offline.page;
  await op.evaluate(async()=>{await navigator.serviceWorker.ready;});await op.reload();
  await op.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const cached=await op.evaluate(async()=>{const cache=await caches.open('pnd-shell-0.2.5');return (await cache.keys()).map(x=>x.url);});
  assert(cached.some(x=>x.endsWith('/src/cast.mjs')),'cast module cached offline');
  assert(cached.some(x=>x.endsWith('/src/dice3d.mjs')),'3D renderer cached offline');
  assert(cached.some(x=>x.endsWith('/src/preview.mjs')),'preview module cached offline');
  assert(cached.some(x=>x.endsWith('/src/preview.css')),'preview styles cached offline');
  await offline.context.setOffline(true);await op.reload();await op.locator('[data-act=roll]').press('Enter');
  await op.locator('[data-act=start]').waitFor();assert.equal((await game(op)).rolls,1);
  await offline.context.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks:['die faces change under drag (real 3D)','no cast before release','Escape cancels','release outside hit area casts once','d6 spin','keyboard Enter and Space','tap fallback','spinTo lands on the selected face (d20 and d6)','touch drag changes faces and cancellation','reduced motion','offline cast + 3D modules'],browserErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

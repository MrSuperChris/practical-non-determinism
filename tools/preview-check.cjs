// Browser verification for Cast-screen category previews. Exercises the real DOM:
// hover/focus/tap open-dismiss, keyboard, viewport containment, task ordering and
// hostile-text escaping, honest empty states, and that previewing never casts.
// Run with a local Playwright + browser, or PND_PLAYWRIGHT_MODULE / PND_BROWSER.
// `--negative-control` disables the module's HTML escaping; the escaping assertion
// must then fail, proving the test detects a broken escape.
const {chromium}=require(process.env.PND_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.PND_BASE_URL||'http://127.0.0.1:8897';
const output=path.resolve(__dirname,'../browser-results');

// Chicago "today" as a plain all-day date, so the matcher reads it without timezone math.
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
const HOSTILE='<img src=x onerror="window.__xss=1">';
const fixtures=[
 {id:'t1',projectId:'p1',projectName:'Home',title:'Wipe the counters',tags:['home'],status:0,dueDate:today,createdTime:'2026-01-01T00:00:00+0000'},
 {id:'t2',projectId:'p1',projectName:'Home',title:HOSTILE,tags:['home'],status:0,dueDate:'2030-01-01',createdTime:'2026-01-02T00:00:00+0000'},
 {id:'t3',projectId:'p1',projectName:'Home',title:'Vacuum the hall',tags:['home'],status:0,dueDate:'2026-12-01',createdTime:'2026-01-03T00:00:00+0000'},
 {id:'t4',projectId:'p1',projectName:'Home',title:'Someday tidy',tags:['home'],status:0,dueDate:null,createdTime:'2026-01-04T00:00:00+0000'}
];

(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.PND_BROWSER||undefined});
 const errors=[];
 const negative=process.argv.includes('--negative-control');
 async function setup(options={}){
  const context=await browser.newContext({viewport:{width:1024,height:900},serviceWorkers:'block',...options});
  await context.route('**/__local/**',r=>r.fulfill({json:{ticktick:false}}));
  if(negative){
   const source=await fs.readFile(path.resolve(__dirname,'../src/preview.mjs'),'utf8');
   const broken=source.replace(/\.replace\(\/\[&<>"'\]\/g,c=>\(\{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'\}\[c\]\)\)/,'');
   assert.notEqual(source,broken,'negative control must disable escaping');
   await context.route('**/src/preview.mjs',r=>r.fulfill({contentType:'text/javascript',body:broken}));
  }
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('.spin-die').waitFor();
  await page.waitForFunction(()=>performance.getEntriesByType('resource').some(x=>x.name.endsWith('/__local/status')));
  // Preload the task cache, then reload so boot renders the home grid with matches available.
  await page.evaluate(async data=>{const {put}=await import('./src/storage.mjs');await put('taskCache',{tasks:data,projects:[],updated:Date.now(),failed:[]});},fixtures);
  await page.reload();await page.locator('.category-grid .tile').first().waitFor();
  return {context,page};
 }
 const game=p=>p.evaluate(async()=>{const {read}=await import('./src/storage.mjs');return read('game');});
 const tile=(p,i)=>p.locator(`.tile[data-category="${i}"]`);
 const popup=p=>p.locator('#category-preview');
 const popupVisible=p=>p.evaluate(()=>{const el=document.getElementById('category-preview');return !!el&&!el.hidden&&getComputedStyle(el).display!=='none';});
 try{
  const {context,page}=await setup();
  const base0=await game(page);
  assert.equal(base0.current,null,'home screen: no active cast');
  assert.equal(base0.rolls,0,'home screen: nothing rolled');

  // 1. Hover opens the preview for the correct category; description and example appear.
  await tile(page,1).hover();
  await page.waitForFunction(()=>{const el=document.getElementById('category-preview');return el&&!el.hidden&&el.querySelector('#cp-title')?.textContent==='Keep House';});
  assert.equal(await tile(page,1).getAttribute('aria-expanded'),'true','hovered tile is expanded');
  assert.match(await popup(page).locator('.cp-desc').textContent(),/Tend the place you live/);
  assert.equal(await popup(page).locator('.cp-example').count(),1,'Keep House shows a personal example');
  await page.screenshot({path:path.join(output,'preview-keephouse.png'),fullPage:true});

  // 2. Matching tasks: today-first ordering, limit three, hostile text escaped (not executed).
  const taskTitles=await popup(page).locator('.cp-task strong').allTextContents();
  assert.deepEqual(taskTitles,['Wipe the counters','Vacuum the hall',HOSTILE],'today first, then earliest due, limited to three');
  assert.equal(await popup(page).locator('.cp-task small').first().textContent(),'Today · Home');
  assert.equal(await page.evaluate(()=>window.__xss),undefined,'hostile task title must not execute');
  assert.equal(await popup(page).locator('.cp-task img').count(),0,'hostile markup is escaped, not rendered');

  // 3. Hovering away closes the transient preview.
  await page.mouse.move(5,5);
  await page.waitForFunction(()=>document.getElementById('category-preview').hidden);
  assert.equal(await tile(page,1).getAttribute('aria-expanded'),'false','tile collapses when hover leaves');

  // 4. Empty-tag category is honest (no cards are matched here).
  await tile(page,0).hover();
  await page.waitForFunction(()=>document.getElementById('category-preview').querySelector('#cp-title')?.textContent==='Manual Override');
  assert.equal(await popup(page).locator('.cp-task').count(),0);
  assert.match(await popup(page).locator('.cp-empty').textContent(),/yours to pick freely/);
  await page.mouse.move(5,5);await page.waitForFunction(()=>document.getElementById('category-preview').hidden);

  // 5. A tagged category with no matching cards, disconnected: offer to connect TickTick.
  await tile(page,6).hover(); // Manage Money → tag 'money', no fixtures match
  await page.waitForFunction(()=>document.getElementById('category-preview').querySelector('#cp-title')?.textContent==='Manage Money');
  assert.match(await popup(page).locator('.cp-empty').textContent(),/Connect TickTick/);
  await page.mouse.move(5,5);await page.waitForFunction(()=>document.getElementById('category-preview').hidden);

  // 6. Keyboard: focusing a tile opens it; Enter pins; Escape closes and restores focus.
  await tile(page,5).focus();
  await page.waitForFunction(()=>!document.getElementById('category-preview').hidden);
  await tile(page,5).press('Enter');
  await page.mouse.move(5,5); // a stray move must not dismiss a pinned preview
  assert.equal(await popupVisible(page),true,'pinned preview survives pointer leaving');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.getElementById('category-preview').hidden);
  assert.equal(await tile(page,5).evaluate(el=>el===document.activeElement),true,'Escape returns focus to the tile');

  // 7. Previewing never casts or mutates game state.
  const after=await game(page);
  assert.equal(after.rolls,0,'previews never roll');
  assert.equal(after.current,null,'previews never start a session');
  await context.close();

  // 8. Touch: tap opens a pinned preview; tapping outside dismisses it.
  const touch=await setup({hasTouch:true,isMobile:true,viewport:{width:768,height:1024}});const tp=touch.page;
  await tile(tp,1).tap();
  await tp.waitForFunction(()=>!document.getElementById('category-preview').hidden);
  let box=await popup(tp).boundingBox();
  assert(box.x>=0&&box.y>=0&&box.x+box.width<=768+0.5&&box.y+box.height<=1024+0.5,'popup stays within the tablet viewport');
  await tp.mouse.click(5,5); // outside tap dismisses
  await tp.waitForFunction(()=>document.getElementById('category-preview').hidden);
  assert.equal((await game(tp)).rolls,0,'tap preview does not cast');
  await touch.context.close();

  // 9. Phone width: popup still contained.
  const phone=await setup({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});const pp=phone.page;
  await tile(pp,1).tap();
  await pp.waitForFunction(()=>!document.getElementById('category-preview').hidden);
  box=await popup(pp).boundingBox();
  assert(box.x>=0&&box.x+box.width<=390+0.5,'popup stays within the phone viewport width');
  await pp.screenshot({path:path.join(output,'preview-phone.png'),fullPage:true});
  await phone.context.close();

  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks:['hover opens correct category','description + personal example','today-first ordering, limit 3','hostile title escaped and inert','hover-away dismiss','empty-tag honest state','disconnected connect prompt','keyboard focus/Enter/Escape + focus restore','no cast or state change','touch tap open + outside dismiss','tablet containment','phone containment'],browserErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

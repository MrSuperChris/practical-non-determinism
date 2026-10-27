import {bindCast} from './cast.mjs';
import {emblem,orbit} from './art.mjs';
import {categories,names,general,prompts,examples,createDetails} from './data.mjs';
import {initialState,localDay,roll,progress,handledCount} from './engine.mjs';
import {read,put,act} from './storage.mjs';
import {DEFAULT_TAGS,TickTick,matching,snapshot,taskLink} from './tasks.mjs';

const root=document.getElementById('app'),stage=document.getElementById('stage');
const settings=document.getElementById('settings-dialog'),historyDialog=document.getElementById('history-dialog');
let state=initialState(),prefs={zone:'America/Chicago',inboxId:'inbox122211300',lists:null,tags:DEFAULT_TAGS},cache={tasks:[],projects:[],updated:0,failed:[]};
let local=false,client=null,busy=false,loading=false,modeOpen=false,loadVersion=0,notice='',ready=false;
const channel='BroadcastChannel' in window?new BroadcastChannel('pnd-updates'):null;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=()=>state.current,category=()=>categories[current()?.category??5];
const mainDescription=()=>category()[2];
const headingDescription=()=>current()?.mode==null?mainDescription():(prompts[category()[0]]||general)[current().mode];
const detail=()=>category()[0]==='Create'&&current().mode!==null?createDetails[current().mode]:examples[category()[0]]||mainDescription();
const button=(text,action,cls='',attributes='')=>`<button type="button" class="button ${cls}" data-act="${action}" ${attributes}>${text}</button>`;
const announce=text=>document.getElementById('announcer').textContent=text;
function showNotice(text){notice=text;document.getElementById('notice').textContent=text;}
function token(){return localStorage.getItem('pnd.ticktick.token')||'';}
function connectClient(){client=local?new TickTick({local:true}):token()?new TickTick({token:token()}):null;}
function dice(six=false){return `<svg class="dice-art ${six?'d6-art':''}" viewBox="${six?'1102 62 240 270':'1118 80 232 274'}" aria-hidden="true"><image href="./assets/player-aid-${six?2:1}.png" width="1448" height="1086"/></svg>`;}
function castControl(six=false){return `<div class="cast-ritual ${six?'cast-ritual--six':''}"><div class="dice-orbit ${six?'dice-orbit--six':''}">${orbit()}<button type="button" class="cast spin-die" data-act="${six?'mode':'roll'}" aria-label="Spin the ${six?'six-sided':'twenty-sided'} die to cast" aria-describedby="cast-hint-${six?'six':'twenty'}"><span class="die-face">${dice(six)}</span></button></div><p class="cast-hint" id="cast-hint-${six?'six':'twenty'}"><strong>Grab the die. Give it a spin.</strong><span>Release to cast · or tap the die</span><span class="sr-only">Keyboard: Enter or Space casts. Escape cancels a spin.</span></p></div>`;}

function title(){const c=current();return `<div class="result-heading">${emblem(c.category)}<div class="heading-copy"><span class="result-number">${c.face===1?'Your choice':'D20 · '+c.face}${c.mode==null?'':' / D6 · '+(c.mode+1)}</span><h2>${category()[0]}${c.mode==null?'':` <em>· ${names[c.mode]}</em>`}</h2><p class="lead" ${c.mode==null?'':`data-mode="${c.mode}"`}>${escape(headingDescription())}</p></div></div>`;}
function historyCount(){const c=current(),total=handledCount(state,c.category),recent=state.history.filter(x=>x.category===c.category&&Date.now()-x.ended<7*86400000).length;return `<div class="mini-history">Handled ${total} ${total===1?'time':'times'} · ${recent} in the past 7 days${c.mode==null?'':` · This approach: ${handledCount(state,c.category,c.mode)}`}</div>`;}
function veto(){const used=state.vetoDate===localDay(Date.now(),prefs.zone);return button(used?'Veto · 3 credits':'Veto · free today','veto','veto wide',used&&state.credits<3?'disabled':'');}
function rules(){
  const phase=current()?.phase;
  if(phase==='doing')return `<section class="rules" aria-labelledby="guidance-title"><h3 id="guidance-title">While you’re here</h3><p><strong>Enough for now?</strong> Tap Done whenever you feel finished. When the pool fills after fifteen minutes, the session counts as handled automatically.</p><p><strong>Keep your momentum.</strong> You can carry on for as long as you like. The pool is an invitation, not a stopping bell.</p><p><strong>Need to step away?</strong> Use Leave this session to choose freely. Leaving before it is handled earns no credits; your existing credits stay yours.</p></section>`;
  if(phase==='handled')return `<section class="rules" aria-labelledby="guidance-title"><h3 id="guidance-title">At your own pace</h3><p><strong>This session is recorded.</strong> Your credits and history are saved. There is nothing else to confirm.</p><p><strong>Keep going if you like.</strong> Cast again at your next natural transition. There is no need to interrupt something satisfying.</p></section>`;
  return `<section class="rules" aria-labelledby="guidance-title"><h3 id="guidance-title">Before you begin</h3><p><strong>Not this time?</strong> Use Veto: one free each day, then 3 credits. A veto restarts your three-session bonus run.</p><p><strong>Can’t do this?</strong> Impossible, inappropriate, or unavailable results get a free reroll. Your credits and bonus progress stay intact.</p><button class="text-action" type="button" data-act="unavailable">This result is unavailable → reroll</button><p><strong>Credits.</strong> Each handled session earns 1, a TickTick session adds 1, and every three accepted results adds 1.</p><p><strong>Life comes first.</strong> Deadlines, health, safety, major spending, and obligations to other people stay outside the game.</p><button class="text-action" type="button" data-act="leave">Leave the game and choose freely</button></section>`;
}
function candidates(){return matching(cache.tasks,current().category,{tags:prefs.tags,zone:prefs.zone});}
function taskDateLabel(t){if(t.today)return 'Today';if(!t.dateLabel)return 'No due date';const d=t.dateLabel.split('-');return `Due ${new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+d[0],+d[1]-1,+d[2])))}`;}
function startChoices(earlyVeto=false){const tasks=candidates();return `<section class="start-now" aria-label="Ways to start"><div class="start-primary">${button('Start 15 minutes','start','primary wide')}${earlyVeto?`<div class="inline-veto">${veto()}</div>`:''}</div><p class="task-caption">${tasks.length?'Or start with a matching TickTick card':loading?'Finding matching TickTick cards…':!client?'Connect TickTick to see matching cards':'No matching open cards right now'}</p>${tasks.length?`<div class="task-list">${tasks.map(t=>`<button type="button" class="task-start" data-act="task" data-task="${escape(t.id)}" data-project="${escape(t.projectId)}"><span class="task-mark" aria-hidden="true">✓</span><span class="task-copy"><strong>${escape(t.title)}</strong><small>${escape(taskDateLabel(t))} · ${escape(t.projectName||'TickTick')} · +1 credit when handled</small></span><span class="arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`:!client?'<button class="text-action" data-act="settings" type="button">Connect TickTick →</button>':''}${cache.updated&&(!navigator.onLine||cache.failed?.length)?'<p class="small muted">Showing saved cards; some details may have changed.</p>':''}</section>`;}
function firstResult(){return `<section class="invitation first-result" data-category="${current().category}">${title()}<p class="muted small">${escape(detail())}</p>${startChoices(true)}${historyCount()}${rules()}</section>`;}
function quietTimer(done=false){return `<div class="timer-area"><svg class="quiet-timer ${done?'settled':''}" viewBox="0 0 240 240" role="progressbar" aria-label="Fifteen-minute invitation" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${done?100:Math.floor(progress(current())*100)}"><defs><clipPath id="bowl"><circle cx="120" cy="120" r="87"/></clipPath><linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a994b6"/><stop offset="1" stop-color="#3e3158"/></linearGradient></defs><circle cx="120" cy="120" r="109" fill="none" stroke="#b1a68f" stroke-width="1"/><circle cx="120" cy="120" r="101" fill="none" stroke="#756181" stroke-width="2"/><circle cx="120" cy="120" r="87" fill="#eee5d7"/><g clip-path="url(#bowl)"><circle cx="155" cy="78" r="15" fill="#bba56d" opacity=".5"/><path d="M24 166 67 101 103 146 151 82 216 166Z" fill="#a7afa0"/><path d="m36 179 69-63 53 44 32-38 34 50v45H36Z" fill="#71867b"/><path d="M41 198V119m0 4-19 30h38Zm155 1v75m0-71-24 37h48Z" fill="#3e6250" stroke="#3e6250" stroke-width="2"/><g id="water"><path d="M20 0 Q70 -10 120 0 T220 0 V210 H20 Z" fill="url(#pool)" opacity=".9"/><path d="M42 10q30-9 65 0t82 0M63 25q30-6 55 0t44 0" stroke="#eadfc6" stroke-width="1" opacity=".4" fill="none"/></g></g><path d="M120 15 V24 M120 216 V225 M15 120 H24 M216 120 H225" stroke="#283a51" stroke-width="1"/><text x="120" y="131" text-anchor="middle" fill="${done?'#f8efdc':'#665078'}" font-size="33" aria-hidden="true">✦</text></svg><p class="timer-caption">${done?'A little time, well given.':'Let this time be yours.'}</p>${done?'':button('Done','done','primary wide')}${done?'':'<button type="button" class="text-action" data-act="leave">Leave this session</button>'}</div>`;}
function taskDetails(task){return `<section class="task-detail"><span class="eyebrow">Your TickTick card</span><h3>${escape(task.title)}</h3>${task.content?`<p class="task-body">${escape(task.content)}</p>`:''}${task.desc&&task.desc!==task.content?`<p class="task-body">${escape(task.desc)}</p>`:''}${task.items?.length?`<ul class="checklist">${task.items.map(x=>`<li class="${x.status===1?'checked':''}"><span aria-label="${x.status===1?'Complete':'Open'}">${x.status===1?'☑':'☐'}</span><span>${escape(x.title)}</span></li>`).join('')}</ul>`:''}<a href="${taskLink(task)}" target="_blank" rel="noopener noreferrer">Open in TickTick ↗</a><p class="small muted">This session records time spent. The TickTick card stays open until you complete it there.</p></section>`;}
function render(){
  castInteraction.cancel();
  const c=current(),used=state.vetoDate===localDay(Date.now(),prefs.zone);
  document.getElementById('wallet').innerHTML=`<strong>${state.credits} credits</strong><span>${used?'Daily veto used':'Daily veto available'}</span><br><span>${state.run}/3 toward bonus</span>`;
  const step=!c?0:c.phase==='doing'||c.phase==='handled'?3:c.mode==null?1:2;
  document.getElementById('steps').innerHTML=['Cast','Discover','Begin','Try'].map((x,i)=>`<span ${i===step?'aria-current="step"':''}><b>${String(i+1).padStart(2,'0')}</b>${x}</span>`).join('');
  document.getElementById('notice').textContent=notice;
  document.getElementById('connection').textContent=loading?'Refreshing TickTick…':cache.updated?`${navigator.onLine?'TickTick':'Saved cards · offline'} · updated ${new Date(cache.updated).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:prefs.zone})}`:'History stays on this device';
  let h='';
  if(!c)h=`<div class="home-grid"><section class="ritual-intro"><div class="ornament">The basic ritual</div>${castControl()}<h2>Let the universe<br>choose a lane.</h2><p class="muted">At a natural transition, cast a die.<br>You choose the actual activity.</p><p class="small muted">Keep House, Create, Organize, and Move each occupy two faces of the die.</p></section><section><div class="ornament">The twenty faces</div><div class="category-grid">${categories.map((x,i)=>`<div class="tile ${x[3]==='direct'?'special':''} ${i===0?'manual':''}" data-category="${i}"><span class="face">${x[1].join(' / ')}</span>${emblem(i)}<span class="tile-name">${x[0]}</span></div>`).join('')}</div></section></div>`;
  else if(c.phase==='invitation'&&c.face===1&&!c.chosen)h=`<section class="invitation" data-category="0">${title()}<div class="choose-grid">${categories.slice(1).map((x,i)=>button(emblem(i+1)+'<span>'+x[0]+'</span>','choose','',`data-choice="${i+1}"`)).join('')}</div><div class="actions">${veto()}</div>${rules()}</section>`;
  else if(c.phase==='invitation'&&c.mode==null&&!c.chosen&&category()[3]!=='direct'){
    const showModes=category()[3]==='usual'||modeOpen;
    h=`<div class="result-layout">${firstResult()}<aside class="mode-aside" aria-label="Optional second roll"><span class="eyebrow">Optional · for your own activity</span><h3>Add an approach</h3><p class="small muted">Start now, or cast for an approach. TickTick cards follow their own instructions.</p>${showModes?`${castControl(true)}<div class="mode-grid">${names.map((x,i)=>`<div class="mode" data-mode="${i}">${emblem(i,{mode:true})}<div class="mode-copy"><strong>${i+1} · ${x}</strong><p>${escape((prompts[category()[0]]||general)[i])}</p></div></div>`).join('')}</div>`:button('Give me an approach','show-modes','wide')}</aside></div>`;
  }else if(c.phase==='invitation')h=`<section class="invitation ${c.category===15?'leaf-invitation':''}" data-category="${c.category}">${title()}<div class="invitation-grid"><div><p class="muted">${escape(detail())}</p>${historyCount()}${veto()}${rules()}</div>${startChoices()}</div></section>`;
  else {
    const done=c.phase==='handled';
    h=`<section class="invitation ${c.category===15?'leaf-invitation':''}" data-category="${c.category}">${title()}<span class="eyebrow">${done?'Handled. Keep going if you like.':'The die does not command.'}</span><div class="doing-grid"><div>${quietTimer(done)}${done?`<div class="receipt"><strong>+${c.earned} credits</strong><p class="small">1 for showing up${c.task?' + 1 for TickTick work':''}${c.bonus?' + 1 for three accepted results':''}.</p></div>${button('Another natural transition →','next','primary wide')}`:''}</div><div class="session-details">${c.task?taskDetails(c.task):`<p class="muted">${escape(detail())}</p>`}${historyCount()}${rules()}</div></div></section>`;
  }
  root.dataset.scene=c?.phase||'cast';stage.innerHTML=h;updateVisualTimer();
}
function updateVisualTimer(){const c=current(),p=c?.phase==='handled'?1:progress(c),water=document.getElementById('water');if(water)water.style.transform=`translateY(${210-p*190}px)`;const svg=stage.querySelector('.quiet-timer');if(svg){svg.setAttribute('aria-valuenow',String(Math.floor(p*100)));svg.setAttribute('aria-valuetext',p>=1?'Session handled':p<.25?'Just beginning':p<.5?'Settling into the session':p<.75?'Past the middle':'Approaching completion');}}
function animateFrom(rect,element){if(!rect||!element||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const end=element.getBoundingClientRect();element.animate([{transformOrigin:'top left',transform:`translate(${rect.left-end.left}px,${rect.top-end.top}px) scale(${rect.width/end.width},${rect.height/end.height})`},{transformOrigin:'top left',transform:'none'}],{duration:700,easing:'cubic-bezier(.2,.75,.2,1)'});}
async function apply(action){state=await act(action,prefs.zone);channel?.postMessage('changed');render();}
async function refresh(){
  if(!client||loading)return;const version=++loadVersion;loading=true;render();
  try{const result=await client.load(prefs);if(version!==loadVersion)return;cache=result;await put('taskCache',cache);if(result.failed.length)showNotice('Some TickTick lists could not refresh: '+result.failed.join(', ')+'.');}
  catch(e){if(version===loadVersion)showNotice(e.message+' '+(cache.tasks.length?'Saved cards are still available.':'You can still start your own activity.'));}
  finally{if(version===loadVersion){loading=false;render();}}
}
async function startTask(buttonEl){
  const task=cache.tasks.find(t=>t.id===buttonEl.dataset.task&&t.projectId===buttonEl.dataset.project);if(!task)throw Error('That card is no longer available. Refresh TickTick.');
  const expectedId=current()?.id,rect=stage.querySelector('.invitation')?.getBoundingClientRect();let selected=task;
  if(navigator.onLine&&client){try{selected=await client.detail(task);if(selected.status===2){cache.tasks=cache.tasks.filter(t=>t.id!==task.id||t.projectId!==task.projectId);await put('taskCache',cache);throw Error('This task is already complete. Choose another card.');}}catch(e){if(e.message.includes('already complete'))throw e;notice='Using saved task details; TickTick could not refresh this card.';}}
  await apply({type:'start',expectedId,task:snapshot({...selected,projectId:task.projectId})});animateFrom(rect,stage.querySelector('.invitation'));announce('Session started with '+selected.title+'.');
}
async function handle(action,el){
  if(!ready||busy)return;
  if(action==='settings'){openSettings();return;}if(action==='history'){openHistory();return;}
  if(action==='show-modes'){modeOpen=true;render();return;}
  busy=true;el?.setAttribute('disabled','');notice='';
  try{
    const c=current(),expectedId=c?.id;
    if(action==='roll'){const face=roll(20),index=[0,1,2,3,4,5,6,7,8,9,10,11,12,5,13,7,14,1,9,15][face-1],rect=stage.querySelector(`[data-category="${index}"]`)?.getBoundingClientRect();modeOpen=false;await apply({type:'roll',face,id:crypto.randomUUID(),expectedId});animateFrom(rect,stage.querySelector('[data-category]'));announce('Rolled '+face+'. '+category()[0]+'. Start or veto now, or add an approach.');}
    else if(action==='mode'){const mode=roll(6)-1,rect=stage.querySelector(`[data-mode="${mode}"]`)?.getBoundingClientRect();await apply({type:'mode',mode,expectedId});animateFrom(rect,stage.querySelector('[data-mode]'));announce(names[mode]+'. '+headingDescription());}
    else if(action==='task')await startTask(el);
    else if(action==='choose')await apply({type:'choose',category:Number(el.dataset.choice),expectedId});
    else if(action==='start'){const rect=stage.querySelector('.invitation')?.getBoundingClientRect();await apply({type:'start',expectedId});animateFrom(rect,stage.querySelector('.invitation'));announce('Your session has begun.');}
    else{await apply({type:action,expectedId});announce(action==='done'?'Session handled.':action==='veto'?'Veto taken. Cast again.':action==='unavailable'?'Free reroll. Your credits and bonus progress are unchanged.':'Ready for your next transition.');}
  }catch(e){showNotice(e.message||'Could not save your session. Please try again.');}
  finally{busy=false;el?.removeAttribute('disabled');}
}
const castInteraction=bindCast(root,{canCast:()=>ready&&!busy,cast:handle,announce});
root.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled||b.classList.contains('spin-die'))return;handle(b.dataset.act,b);});

function openSettings(){
 const savedToken=!!token(),bridge=!!localStorage.getItem('bridge.token');
 settings.innerHTML=`<div class="dialog-head"><h2 id="settings-title">Your table</h2><button class="close" data-settings="close" aria-label="Close settings">Close</button></div><p>Counts, credits, and sessions stay on this device. TickTick supplies suggestions when connected.</p><h3>TickTick</h3><p class="help">${local?'Connected through Eco on this computer. The app never receives the server’s token.':savedToken?'A TickTick token is saved on this device.':'Use your TickTick access token, as with Bridge.'}</p>${local?'':`<label for="token-input">Access token</label><input id="token-input" type="password" autocomplete="off" placeholder="${savedToken?'Leave blank to keep the saved token':'TickTick access token'}">${bridge?'<button type="button" data-settings="bridge">Use this device’s Bridge connection</button>':''}`}<label for="inbox-input">Inbox project ID</label><input id="inbox-input" type="text" value="${escape(prefs.inboxId)}"><p class="help">Includes your Inbox along with personal lists. The Claude Queue is excluded from game suggestions.</p><div class="row"><button type="button" data-settings="save">Save &amp; refresh cards</button>${!local&&savedToken?'<button type="button" data-settings="disconnect">Disconnect TickTick</button>':''}</div><details><summary>Which lists?</summary><p class="help">Uncheck a list to exclude its tasks. Inbox is controlled by the project ID above.</p>${cache.projects.filter(p=>p.name!=='Claude Queue'&&!p.closed).map(p=>`<label><input type="checkbox" data-list="${escape(p.id)}" ${!prefs.lists||prefs.lists.includes(p.id)?'checked':''}> ${escape(p.name)}</label>`).join('')||'<p class="help">Connect TickTick to load your lists.</p>'}</details><details><summary>Category matching</summary><p class="help">Match task tags, separated by commas. Leave empty for categories that should have no task suggestions.</p><div class="mapping">${categories.slice(1).map((c,i)=>`<label for="tags-${i+1}">${c[0]}</label><input id="tags-${i+1}" data-tags="${i+1}" value="${escape((prefs.tags[i+1]||[]).join(', '))}">`).join('')}</div></details><details><summary>Local history and time</summary><label for="timezone-input">Time zone for today and the daily veto</label><input id="timezone-input" type="text" value="${escape(prefs.zone)}"><p class="help">For example, America/Chicago. A new day restores the free veto. Earned credits carry over.</p><button type="button" data-settings="export">Export local history</button><p class="help">The export includes completed sessions and selected task details, but no access tokens.</p></details><p class="help">On iPad: Share → Add to Home Screen. The app works offline after its first successful load; live task refresh needs a connection.</p><p id="settings-message" role="status" class="help"></p>`;
 settings.showModal();
}
settings.addEventListener('click',async e=>{
 const action=e.target.closest('[data-settings]')?.dataset.settings;if(!action)return;
 if(action==='close'){settings.close();return;}
 if(action==='export'){const value={application:'Practical Non-Determinism',exported:new Date().toISOString(),game:state,preferences:{...prefs}};const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='practical-non-determinism-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
 const message=settings.querySelector('#settings-message');
 try{
  if(action==='bridge'){settings.querySelector('#token-input').value=localStorage.getItem('bridge.token')||'';message.textContent='Bridge token selected. Save to connect.';return;}
  if(action==='disconnect'){loadVersion++;loading=false;localStorage.removeItem('pnd.ticktick.token');client=null;cache={tasks:[],projects:[],updated:0,failed:[]};await put('taskCache',cache);settings.close();render();return;}
  if(action==='save'){
    const zone=settings.querySelector('#timezone-input').value.trim();localDay(Date.now(),zone);
    const next={...prefs,zone,inboxId:settings.querySelector('#inbox-input').value.trim(),tags:structuredClone(prefs.tags)};
    if(next.inboxId&&!/^[a-zA-Z0-9_-]+$/.test(next.inboxId))throw Error('Inbox project ID should contain letters, numbers, dashes, or underscores.');
    settings.querySelectorAll('[data-tags]').forEach(el=>{next.tags[Number(el.dataset.tags)]=el.value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);});
    const listFields=[...settings.querySelectorAll('[data-list]')];if(listFields.length)next.lists=listFields.filter(x=>x.checked).map(x=>x.dataset.list);
    const supplied=settings.querySelector('#token-input')?.value.trim();if(supplied)localStorage.setItem('pnd.ticktick.token',supplied);
    await put('preferences',next);prefs=next;loadVersion++;loading=false;connectClient();settings.close();render();await refresh();
  }
 }catch(error){message.textContent=error.message;message.classList.add('error');}
});
function openHistory(){historyDialog.innerHTML=`<div class="dialog-head"><h2 id="history-title">Time you have given</h2><button class="close" data-close aria-label="Close history">Close</button></div><p>${state.history.length} handled sessions · ${state.credits} credits available</p>${state.history.slice(-40).reverse().map(x=>`<div class="history-entry"><strong>${categories[x.category][0]}${x.mode==null?'':' · '+names[x.mode]}</strong>${x.task?`<div>${escape(x.task.title)}</div>`:''}<div class="history-meta">${escape(new Date(x.ended).toLocaleString('en-US',{timeZone:prefs.zone,dateStyle:'medium',timeStyle:'short'}))} · ${x.reason==='elapsed'?'time settled':'marked done'} · +${x.earned} credits</div></div>`).join('')||'<p>Nothing to tally yet. Start with a cast.</p>'}`;historyDialog.showModal();}
historyDialog.addEventListener('click',e=>{if(e.target.closest('[data-close]'))historyDialog.close();});
async function checkDeadline(){if(!ready||busy)return;if(current()?.phase==='doing'&&Date.now()>=current().deadline){busy=true;try{await apply({type:'reconcile'});announce('Your session is handled. Keep going if you like.');}catch(e){showNotice('Could not save completion. '+e.message);}finally{busy=false;}}else updateVisualTimer();}
channel?.addEventListener('message',async()=>{if(busy)return;try{state=await read('game')||initialState();render();await checkDeadline();}catch(e){showNotice(e.message);}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkDeadline();if(client&&Date.now()-cache.updated>120000)refresh();}});
window.addEventListener('online',()=>refresh());
setInterval(checkDeadline,1000);
async function boot(){
 try{
  prefs={...prefs,...await read('preferences')};cache=await read('taskCache')||cache;
  state=await act({type:'reconcile'},prefs.zone);ready=true;render();
  try{const response=await fetch('./__local/status',{cache:'no-store',signal:AbortSignal.timeout(2000)});if(response.ok){const data=await response.json();local=!!data.ticktick;}}catch{}
  connectClient();render();if(client)refresh();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>showNotice('Offline installation is unavailable in this browser. The online app still works.'));
 }catch(e){showNotice('Local storage could not open. Your saved data has not been reset. '+e.message);stage.innerHTML='<p>Allow browser storage for this app, then reload to continue.</p>';}
}
boot();

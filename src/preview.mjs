// Category previews for the Cast screen. Hovering, focusing, or tapping a category
// tile opens a popup with its description, personal examples, and up to three matching
// TickTick cards. This is presentation only: it reads task data and never rolls, starts,
// vetoes, or mutates any game state. The die (cast.mjs) remains the only caster.
import {categories,examples} from './data.mjs';
import {matching,taskLink} from './tasks.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function dateLabel(t){
  if(t.today)return 'Today';
  if(!t.dateLabel)return 'No due date';
  const d=t.dateLabel.split('-');
  return 'Due '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+d[0],+d[1]-1,+d[2])));
}

function tasksSection(i,ctx){
  const tags=ctx.tags||[],wanted=tags[i]||[];
  // Categories with no mapped tags (e.g. Manual Override, Rest) never suggest cards; say so honestly.
  if(!wanted.length)return '<p class="cp-empty">This lane is yours to pick freely — no cards are matched to it.</p>';
  const matches=matching(ctx.tasks||[],i,{tags,zone:ctx.zone});
  if(matches.length){
    const rows=matches.map(t=>`<a class="cp-task" href="${escape(taskLink(t))}" target="_blank" rel="noopener noreferrer"><strong>${escape(t.title)}</strong><small>${escape(dateLabel(t))} · ${escape(t.projectName||'TickTick')}</small></a>`).join('');
    const stale=ctx.cacheUpdated&&!ctx.online?'<p class="cp-note">Showing saved cards; some details may have changed.</p>':'';
    return `<div class="cp-tasks" aria-label="Matching TickTick cards">${rows}</div>${stale}`;
  }
  if(ctx.loading)return '<p class="cp-empty">Finding matching cards…</p>';
  if(!ctx.connected)return '<p class="cp-empty">Connect TickTick in Settings to see matching cards.</p>';
  return '<p class="cp-empty">No matching open cards right now.</p>';
}

function content(i,ctx){
  const cat=categories[i];if(!cat)return '';
  const name=cat[0],desc=cat[2],example=examples[name];
  return `<h3 id="cp-title">${escape(name)}</h3>`
    +`<p class="cp-desc">${escape(desc)}</p>`
    +(example?`<p class="cp-example"><span class="cp-label">For you:</span> ${escape(example)}</p>`:'')
    +tasksSection(i,ctx);
}

// getContext() returns live data from the app: {tasks, tags, zone, loading, connected, cacheUpdated, online}.
export function bindPreviews(root,getContext){
  const popup=document.createElement('div');
  popup.className='category-preview';
  popup.id='category-preview';
  popup.setAttribute('role','dialog');
  popup.setAttribute('aria-modal','false');
  popup.setAttribute('aria-labelledby','cp-title');
  popup.hidden=true;
  document.body.appendChild(popup);

  let openIndex=null,pinned=false,currentTile=null,closeTimer=0;
  const tileFor=i=>root.querySelector(`.tile[data-category="${i}"]`);
  const cancelClose=()=>{if(closeTimer){clearTimeout(closeTimer);closeTimer=0;}};
  const scheduleClose=()=>{cancelClose();closeTimer=setTimeout(close,140);};

  function position(tile){
    const margin=8,gap=6,t=tile.getBoundingClientRect();
    popup.style.left='0px';popup.style.top='0px';popup.style.visibility='hidden';popup.hidden=false;
    const pw=popup.offsetWidth,ph=popup.offsetHeight,vw=innerWidth,vh=innerHeight;
    let left=Math.max(margin,Math.min(t.left,vw-margin-pw));
    let top=t.bottom+gap;
    if(top+ph>vh-margin){const above=t.top-gap-ph;top=above>=margin?above:Math.max(margin,vh-margin-ph);}
    popup.style.left=left+'px';popup.style.top=top+'px';popup.style.visibility='';
  }

  function open(i,tile,pin){
    cancelClose();
    if(pin)pinned=true;
    if(openIndex!==i){
      clearExpanded();
      openIndex=i;
      popup.innerHTML=content(i,getContext()||{});
    }
    currentTile=tile;
    tile.setAttribute('aria-expanded','true');
    position(tile);
  }
  function clearExpanded(){root.querySelectorAll('.tile[aria-expanded="true"]').forEach(t=>t.setAttribute('aria-expanded','false'));}
  function close(){
    cancelClose();
    clearExpanded();
    openIndex=null;pinned=false;currentTile=null;
    popup.hidden=true;popup.innerHTML='';
  }

  // Hover (mouse/pen): open transiently. While pinned, hover is ignored so the pinned card stays put.
  root.addEventListener('pointerover',e=>{
    if(e.pointerType==='touch'||pinned)return;
    const tile=e.target.closest('.tile[data-category]');
    if(tile)open(Number(tile.dataset.category),tile,false);
  });
  root.addEventListener('pointerout',e=>{
    if(e.pointerType==='touch'||pinned)return;
    const tile=e.target.closest('.tile[data-category]');if(!tile)return;
    const to=e.relatedTarget;
    if(to&&(tile.contains(to)||popup.contains(to)))return;
    scheduleClose();
  });
  popup.addEventListener('pointerenter',cancelClose);
  popup.addEventListener('pointerleave',()=>{if(!pinned)scheduleClose();});

  // Keyboard: focusing a tile opens it; Enter/Space pins/unpins; Escape closes and restores focus.
  root.addEventListener('focusin',e=>{
    if(pinned)return;
    const tile=e.target.closest('.tile[data-category]');
    if(tile)open(Number(tile.dataset.category),tile,false);
  });
  root.addEventListener('focusout',e=>{
    if(pinned)return;
    const tile=e.target.closest('.tile[data-category]');if(!tile)return;
    const to=e.relatedTarget;
    if(to&&(tile.contains(to)||popup.contains(to)))return;
    scheduleClose();
  });
  root.addEventListener('keydown',e=>{
    const tile=e.target.closest('.tile[data-category]');if(!tile)return;
    if(e.key==='Enter'||e.key===' '||e.key==='Spacebar'){
      e.preventDefault();
      const i=Number(tile.dataset.category);
      if(openIndex===i&&pinned)close();else open(i,tile,true);
    }
  });

  // Tap/click toggles a pinned preview — the only way to open on touch, where there is no hover.
  root.addEventListener('click',e=>{
    const tile=e.target.closest('.tile[data-category]');if(!tile)return;
    const i=Number(tile.dataset.category);
    if(openIndex===i&&pinned)close();else open(i,tile,true);
  });

  // Dismiss: Escape anywhere, or a pointer press outside both the tiles and the popup.
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||openIndex==null)return;
    const back=currentTile||tileFor(openIndex);
    close();
    back?.focus?.();
  });
  document.addEventListener('pointerdown',e=>{
    if(openIndex==null)return;
    if(e.target.closest('.tile[data-category]')||popup.contains(e.target))return;
    close();
  });

  const reflow=()=>{
    if(openIndex==null)return;
    if(!currentTile||!currentTile.isConnected){close();return;}
    position(currentTile);
  };
  addEventListener('resize',reflow);
  addEventListener('scroll',reflow,true);

  return {close,isOpen:()=>openIndex!=null};
}

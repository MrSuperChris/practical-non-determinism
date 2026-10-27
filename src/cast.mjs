// The die is a real 3D object (see dice3d.mjs). Dragging rotates it in space; releasing
// lands the unbiased crypto roll's face toward the viewer and then reveals the result.
// Motion is presentation only: draw() performs the roll WITHOUT mutating state, so a
// cancelled or interrupted spin records no phantom roll; commit() is the only writer.
import {createDie} from './dice3d.mjs';

export function bindCast(root,{canCast,draw,commit,announce}){
  let gesture=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(){
    for(const canvas of root.querySelectorAll('canvas.die-canvas')){
      if(canvas.__die)continue;
      canvas.__die=createDie(canvas,{sides:canvas.dataset.sides==='6'?6:20});
    }
  }
  const observer=new MutationObserver(()=>mount());
  observer.observe(root,{childList:true,subtree:true});

  function dieFor(button){
    const canvas=button.querySelector('canvas.die-canvas');
    if(!canvas)return null;
    if(!canvas.__die)canvas.__die=createDie(canvas,{sides:canvas.dataset.sides==='6'?6:20});
    return canvas.__die;
  }

  function cleanup(g){
    g.button.classList.remove('gathering','casting');
    g.button.removeAttribute('aria-busy');
    if(g.pointerId!==undefined&&g.button.hasPointerCapture?.(g.pointerId))g.button.releasePointerCapture(g.pointerId);
  }
  function cancel(){
    const g=gesture;if(!g)return;
    gesture=null;
    g.die?.stop();
    cleanup(g);
  }
  function begin(button,event){
    const die=dieFor(button);
    const rect=button.getBoundingClientRect();
    const g={button,die,act:button.dataset.act,phase:'dragging',distance:0,
      x:event?.clientX??rect.left+rect.width/2,y:event?.clientY??rect.top+rect.height/2,
      pointerId:event?.pointerId};
    gesture=g;button.classList.add('gathering');return g;
  }
  async function settle(g){
    if(gesture!==g)return;
    g.phase='coasting';g.button.classList.remove('gathering');g.button.classList.add('casting');
    g.button.setAttribute('aria-busy','true');
    if(g.pointerId!==undefined&&g.button.hasPointerCapture?.(g.pointerId))g.button.releasePointerCapture(g.pointerId);
    if(!g.button.isConnected||!canCast()){cancel();return;}
    // Unbiased roll happens here; nothing is written to game state until commit().
    const result=draw(g.act);
    const turns=Math.min(3,2+Math.min(1,g.distance/900));
    try{if(g.die)await g.die.spinTo(result.face,{reduced:reduced(),turns});}catch{/* interrupted */}
    if(gesture!==g)return; // cancelled mid-spin: no commit, so no roll is recorded
    gesture=null;
    g.button.classList.remove('casting');g.button.removeAttribute('aria-busy');
    await commit(g.act,result,g.button);
  }

  root.addEventListener('pointerdown',e=>{
    const button=e.target.closest('.spin-die');
    if(!button||button.disabled||e.button!==0||!e.isPrimary||gesture||!canCast())return;
    begin(button,e);button.setPointerCapture?.(e.pointerId);button.focus({preventScroll:true});
    announce('Spin the die in any direction, then release. Escape cancels.');
  });
  root.addEventListener('pointermove',e=>{
    const g=gesture;if(!g||g.phase!=='dragging'||e.pointerId!==g.pointerId)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    g.die?.rotateByScreen(dx,dy);
    g.distance+=Math.hypot(dx,dy);
    g.x=e.clientX;g.y=e.clientY;
  });
  root.addEventListener('pointerup',e=>{
    const g=gesture;if(g?.phase==='dragging'&&e.pointerId===g.pointerId)settle(g);
  });
  const cancelPointer=e=>{if(gesture?.phase==='dragging'&&e.pointerId===gesture.pointerId)cancel();};
  root.addEventListener('pointercancel',cancelPointer);
  root.addEventListener('lostpointercapture',cancelPointer);
  root.addEventListener('click',e=>{
    const button=e.target.closest('.spin-die');if(!button)return;
    // Pointer release already casts. Native keyboard/assistive activation has detail zero.
    if(e.detail!==0||gesture||button.disabled||!canCast())return;
    settle(begin(button));
  });
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture){cancel();announce('Cast cancelled.');}});
  window.addEventListener('blur',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  mount();
  return {cancel,mount,active:()=>!!gesture};
}

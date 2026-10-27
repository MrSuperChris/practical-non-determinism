// Gesture motion is presentation only. The game engine still chooses an unbiased roll.
export function bindCast(root,{canCast,cast,announce}){
  let gesture=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function paint(g){
    g.face.style.transform=`rotate(${g.angle}deg) scale(${g.phase==='dragging'?1.06:1})`;
  }
  function cancel(){
    const g=gesture;if(!g)return;
    gesture=null;
    g.animation?.cancel();
    g.button.classList.remove('gathering','casting');
    g.button.removeAttribute('aria-busy');
    g.face.style.transform='';
    if(g.pointerId!==undefined&&g.button.hasPointerCapture(g.pointerId))g.button.releasePointerCapture(g.pointerId);
  }
  function begin(button,event){
    const rect=button.getBoundingClientRect();
    const g={button,face:button.querySelector('.die-face'),phase:'dragging',angle:0,velocity:0,distance:0,
      cx:rect.left+rect.width/2,cy:rect.top+rect.height/2,x:event?.clientX??rect.left+rect.width/2,
      y:event?.clientY??rect.top+rect.height/2,time:performance.now(),pointerId:event?.pointerId};
    gesture=g;button.classList.add('gathering');paint(g);return g;
  }
  async function release(g){
    if(gesture!==g)return;
    g.phase='coasting';g.button.classList.remove('gathering');g.button.classList.add('casting');
    g.button.setAttribute('aria-busy','true');
    if(g.pointerId!==undefined&&g.button.hasPointerCapture(g.pointerId))g.button.releasePointerCapture(g.pointerId);
    const direction=Math.sign(g.velocity)||Math.sign(g.angle)||1;
    const coast=g.distance<8?300:Math.max(70,Math.min(440,Math.abs(g.velocity)*200));
    if(!reduced()){
      g.animation=g.face.animate([
        {transform:`rotate(${g.angle}deg) scale(1.06)`},
        {transform:`rotate(${g.angle+direction*coast}deg) scale(1)`}
      ],{duration:620,easing:'cubic-bezier(.16,.7,.22,1)',fill:'forwards'});
      try{await g.animation.finished;}catch{return;}
    }
    if(gesture!==g)return;
    const valid=g.button.isConnected&&canCast();
    const button=g.button;
    // Keep the final pose while the game saves; render() removes the old control.
    gesture=null;button.classList.remove('casting');button.removeAttribute('aria-busy');
    if(valid)await cast(button.dataset.act,button);
    g.animation?.cancel();g.face.style.transform='';
  }
  root.addEventListener('pointerdown',e=>{
    const button=e.target.closest('.spin-die');
    if(!button||button.disabled||e.button!==0||!e.isPrimary||gesture||!canCast())return;
    begin(button,e);button.setPointerCapture(e.pointerId);button.focus({preventScroll:true});
    announce('Spin the die, then release. Escape cancels.');
  });
  root.addEventListener('pointermove',e=>{
    const g=gesture;if(!g||g.phase!=='dragging'||e.pointerId!==g.pointerId)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y,now=performance.now();
    const oldRadius=Math.hypot(g.x-g.cx,g.y-g.cy),radius=Math.hypot(e.clientX-g.cx,e.clientY-g.cy);
    let delta=dx*1.4-dy*.7;
    if(oldRadius>20&&radius>20){
      delta=(Math.atan2(e.clientY-g.cy,e.clientX-g.cx)-Math.atan2(g.y-g.cy,g.x-g.cx))*180/Math.PI;
      if(delta>180)delta-=360;if(delta< -180)delta+=360;
    }
    g.angle+=delta;g.distance+=Math.hypot(dx,dy);
    g.velocity=.55*g.velocity+.45*delta/Math.max(8,now-g.time);
    g.x=e.clientX;g.y=e.clientY;g.time=now;paint(g);
  });
  root.addEventListener('pointerup',e=>{
    const g=gesture;if(g?.phase==='dragging'&&e.pointerId===g.pointerId)release(g);
  });
  const cancelPointer=e=>{if(gesture?.phase==='dragging'&&e.pointerId===gesture.pointerId)cancel();};
  root.addEventListener('pointercancel',cancelPointer);
  root.addEventListener('lostpointercapture',cancelPointer);
  root.addEventListener('click',e=>{
    const button=e.target.closest('.spin-die');if(!button)return;
    // Pointer release already casts. Native keyboard/assistive activation has detail zero.
    if(e.detail!==0||gesture||button.disabled||!canCast())return;
    release(begin(button));
  });
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture){cancel();announce('Cast cancelled.');}});
  window.addEventListener('blur',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  return {cancel};
}

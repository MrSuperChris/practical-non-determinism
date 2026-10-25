export const DURATION = 15 * 60 * 1000;
export const FACE_CATEGORY = [0,1,2,3,4,5,6,7,8,9,10,11,12,5,13,7,14,1,9,15];
export const initialState = () => ({version:1,credits:0,run:0,vetoDate:null,current:null,history:[],rolls:0});
export function localDay(time,zone='America/Chicago') {
  return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time));
}
export function roll(sides,cryptoSource=globalThis.crypto) {
  const a=new Uint32Array(1),limit=Math.floor(2**32/sides)*sides;
  do { cryptoSource.getRandomValues(a); } while(a[0]>=limit);
  return a[0]%sides+1;
}
function finished(state,now,reason) {
  const c=state.current;
  if(!c||c.phase!=='doing')return state;
  const ended=reason==='elapsed'?c.deadline:Math.min(now,c.deadline);
  const bonus=state.run===2,earned=1+Number(!!c.task)+Number(bonus);
  const record={...c,phase:'handled',ended,reason,earned,bonus};
  state.current=record;state.credits+=earned;state.run=bonus?0:state.run+1;
  state.history.push(record);return state;
}
export function reconcile(state,now=Date.now()) {
  if(state.current?.phase==='doing'&&now>=state.current.deadline)finished(state,now,'elapsed');
  return state;
}
export function transition(previous,action,now=Date.now(),zone='America/Chicago') {
  const state=structuredClone(previous);reconcile(state,now);
  let c=state.current;
  // An old tab cannot act on a newer roll/session.
  if(action.expectedId!==undefined&&c?.id!==action.expectedId)return state;
  switch(action.type){
    case 'roll':
      if(c&&c.phase!=='handled')return state;
      if(!Number.isInteger(action.face)||action.face<1||action.face>20)throw Error('Invalid d20 result');
      state.current={id:action.id,phase:'invitation',face:action.face,category:FACE_CATEGORY[action.face-1],mode:null,task:null,rolled:now};state.rolls++;break;
    case 'choose':
      if(c?.phase!=='invitation'||c.face!==1)return state;
      if(!Number.isInteger(action.category)||action.category<1||action.category>15)throw Error('Choose an activity category');
      c.category=action.category;c.chosen=true;break;
    case 'mode':
      if(c?.phase!=='invitation'||c.face===1||[3,15].includes(c.category))return state;
      if(!Number.isInteger(action.mode)||action.mode<0||action.mode>5)throw Error('Invalid d6 result');
      c.mode=action.mode;break;
    case 'start':
      if(c?.phase!=='invitation'||(c.face===1&&!c.chosen))return state;
      c.task=action.task?structuredClone(action.task):null;
      if(c.task)c.mode=null;
      c.phase='doing';c.started=now;c.deadline=now+DURATION;break;
    case 'done':finished(state,now,'done');break;
    case 'veto':
      if(c?.phase!=='invitation')return state;
      if(state.vetoDate===localDay(now,zone)){
        if(state.credits<3)throw Error('Another veto costs 3 credits. You can always choose freely.');
        state.credits-=3;
      }else state.vetoDate=localDay(now,zone);
      state.run=0;state.current=null;break;
    case 'unavailable':if(c?.phase==='invitation')state.current=null;break;
    case 'leave':state.current=null;break;
    case 'next':if(c?.phase==='handled')state.current=null;break;
    case 'reconcile':break;
    default:throw Error('Unknown game action');
  }
  return state;
}
export function handledCount(state,category,mode=null){return state.history.filter(x=>x.category===category&&(mode===null||x.mode===mode)).length;}
export function progress(current,now=Date.now()){return current?.started?Math.min(1,Math.max(0,(now-current.started)/DURATION)):0;}
export function validState(value){
  if(!value||value.version!==1||!Number.isSafeInteger(value.credits)||value.credits<0||![0,1,2].includes(value.run)||!Array.isArray(value.history))return false;
  const validEntry=x=>x&&typeof x.id==='string'&&Number.isInteger(x.category)&&x.category>=0&&x.category<16&&(x.mode===null||Number.isInteger(x.mode)&&x.mode>=0&&x.mode<6)&&['invitation','doing','handled'].includes(x.phase)&&(x.phase!=='doing'||Number.isFinite(x.started)&&Number.isFinite(x.deadline)&&x.deadline-x.started===DURATION);
  return (!value.current||validEntry(value.current))&&value.history.every(x=>validEntry(x)&&x.phase==='handled');
}

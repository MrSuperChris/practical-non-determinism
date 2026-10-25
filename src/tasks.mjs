import {localDay} from './engine.mjs';
export const DEFAULT_TAGS=[[],['home'],['it'],[],['social'],['creative'],['money'],['organizing'],['cooking'],['exercise','fitness','move'],['reading','read'],['browsing','browse'],['watch','watching'],['work'],['thinking'],['outside','outdoors']];
export function taskDate(stamp,task,zone){if(!stamp)return null;if(task.isFloating||/^\d{4}-\d{2}-\d{2}$/.test(stamp))return stamp.slice(0,10);const normalized=stamp.replace(/([+-]\d\d)(\d\d)$/,'$1:$2'),n=Date.parse(normalized);if(!Number.isFinite(n))return null;try{return localDay(n,task.timeZone||zone);}catch{return localDay(n,zone);}}
export function matching(tasks,category,{tags=DEFAULT_TAGS,zone='America/Chicago',now=Date.now(),limit=3}={}){
  const today=localDay(now,zone),wanted=new Set((tags[category]||[]).map(x=>x.toLowerCase()));
  const dated=tasks.filter(t=>t.status!==2&&t.kind!=='NOTE'&&(t.tags||[]).some(x=>wanted.has(x.toLowerCase()))).map(t=>({task:t,start:taskDate(t.startDate,t,zone),due:taskDate(t.dueDate,t,zone)})).filter(t=>!t.start||t.start<=today);
  const isToday=t=>t.due===today||t.start===today||!!(t.start&&t.due&&t.start<=today&&t.due>=today);
  return dated.sort((a,b)=>Number(isToday(b))-Number(isToday(a))||(a.due||'9999').localeCompare(b.due||'9999')||(a.task.createdTime||'9999').localeCompare(b.task.createdTime||'9999')||a.task.id.localeCompare(b.task.id)).slice(0,limit).map(x=>({...x.task,today:isToday(x),dateLabel:x.due}));
}
export function snapshot(t){return {id:String(t.id),projectId:String(t.projectId),title:t.title||'Untitled task',content:t.content||'',desc:t.desc||'',items:(t.items||[]).map(x=>({title:x.title||'',status:x.status})),dueDate:t.dueDate||null,timeZone:t.timeZone||null,isFloating:!!t.isFloating,isAllDay:!!t.isAllDay,tags:t.tags||[]};}
export function taskLink(task){return `https://ticktick.com/webapp/#p/${encodeURIComponent(task.projectId)}/tasks/${encodeURIComponent(task.id)}`;}
export class TickTick {
  constructor({token='',local=false}={}){this.token=token;this.local=local;}
  async get(path){const response=await fetch((this.local?'./__local/ticktick':'https://api.ticktick.com/open/v1')+path,{headers:this.local?{}:{Authorization:'Bearer '+this.token},signal:AbortSignal.timeout(15000),cache:'no-store'});if(!response.ok)throw Error(response.status===401?'TickTick connection was rejected. Reconnect in Settings.':`TickTick could not load (${response.status}).`);return response.json();}
  async load({inboxId='',lists=null}={}){
    const projects=await this.get('/project');
    const selected=projects.filter(p=>!p.closed&&p.name!=='Claude Queue'&&(!lists||lists.includes(p.id)));
    if(inboxId&&!selected.some(p=>p.id===inboxId))selected.unshift({id:inboxId,name:'Inbox'});
    const tasks=[],failed=[];
    for(let start=0;start<selected.length;start+=3){const group=selected.slice(start,start+3),results=await Promise.allSettled(group.map(p=>this.get('/project/'+encodeURIComponent(p.id)+'/data')));results.forEach((r,i)=>{if(r.status==='fulfilled')tasks.push(...(r.value.tasks||[]).map(t=>({...t,projectId:t.projectId||group[i].id,projectName:group[i].name})));else failed.push(group[i].name);});}
    if(failed.length===selected.length&&selected.length)throw Error('TickTick lists could not be loaded. Your own activities are still available.');
    return {tasks,projects,failed,updated:Date.now()};
  }
  async detail(task){return this.get('/project/'+encodeURIComponent(task.projectId)+'/task/'+encodeURIComponent(task.id));}
}

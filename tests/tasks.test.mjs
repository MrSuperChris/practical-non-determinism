import test from 'node:test';
import assert from 'node:assert/strict';
import {matching,taskDate,snapshot,taskLink} from '../src/tasks.mjs';
const now=Date.parse('2026-10-25T17:00:00Z');
const t=(id,date,extra={})=>({id,projectId:'p',tags:['creative'],status:0,dueDate:date,...extra});
test('today first, then oldest due, then undated; future and completed tasks excluded',()=>{const tasks=[t('old','2026-10-20'),t('today','2026-10-25'),t('undated',null),t('newer','2026-10-24'),t('future','2026-10-28',{startDate:'2026-10-26'}),t('done','2026-10-25',{status:2}),t('wrong','2026-10-25',{tags:['it']})];assert.deepEqual(matching(tasks,5,{now,limit:10}).map(x=>x.id),['today','old','newer','undated']);assert.equal(matching(tasks,5,{now}).length,3);});
test('date ranges covering today are prioritized, using the oldest due within the group',()=>{const tasks=[t('span','2026-10-28',{startDate:'2026-10-23'}),t('overdue','2026-10-21'),t('today','2026-10-25')];assert.deepEqual(matching(tasks,5,{now}).map(x=>x.id),['today','span','overdue']);});
test('timestamps honor task timezone; floating dates remain literal',()=>{assert.equal(taskDate('2026-10-25T02:00:00.000+0000',{},'America/Chicago'),'2026-10-24');assert.equal(taskDate('2026-10-25T00:00:00.000+0000',{isFloating:true},'America/Chicago'),'2026-10-25');assert.equal(taskDate('nonsense',{},'America/Chicago'),null);});
test('only selected details are saved; deep links encode identifiers',()=>{const saved=snapshot({...t('a/b','2026-10-25'),title:'<script>',secret:'do not retain',items:[{title:'One',status:0}]});assert.equal(saved.secret,undefined);assert.equal(saved.title,'<script>');assert.match(taskLink(saved),/a%2Fb$/);});

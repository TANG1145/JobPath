import test from 'node:test';import assert from 'node:assert/strict';
import {assistantPrompt,collectContext} from '../backend/assistant.mjs';
import {aiTasks,aiContext} from '../src/ai-plan.js';
import {validateBackup} from '../src/domain.js';
import {validDate,addDays} from '../src/planning.js';

test('AI规划提示不再嵌入三项、七节点或80%容量门槛',()=>{
 const prompt=assistantPrompt('personal_plan');assert.doesNotMatch(prompt,/最多7|最多3|hours\*48/);assert.match(prompt,/hours\*60/);
 const tasks=Array.from({length:15},(_,i)=>({title:'任务'+i,status:'待做',minutes:180,jobId:'a'}));
 const context=aiContext({tasks,applications:[],hours:100,weeks:60,targetId:'a'},'2026-11-05');assert.equal(context.tasks.length,15);assert.equal(collectContext(context).tasks.length,15);assert.equal(collectContext({...context,weeks:60}).profile.weeks,60);
});
test('长计划、长任务与完整对话存档可采用和备份',()=>{
 const plan={title:'长计划',summary:'逐步实践',at:'2026-11-05T00:00:00Z',days:Array.from({length:14},(_,i)=>({day:addDays('2026-11-05',i),task:'完成实践并验证'+i,minutes:180}))};
 const tasks=aiTasks(plan,{jobId:'a',hours:1,start:'2026-11-05',weeks:1});assert.equal(tasks.length,14);assert.ok(tasks.every(t=>validDate(t.date)&&t.minutes===180));
 const data={direction:'web',hours:100,jobs:[{id:'a',direction:'web',title:'岗位',company:'',jd:'原文'}],tasks,applications:[],answers:[],aiWeeks:60,aiWorkspace:{a:{plans:Array.from({length:12},()=>structuredClone(plan)),messages:Array.from({length:30},()=>({role:'assistant',text:'建议'}))}}};
 assert.equal(validateBackup({app:'jobpath',schemaVersion:1,data}).aiWorkspace.a.messages.length,30);
});
test('自行导出的长记录不被旧数量或文字阈值阻止恢复',()=>{
 const data={direction:'web',hours:8,jobs:[],tasks:Array.from({length:1001},(_,i)=>({id:'task-'+i,title:'实践'+i,minutes:30,status:'待做',evidence:''})),applications:[],answers:[],aiWorkspace:{general:{plans:[],messages:[{role:'user',text:'中'.repeat(40000)}]}}};
 assert.equal(validateBackup({app:'jobpath',schemaVersion:1,data}).tasks.length,1001);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {collectContext,assistantPrompt} from '../backend/assistant.mjs';
import {validateInput,validateOutput,deepseek,runAI,CONSENT} from '../backend/ai.mjs';
import {Quota} from '../backend/quota.mjs';
import {validateBackup} from '../src/domain.js';
const context={direction:'web',hours:8,today:'2026-11-05'};
const candidate=collectContext(context).candidates[0];
const draft=()=>({title:'适合你的机会',summary:'根据已有实践匹配，核实资格后行动',matches:[{jobId:candidate.id,reason:'已有页面实践可用于展示',fit:'可以尝试',preparation:'核实实习时长并整理项目'}]});
test('岗位匹配候选保留来源，排除已归档或移除的岗位',()=>{
 assert.ok(candidate.source.startsWith('https://'));assert.ok(!collectContext({...context,excludedJobIds:[candidate.id]}).candidates.some(j=>j.id===candidate.id));
 assert.match(assistantPrompt('job_match'),/不能重复/);assert.match(assistantPrompt('job_match'),/实时全网搜索/);
});
test('岗位匹配接受真实目录与空结果，拒绝虚构、重复、错误适配标签及缺字段',()=>{
 assert.equal(validateOutput('job_match',draft(),'',context).matches[0].jobId,candidate.id);
 assert.deepEqual(validateOutput('job_match',{...draft(),matches:[]},'',context).matches,[]);
 for(const matches of [[{...draft().matches[0],jobId:'invented'}],[...draft().matches,...draft().matches],[{...draft().matches[0],fit:'100%匹配'}],[{jobId:candidate.id}],[null]])assert.throws(()=>validateOutput('job_match',{...draft(),matches},'',context),{status:422});
 assert.throws(()=>validateOutput('job_match',draft(),'',{...context,excludedJobIds:[candidate.id]}),{status:422});
});
test('岗位匹配实际供应商协议包含画像、进度与候选工具，返回JSON',async()=>{
 const request={mode:'job_match',consentVersion:CONSENT,payload:{answer:'寻找前端实习',context:{...context,tasks:[{title:'响应式页面',status:'完成',minutes:45}]}}};validateInput(request);
 let messages;const output=await deepseek(request,{key:'synthetic-only',fetchImpl:async(url,options)=>{messages=JSON.parse(options.body).messages;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(draft())}}],usage:{prompt_tokens:100,completion_tokens:50}}))}});
 assert.equal(output.data.matches[0].jobId,candidate.id);const tools=JSON.parse(messages[1].content).tools;assert.equal(tools.tasks[0].title,'响应式页面');assert.ok(tools.candidates.some(j=>j.id===candidate.id));
});
test('匹配结果随完整备份往返，兼容旧备份并拒绝损坏结构',()=>{
 const data={...context,jobs:[],tasks:[],applications:[],answers:[],opportunityMatch:{...draft(),direction:'web',query:'实习',at:'2026-11-05T12:00:00Z'}};
 const backup={app:'jobpath',schemaVersion:1,data};assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(backup))).opportunityMatch,data.opportunityMatch);
 delete data.opportunityMatch;assert.doesNotThrow(()=>validateBackup(backup));data.opportunityMatch={...draft(),direction:'web',query:'',at:'2026-11-05',matches:[null]};assert.throws(()=>validateBackup(backup));
});
test('匹配模式通过实际AI网关流程与既有调用记录共用，不自动写入申请',async()=>{
 const quota=new Quota(':memory:');quota.invite('synthetic',Date.now()+86400000);try{const result=await runAI({mode:'job_match',consentVersion:CONSENT,payload:{answer:'匹配实习岗位',context}},{quota,token:'synthetic',key:crypto.randomUUID(),enabled:true,provider:async()=>({data:draft(),usage:{prompt_tokens:30,completion_tokens:50}})});assert.equal(result.mode,'job_match');assert.equal(result.data.matches[0].jobId,candidate.id);assert.ok(result.workflow.toolsUsed.includes('find_catalog_jobs'));assert.equal(quota.counts('synthetic').daily,1)}finally{quota.close()}
});
test('自评和项目标记进入画像，未知不会被冒充为能力，已投递来源可识别',()=>{
 const tools=collectContext({...context,ratings:{JavaScript:2,invalid:99},projectEvidence:0,interests:{web:4},applications:[{title:'合成申请',source:candidate.source,stage:'已投递'}]});assert.deepEqual(tools.profile.selfRatings,{JavaScript:2});assert.equal(tools.profile.projectEvidence,0);assert.equal(tools.profile.interest,4);assert.equal(tools.applications[0].source,candidate.source);assert.equal(collectContext(context).profile.projectEvidence,null);
});

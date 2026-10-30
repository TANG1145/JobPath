import {z} from 'zod';
// Keep schema validation compatible with the strict script-src self policy.
z.config({jitless:true});
const id=z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_~:-]{0,159}$/,'标识含不支持字符'),text=z.string().max(32000),date=z.string().refine(s=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'日期无效');
const base={id,createdAt:z.number().finite(),updatedAt:z.number().finite(),revision:z.number().int().nonnegative()};
const optionalId=id.nullable().default(null),ids=z.array(id).max(1000).default([]);
const url=z.string().max(2000).refine(s=>{if(!s)return true;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}},'链接须为HTTPS且不包含凭据');
export const stages=z.enum(['收藏','准备','已投递','笔试','面试','Offer','拒绝','撤回']);
export const schemas={
 profiles:z.object({...base,direction:z.enum(['java','web','test']).nullable(),hours:z.number().min(0).max(80).nullable(),days:z.array(z.number().int().min(0).max(6)),timezone:z.string(),ratings:z.record(z.string(),z.number().int().min(0).max(3)),focusJobId:optionalId,preferences:z.record(z.string(),z.unknown()).default({})}),
 jobs:z.object({...base,title:text,company:text,direction:z.enum(['java','web','test']).nullable(),priority:z.number().int().min(0).max(3),activeSnapshotId:id,archived:z.boolean()}),
 snapshots:z.object({...base,jobId:id,version:z.number().int().positive(),raw:text,source:url,checkedAt:z.string(),sourceKind:z.string(),pending:z.boolean(),legacy:z.record(z.string(),z.unknown()).optional()}),
 requirements:z.object({...base,snapshotId:id,kind:z.enum(['required','preferred','unknown']),skills:z.array(z.string().min(1).max(100)).min(1).max(40),logic:z.enum(['all','any']),level:z.number().int().min(1).max(3),quote:text,confirmed:z.boolean()}),
 tasks:z.object({...base,key:z.string(),title:text,type:z.enum(['learning','verification','expression','action']),skill:z.string(),status:z.enum(['待做','进行中','完成','暂缓']),date,minutes:z.number().int().min(1).max(90),deps:ids,acceptance:text,why:text,pinned:z.boolean(),order:z.number().finite(),deferredUntil:date,legacy:z.record(z.string(),z.unknown()).optional()}),
 taskRequirements:z.object({...base,taskId:id,requirementId:id}),
 evidence:z.object({...base,title:text,contribution:text,validation:text,result:text,url,proof:z.enum(['self_reported','legacy_self_reported']),legacy:z.boolean()}),
 evidenceLinks:z.object({...base,evidenceId:id,requirementId:id,note:text,confirmed:z.boolean()}),
 taskEvidence:z.object({...base,taskId:id,evidenceId:id}),
 plans:z.object({...base,start:date,weeks:z.union([z.literal(4),z.literal(8)]),hours:z.number().min(0).max(80),jobIds:ids,status:z.enum(['active','archived']),version:z.number().int().positive(),overview:z.array(z.unknown()),legacy:z.unknown().optional()}),
 planItems:z.object({...base,planId:id,taskId:id,date,minutes:z.number().int().min(1).max(90)}),
 applications:z.object({...base,jobId:optionalId,snapshotId:optionalId,title:text,stage:stages,appliedDate:date,nextDate:date,nextAction:text,offer:z.record(z.string(),z.string()).default({}),pending:z.boolean()}),
 rounds:z.object({...base,applicationId:id,name:text,date,status:z.enum(['待安排','已安排','已完成','取消']),note:text}),
 materials:z.object({...base,jobId:optionalId,title:text,purpose:text,body:text,evidenceIds:ids,version:z.number().int().positive(),familyId:id,confirmed:z.boolean(),source:z.enum(['manual','ai_draft','legacy'])}),
 applicationMaterials:z.object({...base,applicationId:id,materialVersionId:id,usedAt:date}),
 sessions:z.object({...base,jobId:optionalId,evidenceId:optionalId,title:text,context:z.record(z.string(),z.unknown()),status:z.enum(['active','closed','legacy']),lastOpenedAt:z.number().finite()}),
 turns:z.object({...base,sessionId:id,question:text,source:z.enum(['user','template','legacy','ai']),order:z.number().int().nonnegative()}),
 answers:z.object({...base,turnId:id,body:text,version:z.number().int().positive()}),
 feedback:z.object({...base,answerVersionId:optionalId,sessionId:optionalId,body:z.record(z.string(),z.unknown()),source:z.string(),model:z.string(),generatedAt:z.number().finite(),accepted:z.boolean(),pending:z.boolean()}),
 drafts:z.object({...base,key:id,baseRevision:z.number().int().nonnegative(),body:z.record(z.string(),z.unknown())}),
 events:z.object({...base,objectId:z.string(),type:z.string(),at:z.number().finite(),meta:z.record(z.string(),z.unknown())}),
 history:z.object({...base,title:text,body:z.unknown(),pending:z.boolean()}),
};
export type Table=keyof typeof schemas;
export const tables=Object.keys(schemas) as Table[];
export type RecordData={id:string;createdAt:number;updatedAt:number;revision:number;[key:string]:any};
export type Dataset=Record<Table,RecordData[]>;
export const emptyDataset=():Dataset=>Object.fromEntries(tables.map(t=>[t,[]])) as unknown as Dataset;
export function validateDataset(input:unknown):Dataset{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('数据格式无效');
 const source=input as Record<string,unknown>;const data=emptyDataset();
 for(const table of tables){const rows=source[table];if(!Array.isArray(rows)||rows.length>10000)throw Error(`${table} 数量或格式无效`);data[table]=rows.map(row=>schemas[table].parse(row)) as RecordData[];const seen=new Set();for(const r of data[table]){if(seen.has(r.id))throw Error(`${table} 存在重复ID`);seen.add(r.id);}}
 if(data.profiles.length!==1||data.profiles[0].id!=='profile')throw Error('必须有且只有一个本机画像');
 const unique=(table:Table,key:(r:RecordData)=>string)=>{const seen=new Set();for(const r of data[table]){const k=key(r);if(seen.has(k))throw Error(`${table} 重复版本或关联`);seen.add(k)}};
 unique('applicationMaterials',r=>JSON.stringify([r.applicationId,r.materialVersionId,r.usedAt]));unique('snapshots',r=>r.jobId+':'+r.version);unique('materials',r=>r.familyId+':'+r.version);unique('answers',r=>r.turnId+':'+r.version);unique('turns',r=>r.sessionId+':'+r.order);unique('evidenceLinks',r=>r.evidenceId+':'+r.requirementId);unique('taskEvidence',r=>r.taskId+':'+r.evidenceId);unique('taskRequirements',r=>r.taskId+':'+r.requirementId);
 const exists=(table:Table,key:string|null)=>key===null||data[table].some(r=>r.id===key);
 const ref=(table:Table,key:string|null)=>{if(!exists(table,key))throw Error(`损坏引用：${table}/${key}`)};
 for(const p of data.profiles)ref('jobs',p.focusJobId);
 for(const j of data.jobs){ref('snapshots',j.activeSnapshotId);if(data.snapshots.find(s=>s.id===j.activeSnapshotId)?.jobId!==j.id)throw Error('岗位快照归属不符');}
 for(const s of data.snapshots)ref('jobs',s.jobId);
 for(const r of data.requirements){ref('snapshots',r.snapshotId);if(r.confirmed&&(!r.quote||!data.snapshots.find(s=>s.id===r.snapshotId)?.raw.includes(r.quote)))throw Error('已确认要求缺少原文依据');}
 for(const t of data.tasks)for(const dep of t.deps)ref('tasks',dep);
 const visiting=new Set(),seen=new Set();function visit(id:string){if(visiting.has(id))throw Error('任务先修循环');if(seen.has(id))return;visiting.add(id);for(const dep of data.tasks.find(t=>t.id===id)?.deps||[])visit(dep);visiting.delete(id);seen.add(id)}for(const t of data.tasks)visit(t.id);
 for(const x of data.taskRequirements){ref('tasks',x.taskId);ref('requirements',x.requirementId)}
 for(const x of data.evidenceLinks){ref('evidence',x.evidenceId);ref('requirements',x.requirementId)}
 for(const x of data.taskEvidence){ref('tasks',x.taskId);ref('evidence',x.evidenceId)}
 for(const p of data.plans)for(const j of p.jobIds)ref('jobs',j);
 if(data.plans.filter(p=>p.status==='active').length>1)throw Error('只能有一个活动计划');
 for(const x of data.planItems){ref('plans',x.planId);ref('tasks',x.taskId)}
 for(const a of data.applications){ref('jobs',a.jobId);ref('snapshots',a.snapshotId);if(a.snapshotId&&data.snapshots.find(s=>s.id===a.snapshotId)?.jobId!==a.jobId)throw Error('申请快照归属不符');}
 for(const r of data.rounds)ref('applications',r.applicationId);
 for(const m of data.materials){ref('jobs',m.jobId);for(const e of m.evidenceIds)ref('evidence',e)}
 for(const x of data.applicationMaterials){ref('applications',x.applicationId);ref('materials',x.materialVersionId);if(!data.materials.find(m=>m.id===x.materialVersionId)?.confirmed)throw Error('投递材料必须由用户确认');}
 for(const s of data.sessions){ref('jobs',s.jobId);ref('evidence',s.evidenceId)}
 for(const t of data.turns)ref('sessions',t.sessionId);
 for(const a of data.answers)ref('turns',a.turnId);
 for(const f of data.feedback){ref('answers',f.answerVersionId);ref('sessions',f.sessionId)}
 // Link cancellation must not silently remove the referenced evidence.
 for(const t of data.tasks)if(t.status==='完成'&&t.type!=='action'&&!t.legacy&&!data.taskEvidence.some(x=>x.taskId===t.id))throw Error('实践任务完成需要关联成果');
 return data;
}
export const envelope=z.object({app:z.literal('jobpath'),schemaVersion:z.literal(2),exportedAt:z.string(),data:z.unknown()});
export function readBackup(value:unknown){const e=envelope.parse(value);return validateDataset(e.data)}

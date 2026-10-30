import {z} from 'zod';
z.config({jitless:true});
const text=z.string().min(1).max(6000),id=z.string().regex(/^[\w~:-]{1,160}$/),short=z.string().max(1000);
const ref=z.object({table:z.enum(['jobs','snapshots','evidence','answers','turns']),id,revision:z.number().int().nonnegative()}).strict();
const evidence=z.object({id,revision:z.number().int().nonnegative(),title:text,contribution:text,validation:text,result:z.string().max(6000)}).strict();
export const sceneRequest=z.object({scene:z.enum(['jd-organize','evidence-expression','answer-feedback']),sceneVersion:z.literal(1),consent:z.literal('v08-mock-1'),contextVersions:z.array(ref).min(1).max(20),payload:z.unknown()}).strict().superRefine((r,ctx)=>{const schemas={
 'jd-organize':z.object({raw:text,snapshotId:id}).strict(),
 'evidence-expression':z.object({jobId:id,requirements:z.array(short).max(20),purpose:text,evidence:z.array(evidence).min(1).max(5)}).strict(),
 'answer-feedback':z.object({sessionId:id,turnId:id,answerId:id,question:text,answer:text,dimensions:z.array(short).min(1).max(5)}).strict()
};const parsed=schemas[r.scene].safeParse(r.payload);if(!parsed.success)ctx.addIssue({code:'custom',message:'上下文缺失或过长，请精简后再预览'});});
export function validateSceneRequest(input){const r=sceneRequest.parse(input),p=r.payload;const needed=r.scene==='jd-organize'?[['snapshots',p.snapshotId]]:r.scene==='evidence-expression'?[['jobs',p.jobId],...p.evidence.map(e=>['evidence',e.id])]:[['turns',p.turnId],['answers',p.answerId]];if(needed.some(([table,id])=>!r.contextVersions.some(ref=>ref.table===table&&ref.id===id)))throw Error('上下文缺少必要版本引用');return r}
const list=z.array(short).max(10);
export function validateSceneOutput(request,input){const p=request.payload;let output;
 if(request.scene==='jd-organize'){output=z.object({requirements:z.array(z.object({kind:z.enum(['required','preferred','unknown']),logic:z.enum(['all','any']),skills:z.array(z.string().min(1).max(100)).min(1).max(10),level:z.number().int().min(1).max(3),quote:text}).strict()).max(10),unknown:list,questions:list}).strict().parse(input);if(output.requirements.some(r=>!p.raw.includes(r.quote)))throw Error('要求引用不在原文中');}
 else if(request.scene==='evidence-expression'){output=z.object({paragraphs:z.array(z.object({text, evidenceId:id,quote:text}).strict()).min(1).max(5),missing:list}).strict().parse(input);if(output.paragraphs.some(r=>!p.evidence.some(e=>e.id===r.evidenceId&&[e.contribution,e.validation,e.result].some(t=>t.includes(r.quote)))))throw Error('表达缺少有效事实引用');}
 else{output=z.object({quote:text,covered:short,gaps:short,actions:short,followup:short}).strict().parse(input);if(!p.answer.includes(output.quote))throw Error('反馈引用不在回答中');}return output;
}
export function mockScene(request){const p=request.payload;if(request.scene==='jd-organize')return {requirements:[{kind:'unknown',logic:'all',skills:['待核实技能'],level:1,quote:p.raw.slice(0,300)}],unknown:['模拟器不判断技能或要求强度'],questions:['请对照原文手动核对技能、性质和等级']};if(request.scene==='evidence-expression')return {paragraphs:p.evidence.map(e=>({text:e.contribution,evidenceId:e.id,quote:e.contribution})),missing:['模拟器仅复述所选事实；请本人核对岗位适用性和验证说明']};return {quote:p.answer.slice(0,300),covered:'模拟响应仅引用已保存回答，不评判能力',gaps:'请自行核对题目是否得到回答及证据是否充分',actions:'核对引用对应的验证过程，记录尚缺的依据',followup:'你如何验证这项结论？'};}

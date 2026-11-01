import {categories} from './opportunity-categories.js';
import {validateApplication} from './applications.js';
import {validateOffer,validDate} from './planning.js';
export function validateBackup(x){if(x?.app!=='jobpath'||x.schemaVersion!==1||!x.data||!categories.some(c=>c.id===x.data.direction)||!Number.isFinite(x.data.hours)||x.data.hours<0||x.data.hours>80)throw Error('备份格式或版本不受支持');for(const key of ['tasks','jobs','applications','answers'])if(!Array.isArray(x.data[key])||x.data[key].length>1000)throw Error('备份数据不完整');for(const t of x.data.tasks)if(typeof t.title!=='string'||typeof t.evidence!=='string'||!['待做','进行中','完成','暂缓'].includes(t.status)||!Number.isFinite(t.minutes))throw Error('任务格式错误');for(const j of x.data.jobs)if(typeof j.title!=='string'||typeof j.company!=='string'||typeof j.jd!=='string'||typeof j.id!=='string'||!categories.some(c=>c.id===j.direction))throw Error('岗位格式错误');for(const a of x.data.applications)if(typeof a.title!=='string'||typeof a.stage!=='string'||typeof a.note!=='string')throw Error('申请格式错误');for(const a of x.data.answers)if(typeof a!=='string')throw Error('回答格式错误');validateExtended(x.data);return x.data;}

function validateExtended(d){
 if(d.recruitmentSaves!==undefined){if(!Array.isArray(d.recruitmentSaves)||d.recruitmentSaves.length>1000)throw Error('招聘收藏格式错误');const ids=new Set();for(const r of d.recruitmentSaves){if(!r||['id','title','company','category','city','experience','summary','eligibility','source'].some(k=>typeof r[k]!=='string'||r[k].length>20000)||ids.has(r.id)||!/^https:\/\//.test(r.source))throw Error('招聘收藏格式错误');ids.add(r.id);}}

 const fail=()=>{throw Error('备份字段或引用不合法')};
 function walk(v,depth=0){if(depth>20)fail();if(typeof v==='string'&&v.length>32000)fail();if(v&&typeof v==='object'){for(const [k,x] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))fail();walk(x,depth+1)}}}walk(d);
 const ids=new Set();for(const j of d.jobs){if(!/^[a-zA-Z0-9-]{1,80}$/.test(j.id)||ids.has(j.id))fail();ids.add(j.id);if(j.source){try{const u=new URL(j.source);if(u.protocol!=='https:'||u.username||u.password)fail()}catch{fail()}}if(j.requirements){if(!Array.isArray(j.requirements)||j.requirements.length>100)fail();for(const r of j.requirements)if(!['required','preferred'].includes(r.kind)||!['all','any'].includes(r.logic)||![1,2,3].includes(r.level)||!Array.isArray(r.skills)||!r.skills.length||r.skills.some(s=>typeof s!=='string')||typeof r.quote!=='string'||!j.jd.includes(r.quote))fail()}}
 if(d.targetId&&!ids.has(d.targetId))fail();for(const j of d.jobs){for(const k of ['archived','removed'])if(j[k]!==undefined&&typeof j[k]!=='boolean')fail();if(j.recordStage!==undefined&&!['summary','full'].includes(j.recordStage))fail();for(const k of ['savedAt','updatedAt'])if(j[k]!==undefined&&(!Number.isFinite(j[k])||j[k]<0))fail();}const appIds=new Set();for(const a of d.applications){validateApplication(a);if(a.id){if(appIds.has(a.id))fail();appIds.add(a.id)}if(a.offer)validateOffer(a.offer);if(a.jobId&&!ids.has(a.jobId))fail();if(!['收藏','准备','已投递','笔试','面试','Offer','拒绝','撤回'].includes(a.stage))fail()}
 const taskIds=new Set();for(const t of d.tasks){if(typeof t.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(t.id)||taskIds.has(t.id)||t.minutes<=0||t.minutes>90)fail();taskIds.add(t.id);if(t.jobId&&!ids.has(t.jobId))fail();if(t.status==='完成'&&t.evidence.trim().length<10)fail()}
 if(d.ratings&&(typeof d.ratings!=='object'||Object.values(d.ratings).some(v=>!Number.isInteger(v)||v<0||v>3)))fail();
 if(d.days&&(!Array.isArray(d.days)||d.days.some(v=>!Number.isInteger(v)||v<0||v>6)))fail();
 for(const k of ['plans','backlog','events'])if(d[k]&&!Array.isArray(d[k]))fail();
 if(d.events?.some(e=>!e||!Number.isFinite(e.at)||typeof e.type!=='string'))fail();
 if(d.plans?.some(p=>!p||!Number.isFinite(p.createdAt)||!Array.isArray(p.tasks)||p.tasks.some(t=>!t||typeof t.title!=='string'||typeof t.evidence!=='string')))fail();
 if(d.backlog?.some(t=>!t||typeof t.title!=='string'||!Number.isFinite(t.minutes)||typeof t.reason!=='string'))fail();
 if(d.deadline&&!validDate(d.deadline))fail();
 if(d.targetSchedules&&(typeof d.targetSchedules!=='object'||Array.isArray(d.targetSchedules)||Object.keys(d.targetSchedules).some(k=>!ids.has(k)||d.targetSchedules[k]?.jobId!==k)))fail();
 for(const p of [d.activePlan,...Object.values(d.targetSchedules||{})].filter(Boolean)){const validTask=t=>t&&typeof t.key==='string'&&typeof t.title==='string'&&Number.isInteger(t.minutes)&&t.minutes>0&&t.minutes<=90&&(!t.date||validDate(t.date));if(![4,8].includes(p.weeks)||!validDate(p.start)||!Number.isFinite(p.hours)||p.hours<0||p.hours>80||!Array.isArray(p.rows)||p.rows.length!==p.weeks||!Array.isArray(p.backlog)||p.backlog.length>1000||p.backlog.some(t=>!validTask(t))||p.rows.some(r=>!validDate(r.start)||!validDate(r.end)||!Array.isArray(r.tasks)||r.tasks.length>21||r.tasks.some(t=>!validTask(t))||!Number.isFinite(r.spent)||r.spent<0||!Number.isFinite(r.used)||r.used<0||!Number.isFinite(r.capacity)||r.capacity<0||r.used>r.capacity))fail();if(p.jobId&&!ids.has(p.jobId))fail();}


 if(d.interests&&(typeof d.interests!=='object'||Object.values(d.interests).some(v=>!Number.isInteger(v)||v<0||v>4)))fail();
 if(d.feedback&&(typeof d.feedback!=='object'||Array.isArray(d.feedback)))fail();
 const sensitive=['token','apiKey','invite','DEEPSEEK_API_KEY','authorization'];for(const k of sensitive)if(k in d)fail();

}

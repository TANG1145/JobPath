export const validStage=s=>typeof s==='string'&&s.trim().length>0&&s.length<=60;
export const stages=['收藏','准备','已投递','笔试','面试','Offer','拒绝','撤回'];
const dateOK=s=>typeof s==='string'&&(!s||/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s);
export function validateApplication(a){
 if(!validStage(a.stage))throw Error('请填写阶段名称');
 if(a.id!==undefined&&(typeof a.id!=='string'||!a.id||a.id.length>80))throw Error('申请标识无效');
 for(const key of ['date','appliedDate'])if(a[key]!==undefined&&!dateOK(a[key]))throw Error('申请日期无效');
 if(a.history!==undefined){if(!Array.isArray(a.history)||a.history.length>1000)throw Error('阶段历史无效');for(const h of a.history)if(!h||!Number.isFinite(h.at)||!validStage(h.from)||!validStage(h.to)||typeof h.reason!=='string'||h.reason.length>1000)throw Error('阶段历史无效');}
 if(a.rounds!==undefined){if(!Array.isArray(a.rounds)||a.rounds.length>100)throw Error('面试轮次无效');const ids=new Set();for(const r of a.rounds){if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>100||!dateOK(r.date)||!['待安排','已安排','已完成','取消'].includes(r.status)||typeof r.note!=='string'||r.note.length>4000)throw Error('面试轮次无效');for(const k of ['time','endTime'])if(r[k]!==undefined&&r[k]!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(r[k]))throw Error('面试时间无效');if(r.time&&!r.date||r.endTime&&(!r.time||r.endTime<=r.time))throw Error('面试起止时间无效');ids.add(r.id);}}
 return a;
}
export function changeStage(a,to,{reason='',appliedDate=a.appliedDate||'',at=Date.now()}={}){
 if(!validStage(to)||!dateOK(appliedDate)||typeof reason!=='string'||reason.length>1000)throw Error('阶段或日期无效');
 if(to===a.stage)return a;
 if((a.history||[]).length>=1000)throw Error('阶段历史已达1000条，请先导出整理');
 return validateApplication({...a,stage:to,appliedDate,history:[...(a.history||[]),{from:a.stage,to,reason,at}]});
}

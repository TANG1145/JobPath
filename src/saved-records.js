import {categories} from './opportunity-categories.js';
export const occupationName=id=>categories.find(c=>c.id===id)?.title||'方向待确认';
export const hasTemplate=id=>['web','java','test'].includes(id);
export const recordStage=j=>j.recordStage||(j.publicId&&j.requirementsComplete===false?'summary':'full');
export const contentLabel=j=>recordStage(j)==='summary'?'招聘摘要':j.requirements?.length?'要求已整理':'已补充原文';
export function savedRecords(state){return [...state.jobs.filter(j=>!j.removed).map(j=>({...j,key:'job:'+j.id})),...(state.recruitmentSaves||[]).map(r=>({...r,key:'recruit:'+r.id,direction:r.category,jd:r.summary||'',recordStage:'summary'}))]}
export function filterSaved(records,{q='',qualification='',archive='active',sort='saved'}={}){
 return records.filter(j=>(archive==='all'||(archive==='archived'?j.archived:!j.archived))&&(!qualification||(j.qualification||'待确认')===qualification)&&[j.title,j.company,j.city,occupationName(j.direction)].join(' ').toLowerCase().includes(q.trim().toLowerCase())).sort((a,b)=>sort==='deadline'?(Date.parse(a.expires)||Infinity)-(Date.parse(b.expires)||Infinity):((sort==='updated'?b.updatedAt:b.savedAt)||0)-((sort==='updated'?a.updatedAt:a.savedAt)||0));
}
export function fromRecruitment(r){return {...structuredClone(r),id:crypto.randomUUID(),publicId:r.id,direction:r.category||r.direction,company:r.company||'',jd:r.jd||r.summary||'',recordStage:'summary',qualification:r.qualification||'待确认',savedAt:r.savedAt||Date.now(),updatedAt:Date.now(),requirementsComplete:false}}

import {validateApplication} from './applications.js';
export function addInterviewSuggestion(application,milestone,planStamp){
 const key=JSON.stringify([planStamp||'',milestone.date,milestone.title]);const rounds=application.rounds||[];if(rounds.some(r=>r.aiSuggestionKey===key))throw Error('这条面试建议已经加入记录，请编辑已有轮次');
 return validateApplication({...application,rounds:[...rounds,{id:crypto.randomUUID(),name:milestone.title,date:milestone.date,status:'待安排',note:milestone.preparation,aiSuggestionKey:key}]});
}
export function applicationForCandidate(applications,candidate){
 if(!candidate)throw Error('岗位目录已变化，请重新生成建议');if(applications.some(a=>a.source===candidate.source))throw Error('台账已有该岗位，请在已有记录中更新');
 return validateApplication({id:crypto.randomUUID(),title:candidate.company+' / '+candidate.title,stage:'收藏',note:'核对官网资格与在招状态后准备简历',date:'',appliedDate:'',source:candidate.source,jobId:null});
}

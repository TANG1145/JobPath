import {schedule} from './workflow.js';
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function addDays(value,n){if(!validDate(value))throw Error('日期无效');const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
// Expand before scheduling, so partially scheduled work cannot be counted as complete.
export function splitTasks(items){const seen=new Set();return items.map(t=>{if(!t.key||seen.has(t.key)||!Number.isInteger(t.minutes)||t.minutes<1)throw Error('任务标识或估时无效');seen.add(t.key);return {...t,deps:t.deps||[]}});}
export function roadmap(items,{weeks=4,start,hours,deadline='',days=[0,1,2,3,4,5,6],completed=[],reserved=[]}){
 if((!Number.isInteger(weeks)||weeks<1)||!validDate(start)||(deadline&&!validDate(deadline))||!Array.isArray(days)||days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('计划周期、日期或可用日无效');
 let pending=splitTasks(items).filter(t=>!completed.includes(t.key));const placed=[...completed],rows=[];const capacity=Math.floor(hours*60);
 for(let i=0;i<weeks;i++){const date=addDays(start,i*7),end=addDays(date,6),fixed=reserved.filter(t=>t.date>=date&&t.date<=end),spent=fixed.reduce((n,t)=>n+(t.minutes||0),0);const result=schedule(pending,{hours,start:date,deadline,days,completed:placed,reserved:fixed,budget:Math.max(0,capacity-spent)});rows.push({number:i+1,start:date,end,capacity,spent,used:result.used,tasks:result.tasks});const keys=new Set(result.tasks.map(t=>t.key));placed.push(...keys);pending=pending.filter(t=>!keys.has(t.key));}
 return {weeks,start,deadline,hours,days,rows,backlog:pending,capacity};
}
export const offerFields=[['content','岗位内容'],['city','城市'],['compensation','薪酬结构'],['probation','试用期'],['learning','学习机会'],['deadline','回复截止日期'],['questions','待向公司确认事项']];
export function validateOffer(offer){if(!offer||typeof offer!=='object'||Array.isArray(offer))throw Error('Offer 格式无效');for(const [key]of offerFields){if(typeof offer[key]!=='string'||offer[key].length>2000)throw Error('Offer 字段无效');}if(offer.deadline&&!validDate(offer.deadline))throw Error('Offer 截止日期无效');return offer;}

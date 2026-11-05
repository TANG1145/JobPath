import {createLearningTask} from './learning-plan.js';
import {validDate} from './planning.js';
export function aiTasks(plan,{jobId,hours,start,weeks=4,existing=[],days=[0,1,2,3,4,5,6],deadline=''}){
 if(!jobId)throw Error('请先选择目标岗位');return plan.days.map(d=>{if(!validDate(d.day))throw Error('请为任务填写有效日期');if(!Number.isInteger(d.minutes)||d.minutes<1)throw Error('请填写正整数分钟');return {...createLearningTask({jobId,title:d.task,skill:'AI 个性化实践',minutes:d.minutes,acceptance:d.task,resourceIds:[]}),origin:'ai',date:d.day,aiPlanId:plan.at||''};});
}
export const aiContext=(state,today)=>({ratings:state.ratings,interests:state.interests,projectEvidence:state.projectEvidence,days:state.days,deadline:state.deadline,direction:state.direction,hours:state.hours,cities:state.cities,intent:state.intent,graduation:state.graduation,today,target:state.target,weeks:state.aiWeeks||state.activePlan?.weeks||4,tasks:state.tasks.filter(t=>t.jobId===state.targetId).map(({title,status,minutes,date})=>({title,status,minutes,date})),applications:state.applications.map(({title,stage,date,rounds,source})=>({title,stage,date,rounds,source}))});

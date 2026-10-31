export function targetTasks(state,id=state.targetId){return state.tasks.filter(t=>(t.jobId||null)===(id||null));}
export function learningItems(state,id=state.targetId){const items=new Map();for(const t of [...targetTasks(state,id),...(state.backlog||[]).filter(t=>(t.jobId||null)===(id||null))])items.set(t.key||t.id,t);return [...items.values()];}
export function learningProgress(items){const done=items.filter(t=>t.status==='完成');return {total:items.length,done:done.length,remaining:items.length-done.length,percent:items.length?Math.round(done.length/items.length*100):0,minutes:items.filter(t=>t.status!=='完成').reduce((n,t)=>n+t.minutes,0)};}
export function createLearningTask({jobId,title,skill,minutes,acceptance,resourceIds=[]}){
 if(!jobId||typeof title!=='string'||!title.trim()||title.length>150||typeof skill!=='string'||!skill.trim()||skill.length>60||!Number.isInteger(minutes)||minutes<1||minutes>90||typeof acceptance!=='string'||!acceptance.trim()||acceptance.length>1000)throw Error('请填写学习任务、学习主题、1—90 分钟估时及验收目标');
 const id=crypto.randomUUID();return {id,key:id,jobId,title:title.trim(),skill:skill.trim(),minutes,acceptance:acceptance.trim(),resourceIds:[...new Set(resourceIds)],deps:[],status:'待做',evidence:'',date:'',origin:'user'};
}

import {publicJobs} from './jobs.js';
// Short summaries from official Tencent recruitment search listings, checked 2026-10-30.
// Search visibility is not a live vacancy guarantee. No salary or deadline inferred.
const newRows=[
 ['tx-inference','ai','2108854783036272640','大模型推理框架研发工程师-上海/北京/深圳/杭州','上海（标题亦列北京、深圳、杭州）','三年以上经验','2026-10-10','研发并优化大模型推理引擎和分布式推理调度，涉及 GPU 与异构芯片。','C/C++、Python；模型部署与推理优化经验。'],
 ['tx-cpu','ai','2100123159490637824','星星海实验室- AI Infra CPU 研发工程师','深圳','五年以上经验','2026-09-16','分析 Agent 场景的 CPU 负载，建设性能评测并定位软硬件瓶颈。','Linux 性能分析；profiling、tracing 与硬件计数器。'],
 ['tx-game-data','data','2006301756904071168','《三角洲行动》-数据分析（活动分析方向）','深圳','三年以上经验','2026-10-09','分析游戏活跃与商业化效果，开展专题分析和 A/B 实验。','游戏商业化或活跃分析经验；MySQL 与分析框架。'],
 ['tx-mining','data','2007743926701805568','英雄联盟手游-应用研究-数据挖掘方向','深圳','三年以上经验；硕士及以上','2026-09-17','通过统计建模、机器学习、因果分析改善游戏体验与增长。','计算机、数学或统计学背景；数据挖掘与因果推断。'],
 ['tx-risk','security','2104449759719899136','腾讯安全-流量风控高级策略算法工程师','深圳','五年以上经验','2026-09-28','建设注册、登录、反作弊等场景的流量策略与对抗验证机制。','风控或反作弊经验；SQL、Python 和策略评估。'],
 ['tx-data-security','security','1950032115714359296','微信-数据平台后台开发工程师','深圳','两年以上经验','2026-10-08','开发数据平台安全服务、访问鉴权与策略服务，探索安全 Agent。','Java 或 Go；Linux、服务性能优化与权限模型。'],
 ['tx-merchant','product','2097166275703910400','微信小店-产品策划-商家客服','广州','一年以上经验','2026-09-15','规划商家客服与经营工具，协调算法、研发、运营团队推进产品。','用户思维、数据分析、协作能力；AI Agent经验加分。'],
 ['tx-recommend','product','1936828021029838848','微信小店-产品策划-推荐方向','广州','页面标签一年以上；要求正文两年以上相关经验','2026-09-28','研究电商推荐需求，设计改善用户体验与业务效率的方案。','推荐领域经验；数据理解、问题拆解和推进能力。'],
 ['tx-game-engine','game','2096796013850439680','UE5自研IP跨平台射击游戏-游戏客户端开发工程师（引擎）','深圳','三年以上游戏开发、两年以上引擎开发经验','2026-09-08','提供 UE5 引擎扩展与渲染性能优化，为跨平台游戏研发提供支持。','C++、图形学、游戏引擎与 GPU 渲染。']
];
export const recruitmentCatalog=[...publicJobs.map(j=>({...j,categories:j.id==='meituan-ai'?['java','ai']:[j.direction],summary:j.notes||j.jd,experience:j.eligibility,verification:'既有官方摘录快照；本轮未重新确认在招',sourceUpdated:'未记录',checkedAt:j.checkedAt.slice(0,10),officialExcerpt:true})),...newRows.map(([id,category,postId,title,city,experience,sourceUpdated,summary,eligibility])=>({id,category,categories:[category],company:'腾讯',title,city,experience,sourceUpdated,summary,eligibility,source:'https://careers.tencent.com/jobdesc.html?postId='+postId,intent:'社招',checkedAt:'2026-10-30',verification:'官方招聘检索可读；实时页面及在招状态待复核',officialExcerpt:false}))];
export const jobsForCategory=id=>recruitmentCatalog.filter(j=>j.categories.includes(id));

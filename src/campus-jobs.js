// Official-source summaries checked 2026-10-30. Application controls are not an offer guarantee.
const rows=[
['baidu-wenku','web','百度','前端实习岗（J72414）','北京','实习','https://talent.baidu.com/jobs/detail/INTERN/139e3bea-1454-4991-88b4-6e8e14958db9','本科及以上、计算机相关专业；在校实习','参与文库主站和应用前端迭代及研发质效建设。','JS / HTML / CSS；Vue 或 React；至少一门 Node / Go / Python。','2026-07-21'],
['baidu-front','web','百度','前端开发实习生（J95084）','北京、上海','实习','https://talent.baidu.com/jobs/detail/INTERN/35fbe3c6-54a1-4687-abc3-02cd760d9462','日常实习；学历与毕业时间请核对原站','建设 AI 数据平台界面，涉及标注、生产流程与模型评估。','HTML / CSS / JavaScript / TypeScript；React 或 Vue；Vite 或 Webpack。','2026-07-21'],
['baidu-backend','ai','百度','大模型平台后端实习生（J106843）','北京、上海','实习','https://talent.baidu.com/jobs/detail/INTERN/fc9116ea-102d-48a9-9945-0bc64d362b3c','计算机相关专业本科及以上；日常实习','开发推理服务与平台工具，参与推理技术调研。','Go / Python / C++ 至少一种；Linux / Unix；Docker / Kubernetes 经验优先。','2026-10-26'],
['baidu-product','product','百度','AI产品经理（J106764）','北京','实习','https://talent.baidu.com/jobs/detail/INTERN/88eaf53d-b89d-4b9a-96c6-6b22791474ac','2028届及以后本科/硕士在读；每周5天、至少6个月','参与百度搭子 Agent 能力规划和效果评估。','Agent 原理、需求分析、PRD；Axure / Figma。','2026-10-21'],
['oppo-platform','ai','OPPO','AI算法工程师（平台方向）','深圳','校招','https://careers.oppo.com/university/oppo/campus/post/1885?recruitType=Graduate','2027届校招；相关专业硕士及以上','建设 Agent 能力和研发效能平台。','Agent / RAG；C / C++ / Python / Java 至少一种；Linux、CI/CD、Docker。','2026-09-08'],
['oppo-agent','ai','OPPO','AI研究员（智能体方向）','深圳','校招','https://careers.oppo.com/university/oppo/campus/post/1880','2027届校招；详细学历条件请核对原站','研究终端智能体的执行、记忆或长程任务能力。','任务规划、记忆检索、代码理解等方向；具体门槛以官网为准。','2026-09-08'],
['oppo-testing','test','OPPO','算法测试开发工程师','深圳、东莞、成都','校招','https://careers.oppo.com/university/oppo/campus/post/1758?recruitType=Graduate','2027届校招；计算机、通信等相关专业','测试模型及推理服务，建设评测数据集与效率工具。','Java / Python / C / C++ 至少一种；Linux / Unix、数据库；AI工程实践优先。','2026-07-15'],
['bili-llm','ai','哔哩哔哩','大语言模型（LLM）算法实习生','上海','实习','https://jobs.bilibili.com/campus/positions/29836?type=0','全日制在校生；2027届及以后毕业','参与模型预训练、强化学习、机器翻译或长程 Agent 实验。','深度学习、LLM；Megatron / DeepSpeed / Verl；论文复现和模型项目。','2026-08-06'],
['huawei-software','java','华为','软件开发工程师','深圳、上海、北京、南京、杭州等','校招','https://career.huawei.com/cn/job-details?advertisementId=36373','2027届国内本科/硕士；2026—2027届国内博士及海外本硕博，详见校招说明','软件研发综合岗位；需在官网进一步选择具体研发领域。','官网要求先选择岗位意向；未获得具体方向要求，不推断 Java 熟练度。','2026-08-17']
];
export const campusJobs=rows.map(([id,category,company,title,city,intent,source,experience,summary,eligibility,sourceUpdated])=>({id,category,categories:[category],company,title,city,intent,source,experience,summary,eligibility,sourceUpdated,checkedAt:'2026-10-30',verification:'官方来源已核验；状态以最近采集记录为准',hiringStatus:'unknown',officialExcerpt:false}));
export const companies={
 '百度':{intro:'本次岗位来自百度文库、应用模型研发部及智能云等团队。',url:'https://talent.baidu.com/jobs/'},
 'OPPO':{intro:'本次校招岗位围绕终端智能体、研发平台和算法测试。',url:'https://careers.oppo.com/campus'},
 '哔哩哔哩':{intro:'本次实习岗位来自大语言模型研发方向。',url:'https://jobs.bilibili.com/'},
 '华为':{intro:'本次校园招聘覆盖软件研发等领域，需进一步选择岗位意向。',url:'https://career.huawei.com/cn/campus-recruitment'},
 '字节跳动':{intro:'本目录收录前端、测试与相关研发团队的校园招聘记录。',url:'https://jobs.bytedance.com/campus'},
 '腾讯':{intro:'本目录收录微信、游戏及安全等业务团队的招聘记录。',url:'https://careers.tencent.com/'},
 '沐瞳科技':{intro:'本目录收录 IT 信息化后端研发校招记录。',url:'https://moonton.jobs.feishu.cn/campus'},
 '得物':{intro:'本目录收录长沙研发中心开发校招记录。',url:'https://poizon.jobs.feishu.cn/578078'},
 '美团':{intro:'本目录收录研发相关团队的招聘记录。',url:'https://zhaopin.meituan.com/'}
};

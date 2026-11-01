// Ten additional official campus/internship roles, sourced 2026-10-30.
const rows=[
['baidu-data-73307','data','数据分析实习生（J73307）','9fda9a23-dfce-4230-bbad-6dffe04b4e2e','常用数据分析方法；SQL 或 Python 基础优先；经济学、社会学、心理学等专业优先。','研究用户行为、业务指标并提供可落地的数据分析建议。'],
['baidu-data-98221','data','数据分析实习生（J98221）','a361b79c-86e5-4295-8bdd-a1f9c9988a5d','研究生及以上；SQL / Excel，Python / R 优先；每周至少4天、至少6个月。','支持用户增长分析、指标监控和专题报告。'],
['baidu-data-75756','data','数据分析师实习生（J75756）','6ad745b1-f7fd-4e0e-8307-d221b6bf298c','本科及以上，数学/统计/计算机等专业；SQL / Excel、R / Python。','建设内容生态指标、分析异常并优化自动化分析工具。'],
['baidu-data-100281','data','AIGC数据分析实习生（J100281）','3f5ec667-8284-400e-9c87-a443145b519c','本科或硕士在读；每周5天，连续6个月优先；Excel、SQL 和数据分析能力。','参与大模型应用的需求调研、产品设计和数据评估。'],
['baidu-data-106779','data','AI 数据分析师（J106779）','bd7450c8-64d6-4781-8261-9d5c49abc5bd','本科及以上；SQL / Excel，Python / R 至少一种；统计实验方法和独立核验能力。','分析企业 Agent 的使用效果，建设指标并验证效率改善。'],
['baidu-data-81163','data','AIGC数据分析实习生（J81163）','302570bb-1256-4257-bc5c-ac1725794657','本科或硕士在读；每周5天、至少3个月；分析归纳及沟通能力。','支持 AIGC 内容生产和效果评测的数据分析。'],
['baidu-voice-102273','product','AI 数据产品实习生（语音方向）（J102273）','6f945b3c-2223-4b20-aeb5-aae1953dbe46','在校学生，至少6个月；Excel、数据质量意识和沟通能力，语音经验优先。','跟进语音数据采集、标注、质检与效果评估。'],
['baidu-web-70806','web','web前端实习生（J70806）','f4aa7aac-3d94-43b6-9762-ced2340391af','本科及以上，至少4个月；JavaScript / HTML / CSS、React / Vue、Node。','开发百度小程序与 AI 原生应用的前端模块。']
];
export const additionalJobs=rows.map(([id,category,title,key,eligibility,summary])=>({id,category,categories:[category],title,company:'百度',city:'北京',intent:'实习',source:'https://talent.baidu.com/jobs/detail/INTERN/'+key,eligibility,experience:'日常实习；具体年级、学历和到岗要求见下方',summary,sourceUpdated:id==='baidu-data-106779'?'2026-10-22':'2026-07-21',checkedAt:'2026-10-30',hiringStatus:'unknown',verification:'官方详情检索已读取，等待实时入口核验',officialExcerpt:false}));
additionalJobs.push(
{id:'oppo-lowlevel-1838',category:'embedded',categories:['embedded','security'],company:'OPPO',title:'底层软件工程师',city:'南京、深圳、东莞、成都',intent:'校招',source:'https://careers.oppo.com/university/oppo/campus/post/1838?recruitType=Graduate',experience:'2027届应届生；本科及以上，计算机/通信/软件等相关专业',eligibility:'C/C++、数据结构和算法、操作系统；嵌入式经验更佳。',summary:'覆盖 Linux、嵌入式、底层开发等方向，其中系统安全方向涉及内核加固与加密；需在原站选择具体方向。',sourceUpdated:'2026-07-15',checkedAt:'2026-10-30',hiringStatus:'unknown',verification:'官方详情已读取，等待实时入口核验',officialExcerpt:false},
{id:'oppo-media-1831',category:'multimedia',categories:['multimedia','web'],company:'OPPO',title:'多媒体开发工程师',city:'南京、深圳',intent:'校招',source:'https://careers.oppo.com/university/oppo/campus/post/1831?recruitType=Graduate',experience:'2027届应届生；本科及以上，计算机/通信/软件等相关专业',eligibility:'C/C++/Java/Python 等编程能力；数据结构、算法、操作系统；相关领域经验。',summary:'覆盖音视频、相机、显示等多个方向；其中 Web 多媒体方向涉及 Web 引擎与混合应用框架，不是纯前端页面岗位。',sourceUpdated:'2026-07-15',checkedAt:'2026-10-30',hiringStatus:'unknown',verification:'官方详情已读取，等待实时入口核验',officialExcerpt:false});

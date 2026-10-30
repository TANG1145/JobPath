export const categories=[
 {id:'web',title:'Web 前端开发',code:'FRONTEND',description:'把产品需求变成可操作的页面与交互。',keywords:['前端','网页','界面','web','frontend','HTML','CSS','JavaScript','TypeScript','React','Vue'],focus:['页面与交互实现','组件与状态管理','浏览器与工程化']},
 {id:'java',title:'Java 后端开发',code:'BACKEND',description:'构建业务服务、接口与可靠的数据处理。',keywords:['后端','服务端','java','backend','Spring','SQL','HTTP','接口','数据库'],focus:['业务接口与服务','数据存储与查询','异常处理与服务验证']},
 {id:'test',title:'测试开发',code:'QUALITY',description:'用测试设计与自动化验证软件是否可靠。',keywords:['测试','质量','自动化','test','qa','Python','pytest','Playwright'],focus:['测试用例与边界','接口与页面自动化','缺陷定位与验证']},
 {id:'ai',title:'AI 与算法工程',code:'AI / ML',description:'研究和落地机器学习、大模型及推理基础设施。',keywords:['人工智能','算法','大模型','ai','机器学习','C++','Python','GPU'],focus:['模型与算法','推理及性能优化','AI工程落地']},
 {id:'data',title:'数据分析与挖掘',code:'DATA',description:'用统计、实验与建模理解业务和用户行为。',keywords:['数据分析','数据挖掘','data','SQL','Python','统计','实验'],focus:['指标与分析框架','A/B实验','数据挖掘与建模']},
 {id:'security',title:'安全与风控',code:'SECURITY',description:'识别风险、设计安全策略并验证防护效果。',keywords:['安全','风控','security','反作弊','鉴权','Linux'],focus:['风险识别与对抗','访问控制','安全策略与验证']},
 {id:'product',title:'产品策划',code:'PRODUCT',description:'理解用户问题，设计产品方案并推动落地。',keywords:['产品','策划','product','需求','用户','电商'],focus:['需求与用户研究','产品方案与协作','效果分析']},
 {id:'game',title:'游戏开发',code:'GAME',description:'构建游戏客户端、引擎和交互体验。',keywords:['游戏','引擎','game','UE5','Unity','C++','图形学'],focus:['客户端与引擎','图形与渲染','跨平台性能']}
];
export const searchCategories=q=>categories.filter(c=>[c.title,c.description,...c.keywords,...c.focus].join(' ').toLowerCase().includes(q.trim().toLowerCase()));

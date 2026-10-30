const rows={java:[
['doc','Java 官方学习','https://dev.java/learn/','Java','集合与异常'],['doc','MDN HTTP','https://developer.mozilla.org/zh-CN/docs/Web/HTTP','HTTP','状态码与请求方法'],['doc','PostgreSQL 教程','https://www.postgresql.org/docs/current/tutorial.html','SQL','表与查询'],['doc','Spring REST 指南','https://spring.io/guides/gs/rest-service','Spring','REST 服务'],
['project','Spring Petclinic','https://github.com/spring-projects/spring-petclinic','Spring','为一个接口增加验证测试'],['project','Spring REST 示例','https://github.com/spring-guides/gs-rest-service','HTTP','增加一个参数校验分支'],
['video','Spring Boot 入门课程','https://www.freecodecamp.org/news/spring-boot-tutorial/','Spring','只学习 REST 相关片段；旧版API须对照当前文档'],['video','Spring Boot 与 JPA','https://www.freecodecamp.org/news/learn-spring-boot-and-spring-data-jpa/','SQL','实体映射与查询片段']],
web:[['doc','MDN Web 基础','https://developer.mozilla.org/zh-CN/docs/Learn_web_development','HTML/CSS','语义化与表单'],['doc','MDN JavaScript 指南','https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide','JavaScript','函数、数组与异步'],['doc','TypeScript Handbook','https://www.typescriptlang.org/docs/handbook/intro.html','TypeScript','对象类型与联合类型'],['doc','React 官方教程','https://react.dev/learn','React','状态与事件'],
['project','TodoMVC','https://github.com/tastejs/todomvc','JavaScript','比较实现后独立新增筛选条件'],['project','Vite 示例模板','https://github.com/vitejs/vite/tree/main/packages/create-vite','React','理解模板后独立实现一个表单'],
['video','React 入门视频','https://www.freecodecamp.org/news/learn-react-js-in-this-free-7-hour-course/','React','只学习组件与状态片段；旧版API对照官方文档'],['video','JavaScript 视频课程入口','https://www.freecodecamp.org/news/learn-javascript-free-js-courses-for-beginners','JavaScript','函数和数组片段']],
test:[['doc','Python 教程','https://docs.python.org/zh-cn/3/tutorial/','Python','函数和异常'],['doc','pytest 入门','https://docs.pytest.org/en/stable/getting-started.html','pytest','断言和fixture'],['doc','Playwright 入门','https://playwright.dev/docs/intro','Playwright','第一个浏览器测试'],['doc','MDN HTTP 概述','https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Overview','HTTP','请求响应'],
['project','pytest 示例','https://github.com/pytest-dev/pytest/tree/main/doc/en/example','pytest','编写独立参数化用例'],['project','Playwright 示例','https://github.com/microsoft/playwright-examples','Playwright','新增一个失败路径测试'],
['video','pytest 视频教程','https://www.freecodecamp.org/news/testing-in-python-with-pytest','pytest','断言与fixture片段'],['video','Playwright 软件测试','https://www.freecodecamp.org/news/software-testing-with-playwright','Playwright','测试设计和首个用例']]};
export const catalog=Object.entries(rows).flatMap(([direction,list])=>list.map(([type,title,url,skill,section],i)=>({id:`${direction}-${i+1}`,direction,type,title,url,skills:[skill],section,language:/zh-CN|zh-cn/.test(url)?'中文':'英文',minutes:type==='project'?60:30,prerequisite:type==='doc'?'能运行基础示例':`已完成 ${skill} 基础练习`,reviewStatus:'候选 / 待人工运行与可达审核',reviewedAt:null,license:type==='project'?'使用前检查原仓库 LICENSE；保留引用，不将克隆计为个人成果':'原站学习，不镜像或再分发',fallbackId:`${direction}-${Math.min(i%4+1,4)}`})));
export const types={doc:'文档',project:'开源项目',video:'视频'};
export function resourceFor(skill,direction){return catalog.filter(r=>r.direction===direction&&r.skills.includes(skill));}
const details={
'Java':['使用集合完成岗位去重','为空值与重复输入编写测试'],
'HTTP':['记录 GET/POST 请求与状态码','实现错误响应并解释幂等性'],
'SQL':['建立岗位表并写筛选查询','用事务验证重复投递记录处理'],
'Spring':['实现岗位查询 REST 接口','加入参数校验与接口测试'],
'HTML/CSS':['制作语义化岗位详情表单','验证窄屏布局和键盘操作'],
'JavaScript':['实现岗位筛选纯函数','补齐空数组与异常数据测试'],
'TypeScript':['为岗位和要求定义联合类型','用类型守卫校验未知 JSON'],
'React':['用组件和状态实现岗位收藏','验证表单错误与状态更新'],
'Vue':['用组件和响应式状态实现收藏','验证表单错误与状态更新'],
'浏览器':['记录请求与页面渲染过程','验证缓存、存储和跨域行为'],
'Python':['实现文本字段整理函数','为异常输入增加测试'],
'测试设计':['为岗位表单设计等价类','记录边界值与错误路径用例'],
'pytest':['编写参数化断言测试','用fixture隔离状态并验证失败路径'],
'Playwright':['编写岗位录入端到端测试','覆盖错误提示与刷新恢复'],
'测试':['为一个接口列出验收用例','验证成功与失败响应']};
export function taskDetails(skill){return details[skill]||[`实现 ${skill} 的最小可复现例子`,`验证 ${skill} 的边界并记录限制`];}
export const prerequisites={Spring:['Java','HTTP','SQL'],React:['HTML/CSS','JavaScript'],Vue:['HTML/CSS','JavaScript'],TypeScript:['JavaScript'],pytest:['Python'],Playwright:['JavaScript','测试设计']};

import {expandedResources} from './learning-resources.js';
import {learningResourceChecks} from './learning-resource-checks.js';
import {resourceAudit} from './resource-audit.js';
const rows={java:[
['doc','Java 官方学习','https://dev.java/learn/','Java','集合与异常'],['doc','MDN HTTP','https://developer.mozilla.org/zh-CN/docs/Web/HTTP','HTTP','状态码与请求方法'],['doc','PostgreSQL 教程','https://www.postgresql.org/docs/current/tutorial.html','SQL','表与查询'],['doc','Spring REST 指南','https://spring.io/guides/gs/rest-service','Spring','REST 服务'],
['project','Spring Petclinic','https://github.com/spring-projects/spring-petclinic','Spring','为一个接口增加验证测试'],['project','Spring REST 示例','https://github.com/spring-guides/gs-rest-service','HTTP','增加一个参数校验分支'],
["video","CS50 HTTP 请求与响应","https://cs50.harvard.edu/x/shorts/http/","HTTP","请求方法、状态码；全片约15分钟"],["video","CS50 SQL 查询基础","https://cs50.harvard.edu/sql/weeks/0/","SQL","SELECT、WHERE与查询片段；SQLite语法与PostgreSQL有差异"]],
web:[['doc','MDN Web 基础','https://developer.mozilla.org/zh-CN/docs/Learn_web_development','HTML/CSS','语义化与表单'],['doc','MDN JavaScript 指南','https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide','JavaScript','函数、数组与异步'],['doc','TypeScript Handbook','https://www.typescriptlang.org/docs/handbook/intro.html','TypeScript','对象类型与联合类型'],['doc','React 官方教程','https://react.dev/learn','React','状态与事件'],
['project','TodoMVC ES6（依赖修复版）','https://github.com/tastejs/todomvc','JavaScript','比较实现后独立新增筛选条件'],['project','Vite 示例模板','https://github.com/vitejs/vite/tree/main/packages/create-vite','React','理解模板后独立实现一个表单'],
["video","CS50 Web 用户界面与React","https://cs50.harvard.edu/web/weeks/6/","React","组件和状态片段；旧版API对照React官方文档"],["video","CS50 Web JavaScript","https://cs50.harvard.edu/web/weeks/5/","JavaScript","DOM、事件与本地存储片段"]],
test:[['doc','Python 教程','https://docs.python.org/zh-cn/3/tutorial/','Python','函数和异常'],['doc','pytest 入门','https://docs.pytest.org/en/stable/getting-started.html','pytest','断言和fixture'],['doc','Playwright 入门','https://playwright.dev/docs/intro','Playwright','第一个浏览器测试'],['doc','MDN HTTP 概述','https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Overview','HTTP','请求响应'],
['project','pytest 示例','https://github.com/pytest-dev/pytest/tree/main/doc/en/example','pytest','编写独立参数化用例'],['project','Playwright API与时钟示例（修复版）','https://github.com/microsoft/playwright-examples','Playwright','新增一个失败路径测试'],
["video","CS50 Python 单元测试","https://cs50.harvard.edu/python/weeks/5/","pytest","assert、pytest与测试组织片段"],["video","CS50 Python 异常处理","https://cs50.harvard.edu/python/weeks/3/","Python","异常输入、ValueError与try/except片段"]]};
export const catalog=Object.entries(rows).flatMap(([direction,list])=>list.map(([type,title,url,skill,section],i)=>({id:`${direction}-${i+1}`,direction,type,title,url,skills:[skill],section,language:/zh-CN|zh-cn/.test(url)?'中文':'英文',minutes:type==='project'?60:30,prerequisite:type==='doc'?'能运行基础示例':`已完成 ${skill} 基础练习`,reviewStatus:'候选 / 待人工运行与可达审核',reviewedAt:null,license:type==='project'?'使用前检查原仓库 LICENSE；保留引用，不将克隆计为个人成果':'原站学习，不镜像或再分发',fallbackId:`${direction}-${list.findIndex(row=>row[0]==='doc'&&row[3]===skill)+1}`})));
// Audit state is per resource; reaching an article is not evidence of video playback.
for(const r of catalog){
 const a=resourceAudit[r.id];r.audit=a||null;
 r.reviewStatus=r.type==='doc'?'官方文档入口 / 已检查链接响应，章节实践待复核':'候选 / 待核验';
 if(a){r.reviewedAt=a.checkedAt;r.reviewStatus=a.dependencyStatus==='needs-review'?'候选 / 依赖问题待整改':a.playbackStatus==='blocked'?'播放受阻 / 使用文档替代':a.playbackStatus==='passed'?'已抽样播放 / 官方直链':a.contentStatus==='reviewed'?'文档主题已核对 / 原站学习':a.runtimeStatus==='passed'?(a.dependencyStatus==='patched'?'修复版实践通过 / 需先应用补丁':'最小实践通过 / 非全项目认证'):'部分检查通过 / 未完成运行';if(a.license)r.license=`${a.license} · 来源 ${a.licenseFile} · 保留上游版权与许可声明，不将克隆计作个人成果`;}
}
export const types={doc:'文档',project:'开源项目',video:'视频'};
export function resourceFor(skill,direction){return catalog.filter(r=>r.direction===direction&&r.skills.includes(skill));}

for(const r of expandedResources){const check=learningResourceChecks[r.id];if(check){r.reviewedAt=check.checkedAt;r.reviewStatus=check.status===200?'入口响应已检查 / 章节实践与项目运行未验证':'入口访问受限 / 待核验';r.audit={...check,linkStatus:check.status===200?'passed':'blocked'};}catalog.push(r)}

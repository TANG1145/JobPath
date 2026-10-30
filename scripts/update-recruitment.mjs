import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {recruitmentCatalog} from '../src/recruitment-catalog.js';
import {RecruitmentStore} from '../backend/recruitment-store.mjs';
import {classifyRecruitment,classifyCategory,parseBaiduList} from '../backend/recruitment-parser.mjs';
mkdirSync('.local',{recursive:true});const store=new RecruitmentStore(process.env.RECRUITMENT_DB||'.local/recruitment.sqlite');
const prior=new Map(store.snapshot().rows.map(r=>[r.id,r]));
const allowed=new Set(recruitmentCatalog.map(r=>new URL(r.source).hostname));
const proxy=process.env.RECRUITMENT_PROXY;let browser;const report={checkedAt:new Date().toISOString(),checked:0,open:0,closed:0,unknown:0,discovery:[]};
try{
 browser=await chromium.launch({headless:true,...(proxy?{proxy:{server:proxy}}:{})});
 const queue=[...recruitmentCatalog.map(r=>({...r,...prior.get(r.id)})),...store.snapshot().rows.filter(r=>!recruitmentCatalog.some(x=>x.id===r.id))].slice(0,150);
 // Bounded discovery from public first-page links. Other companies retain explicit seeded records.
 for(const entry of [{company:'百度',url:'https://talent.baidu.com/jobs/list?recruitType=INTERN',pattern:/\/jobs\/detail\/INTERN\//},{company:'哔哩哔哩',url:'https://jobs.bilibili.com/campus/positions',pattern:/\/campus\/positions\/\d+/}]){
  const context=await browser.newContext({javaScriptEnabled:entry.company!=='百度'}),page=await context.newPage();
  try{await page.goto(entry.url,{waitUntil:'domcontentloaded',timeout:18000});await page.waitForTimeout(1800);const links=entry.company==='百度'?parseBaiduList(await page.content()):await page.locator('a[href]').evaluateAll(els=>els.map(el=>({url:el.href,title:el.innerText.trim().split('\n')[0]})));let count=0;
   for(const link of links){if(count>=8)break;if(!entry.pattern.test(link.url)||new URL(link.url).hostname!==new URL(entry.url).hostname)continue;if(entry.company==='哔哩哔哩'&&!link.title.includes('实习'))continue;const category=classifyCategory(link.title);if(!category||!link.title||queue.some(r=>r.source.split('?')[0]===link.url.split('?')[0]))continue;
    queue.push({id:'auto-'+createHash('sha256').update(link.url.split('?')[0]).digest('hex').slice(0,16),company:entry.company,title:link.title,source:link.url,categories:[category],category,intent:'实习',city:'请核对官方详情',experience:'请核对官方学历、毕业时间和实习要求',eligibility:'完整技术要求请查看官方招聘详情',summary:'官方实习目录新发现岗位；以原站职位说明为准。',sourceUpdated:link.sourceUpdated||'官网未提取',...(link.summary?{city:link.city,summary:'官网职责片段：'+link.summary,eligibility:'官网要求片段：'+link.eligibility}:{}),officialExcerpt:false});count++}
   report.discovery.push({company:entry.company,added:count,note:links.some(x=>entry.pattern.test(x.url))?'仅检查公开列表首页，非全量':'当前列表没有可解析详情链接，未宣称没有新岗位'});
  }catch{report.discovery.push({company:entry.company,error:'公开列表访问失败，保留旧目录'})}finally{await context.close()}
 }
 for(const row of queue.sort((a,b)=>Date.parse(a.checkedAt||0)-Date.parse(b.checkedAt||0)).slice(0,40)){if(!allowed.has(new URL(row.source).hostname))continue;const context=await browser.newContext({javaScriptEnabled:row.company!=='百度'}),page=await context.newPage();let result,text='';
  try{const response=await page.goto(row.source,{waitUntil:'domcontentloaded',timeout:18000});await page.waitForTimeout(row.company==='百度'?300:1800);if(!allowed.has(new URL(page.url()).hostname))throw Error('redirect');text=await page.locator('body').innerText({timeout:4000});let apply=false;
   for(const label of ['投递岗位','投递简历','申请','立即申请','立即投递','申请职位']){const control=page.getByText(label,{exact:true}).first();if(await control.count()&&await control.isVisible()&&await control.isEnabled()&&await control.getAttribute('aria-disabled')!=='true'){apply=true;break}}
   result=classifyRecruitment({text,title:row.title,apply,httpStatus:response?.status()||0});
  }catch{result={hiringStatus:'unknown',verification:'官网访问受阻或超时；旧内容保留，在招状态需复核'}}finally{await context.close()}
  const record={...row,...result,checkedAt:new Date().toISOString(),lastConfirmedOpen:result.hiringStatus==='open'?new Date().toISOString():row.lastConfirmedOpen||null,contentHash:text?createHash('sha256').update(text).digest('hex'):row.contentHash||null};
  store.put(record);report.checked++;report[result.hiringStatus]++;await new Promise(r=>setTimeout(r,350));
 }
 writeFileSync('.local/recruitment-report.json',JSON.stringify(report,null,2));
 if(process.argv.includes('--export-seed'))writeFileSync('public/catalog/recruitment-status.json',JSON.stringify(store.snapshot(),null,2));
 console.log(JSON.stringify(report));if(report.unknown||report.discovery.some(r=>r.error))process.exitCode=2;
}catch(e){console.error('招聘采集未完成：'+e.message);process.exitCode=1}finally{await browser?.close();store.close()}

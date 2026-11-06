import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {recruitmentCatalog} from '../src/recruitment-catalog.js';
const root=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||`.local/recruitment-audit-${new Date().toISOString().slice(0,10)}`;mkdirSync(root,{recursive:true});
const ids=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
const extra=process.argv.find(a=>a.startsWith('--extra='))?.slice(8);
const rows=[...new Map([...recruitmentCatalog,...JSON.parse(readFileSync('public/catalog/recruitment-status.json')).rows,...(extra&&existsSync(extra)?JSON.parse(readFileSync(extra)):[])].map(r=>[r.id,r])).values()].filter(r=>!ids||ids.includes(r.id));
const browser=await chromium.launch({headless:true});
let index=0;
await Promise.all(Array.from({length:3},async()=>{while(index<rows.length){const row=rows[index++],context=await browser.newContext({javaScriptEnabled:row.company!=='百度'}),page=await context.newPage();const result={id:row.id,source:row.source,checkedAt:new Date().toISOString()};try{
 await page.route('**/*',async route=>{
  if(['image','font','media'].includes(route.request().resourceType())){await route.abort();return}
  if(/^https?:/.test(route.request().url())&&(row.company!=='腾讯'||new URL(route.request().url()).hostname===new URL(row.source).hostname)){
   try{const req=route.request(),r=await fetch(req.url(),{method:req.method(),...(req.postData()?{body:req.postData(),headers:{'content-type':req.headers()['content-type']||'application/json'}}:{}),signal:AbortSignal.timeout(20000)});await route.fulfill({status:r.status,contentType:r.headers.get('content-type')||'text/html',body:Buffer.from(await r.arrayBuffer())});}catch{await route.continue()}
  }else await route.continue();
 });
 const response=await page.goto(row.source,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(row.company==='百度'?400:12000);
 result.status=response?.status();result.url=page.url();result.text=await page.locator('body').innerText({timeout:5000});result.html=await page.content();
 result.controls=await page.locator('a,button,[role=button]').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>({text:e.innerText?.trim(),disabled:e.disabled||e.getAttribute('aria-disabled')==='true',href:e.getAttribute('href')})).filter(e=>e.text));
 result.apply=false;for(const label of ['投递岗位','投递简历','申请','立即申请','立即投递','申请职位','申请岗位','投递']){const c=page.getByText(label,{exact:true}).first();if(await c.count()&&await c.isVisible()&&await c.isEnabled()&&await c.getAttribute('aria-disabled')!=='true'){result.apply=true;break}}
 }catch(e){result.error=e.message.split('\n')[0]}finally{await context.close()}
 writeFileSync(`${root}/${row.id}.json`,JSON.stringify(result,null,2));console.log(row.id,result.status||'error',result.text?.length||0);
}}));
await browser.close();

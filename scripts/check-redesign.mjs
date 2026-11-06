import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

// Isolated synthetic records only. No user browser, configuration or paid AI calls.
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();const errors=[];let checks=0;
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.route('**/api/local-ai',r=>r.fulfill({json:{configured:true,enabled:true,provider:'DeepSeek',model:'test'}}));
await page.route('**/api/ai',r=>r.fulfill({status:502,json:{message:'合成连接错误，请重试'}}));
const date=new Date().toLocaleDateString('en-CA');
const offer={content:'前端开发与产品协作',city:'上海',compensation:'月薪 12000 元 × 13 薪',probation:'6个月',learning:'导师支持',deadline:'2026-12-01',questions:'确认团队与入职时间'};
const data={direction:'web',targetId:'sample',target:'前端开发实习生',hours:8,intent:'实习',cities:'上海',graduation:'2027-06',jobs:[{id:'sample',title:'前端开发实习生',company:'示例科技',jd:'负责界面与交互，熟悉 JavaScript。',direction:'web'}],tasks:Array.from({length:8},(_,i)=>({id:'task-'+i,key:'task-'+i,jobId:'sample',title:i===0?'完成一个响应式页面并验证键盘操作':'项目实践与学习记录 '+(i+1),skill:'前端开发',acceptance:'提交实现与验证结果',minutes:i===0?180:30,status:i===1?'完成':i===2?'进行中':'待做',evidence:i===1?'独立实现接口并验证正常和异常输入':'',date,resourceIds:[]})),applications:[{id:'application-a',title:'示例科技 · 前端开发',stage:'面试',note:'准备项目介绍',date,appliedDate:date,rounds:[{id:'round-a',name:'技术面',date,time:'09:00',endTime:'10:30',status:'已完成',note:'复盘：清楚说明个人贡献，补充性能优化案例'}]},{id:'offer-a',title:'示例 A · 前端开发',stage:'Offer',note:'',offer},{id:'offer-b',title:'示例 B · 软件开发',stage:'Offer',note:'',offer:{...offer,city:'杭州',compensation:'月薪 14000 元 × 12 薪'}}],answers:[],aiWorkspace:{sample:{messages:[{role:'user',text:'今天只有45分钟，先做什么？'},{role:'assistant',text:'先用30分钟完成页面布局，再用15分钟验证窄屏和键盘操作。'}],plans:[{title:'本周项目实践计划',summary:'先完成项目核心流程，再复盘并准备面试。',at:new Date().toISOString(),days:[{day:date,task:'实现核心页面并记录验证结果',minutes:180}]}]}},events:[]};
mkdirSync('.local/redesign',{recursive:true});
try{
 await page.goto('http://127.0.0.1:5175');
 await page.locator('[data-page=settings]').first().click();await page.locator('[data-workspace-tab=data]').click();
 await page.locator('#importfile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'jobpath',schemaVersion:1,data}))});
 await page.locator('#toast').filter({hasText:'备份已恢复'}).waitFor();
 async function inspect(name,width){
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  const sizes=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(sizes.page<=sizes.viewport,`${name} ${width}px 页面横向溢出 ${sizes.page}`);checks++;
  const tiny=await page.locator('main').evaluate(root=>[...root.querySelectorAll('h1,h2,h3,p,button,label,small,summary')].filter(e=>e.getClientRects().length&&!e.closest('.sr-only')&&parseFloat(getComputedStyle(e).fontSize)<14).map(e=>e.textContent.slice(0,30)));
  assert.deepEqual(tiny,[],`${name} 存在过小文字`);checks++;
  await page.evaluate(()=>{const toast=document.querySelector('#toast');if(toast)toast.style.display='none'});await page.screenshot({path:`.local/redesign/${name}-${width}.png`,fullPage:true});
 }
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const [section,tabs] of [['prep',['tasks','alternatives','schedule','resources']],['career',['tracker','interviews','offers','review']],['settings',['profile','ai','data']]]){
   await page.locator(`[data-page=${section}]`).first().click();
   for(const tab of tabs){await page.locator(`[data-workspace-tab=${tab}]`).click();await inspect(section+'-'+tab,width);
    if(section==='career'&&tab==='review'){assert.ok(await page.locator('#review-source').isVisible());checks++;}
    if(section==='prep'&&tab==='schedule'){const gap=await page.locator('.ai-history-item h3').first().evaluate(el=>el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom);assert.ok(gap>=12,`AI历史标题与正文过近 ${width}`);checks++;}
   }
  }
  await page.locator('[data-page=prep]').click();await page.locator('#assistant-launcher').click();await inspect('assistant',width);await page.keyboard.press('Escape');assert.equal(await page.locator('#assistant-drawer').isHidden(),true);checks++;
  await page.locator('[data-page=jobs]').click();await page.locator('[data-job-view=categories]').click();await inspect('directions',width);
  await page.locator('[data-category-open=java]').click();await inspect('positions',width);
  await page.locator('[data-position-open]').first().click();await inspect('position-detail',width);
  await page.locator('[data-page=jobs]').click();await page.locator('[data-open-saved]').click();await inspect('saved',width);
  const scopeGap=await page.locator('.saved-scopes').evaluate(el=>el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom);assert.ok(scopeGap>=24,`收藏范围与内容区过近 ${width}`);checks++;
  const targetGap=await page.locator('#current-target > h3').evaluate(el=>el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom);assert.ok(targetGap>=12,`当前目标标题贴近岗位卡片 ${width}`);checks++;
  await page.locator('[data-organize]').first().click();await inspect('saved-detail',width);await page.locator('#close').click();
  await page.locator('[data-page=settings]').first().click();await page.locator('[data-action=profile]').click();await inspect('profile-dialog',width);await page.locator('#close').click();
 }
 await page.locator('[data-page=prep]').click();await page.locator('[data-workspace-tab=resources]').click();
 const fields=await page.locator('.resource-filters input,.resource-filters select').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().bottom));assert.ok(Math.max(...fields)-Math.min(...fields)<2,'资源筛选未对齐');checks++;
 await page.locator('[data-workspace-tab=tasks]').click();await page.locator('[data-learning-edit]').first().click();await page.locator('[name=taskDate]').fill('2026-11-20');await page.getByRole('button',{name:'确认并保存',exact:true}).click();
 await page.locator('[data-workspace-tab=schedule]').click();await page.locator('#next-week').click();await page.locator('#next-week').click();await page.locator('[data-week-task=task-0]').waitFor();await page.locator('[data-week-task=task-0]').click();assert.equal(await page.locator('[name=taskDate]').inputValue(),'2026-11-20');checks++;await page.locator('#close').click();
 await page.locator('[data-workspace-tab=tasks]').click();await page.locator('#ai-plan-goal').fill('合成失败测试');await page.locator('#generate-personal-plan').click();await page.locator('#toast').filter({hasText:'合成连接错误'}).waitFor();assert.equal(await page.locator('#ai-plan-goal').inputValue(),'合成失败测试');assert.equal(await page.locator('#generate-personal-plan').isEnabled(),true);checks++;
 await page.goto('http://127.0.0.1:5175/explore.html');await page.locator('.list-item').first().waitFor();for(const width of [390,768,1440]){await page.setViewportSize({width,height:1000});await inspect('explore',width)}
 await page.locator('#explore-search').fill('不存在的方向');assert.equal(await page.locator('.list-empty').isVisible(),true);checks++;
 // New motion/matching states use synthetic responses and an isolated browser.
 await page.goto('http://127.0.0.1:5175/');
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1000});await page.locator('[data-page=jobs]').click();await page.locator('[data-job-view=categories]').click();await inspect('match-entry',width);
  let pending;const hold=r=>pending=r;await page.route('**/api/ai',hold);await page.locator('#discover-jobs').click();await page.locator('.radar-popup').waitFor();await inspect('radar',width);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.scan-launcher').isVisible(),true);checks++;
  const job=await page.evaluate(async()=>{const {jobsForCategory}=await import('/src/recruitment-catalog.js');return jobsForCategory('web').find(j=>j.hiringStatus!=='closed')});
  while(!pending)await new Promise(r=>setTimeout(r,20));await pending.fulfill({json:{data:{title:'合成岗位匹配',summary:'结合已有实践，核实申请资格后行动',matches:[{jobId:job.id,fit:'可以尝试',reason:'页面实践可作为作品展示的起点',preparation:'核对届别、实习时长并完善项目链接'}]}}});await page.locator('.match-card').waitFor();await page.unroute('**/api/ai',hold);await inspect('match-results',width);
  await page.locator('[data-page=prep]').click();const fold=page.locator('.checkin-fold');if(!await fold.evaluate(e=>e.open))await fold.locator('summary').click();await inspect('checkin-wave',width);
  if(await page.locator('#daily-checkin').isEnabled()){await page.locator('#daily-checkin').click();await page.locator('.checkin-celebration').waitFor();await inspect('checkin-celebration',width);await page.getByRole('button',{name:'关闭打卡庆祝'}).click()}
 }
 assert.deepEqual(errors,[]);checks++;console.log(`PASS ${checks} redesigned workspace checks: all tabs, desktop/tablet/mobile, readable type, dialogs, aligned filters, dated calendar, AI error recovery, exploration, live radar, matching results and check-in motion. Screenshots: .local/redesign/`);
}finally{await browser.close()}

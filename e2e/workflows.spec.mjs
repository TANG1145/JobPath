import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
async function jobs(page){await page.goto('/');await page.getByRole('button',{name:'01 机会 OPPORTUNITIES',exact:true}).click();}
test('机会默认展示分类，搜索技能与空结果，不再展示公司目录',async({page})=>{
 await jobs(page);await expect(page.locator('[data-category]')).toHaveCount(8);await expect(page.locator('#public-results')).toHaveCount(0);await expect(page.locator('#saved-jd-view')).toBeHidden();await page.getByLabel('搜索岗位分类').fill('React');await expect(page.locator('[data-category]:visible')).toHaveCount(1);await expect(page.locator('[data-category]:visible')).toContainText('Web 前端');await page.getByLabel('搜索岗位分类').fill('完全不存在的分类');await expect(page.locator('#category-empty')).toBeVisible();await page.getByLabel('搜索岗位分类').fill('');await expect(page.locator('[data-category]:visible')).toHaveCount(8);
});
test('实际尺寸下四页面与目录详情没有横向溢出',async({page},info)=>{
 await page.goto('/');for(const width of [320,390,768]){await page.setViewportSize({width,height:844});for(const nav of ['01 机会 OPPORTUNITIES','02 备战 PREPARATION','03 求职 APPLICATIONS','04 设置 SYSTEM']){
 await page.locator('[data-page='+({'01':'jobs','02':'prep','03':'career','04':'settings'}[nav.slice(0,2)])+']').click();
 const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(size.width).toBe(width);expect(size.scroll).toBeLessThanOrEqual(width);
 if(width===390&&nav.startsWith('01')){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`test-results/mobile-${info.project.name}.png`});}
 }}
});
test('私人JD恶意文本不执行且编辑拒绝危险链接',async({page})=>{
 await jobs(page);await page.getByRole('button',{name:'+ 录入私人 JD',exact:true}).click();await page.locator('[name=title]').fill('合成安全测试');await page.locator('[name=company]').fill('虚构测试');await page.locator('[name=jd]').fill('熟悉 JavaScript <img src=x onerror="document.body.dataset.xss=1">');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await expect(page.getByRole('heading',{name:'合成安全测试',exact:true})).toBeVisible();expect(await page.locator('img[src=x]').count()).toBe(0);expect(await page.locator('body').getAttribute('data-xss')).toBeNull();
 await page.getByRole('button',{name:'编辑要求与来源',exact:true}).click();await page.locator('[name=source]').fill('javascript:alert(1)');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await expect(page.locator('#form-error')).toContainText('HTTPS');
});
test('备份回导与未来版本拒绝不破坏数据',async({page})=>{
 await jobs(page);await page.locator('[data-action=jd]').click();await page.locator('[name=title]').fill('备份合成岗位');await page.locator('[name=company]').fill('合成公司');await page.locator('[name=jd]').fill('需要 JavaScript');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await page.getByRole('button',{name:'04 设置 SYSTEM',exact:true}).click();
 const downloadWait=page.waitForEvent('download');await page.getByRole('button',{name:'↓ 导出完整备份',exact:true}).click();const raw=await readFile(await(await downloadWait).path());const backup=JSON.parse(raw);expect(backup.data.jobs).toHaveLength(1);expect(backup.data.jobs[0].jd).toBe('需要 JavaScript');expect(raw.toString()).not.toContain('DEEPSEEK_API_KEY');
 await page.locator('#importfile').setInputFiles({name:'future.json',mimeType:'application/json',buffer:Buffer.from('{"app":"jobpath","schemaVersion":99,"data":{}}')});await expect(page.locator('#toast')).toContainText('格式或版本');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#importfile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:raw});await expect(page.locator('#toast')).toContainText('备份已恢复');await page.getByRole('button',{name:'01 机会 OPPORTUNITIES',exact:true}).click();await expect(page.getByRole('heading',{name:'已保存的理想 JD / 1'})).toBeVisible();
});
test('AI关闭且核心页面不向外部发起请求',async({page,request})=>{
 const external=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5197/')&&!r.url().startsWith('data:'))external.push(r.url())});await page.goto('/');await page.getByRole('button',{name:'04 设置 SYSTEM',exact:true}).click();await expect(page.locator('#ai-health')).toContainText('AI 关闭');expect((await(await request.get('/api/health')).json()).aiEnabled).toBe(false);expect(external).toEqual([]);
});

test('三方向资源直链、出处、技能替代与修复说明',async({page})=>{
 await jobs(page);for(const direction of ['java','web','test']){
 await page.locator(`[data-direction="${direction}"]`).click();await page.locator('#resource-type').selectOption('video');await expect(page.locator('#resource-results details')).toHaveCount(2);
 for(const item of await page.locator('#resource-results details').all()){await item.locator('summary').click();await expect(item).toContainText('已抽样播放');await expect(item.getByRole('link',{name:'直接播放（官方MP4）'})).toHaveAttribute('href',/^https:\/\/cdn\.cs50\.net\/.+\.mp4$/);await expect(item.getByRole('link',{name:'课程出处'})).toHaveAttribute('href',/^https:\/\/cs50\.harvard\.edu\//);}
 await page.locator('#resource-type').selectOption('project');if(direction==='web'||direction==='test'){await page.locator('#resource-results summary').nth(direction==='web'?0:1).click();await expect(page.getByRole('link',{name:'修复与运行说明（先阅读）'})).toHaveAttribute('href','/public/resource-guide.html');}
 await page.locator('[data-page=jobs]').click();
 }
 const guide=await page.request.get('/public/resource-guide.html');expect(guide.ok()).toBe(true);for(const file of ['todomvc','playwright']){const patch=await page.request.get(`/public/resource-fixes/${file}.patch`);expect(patch.ok()).toBe(true);expect(await patch.text()).toContain('diff --git');}
});

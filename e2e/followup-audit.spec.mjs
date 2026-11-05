import {test,expect} from '@playwright/test';
import {setupLearning} from './learning-helpers.mjs';

async function importRecords(page,data){await page.locator('[data-page=settings]').click();await page.locator('[data-workspace-tab=data]').click();page.once('dialog',d=>d.accept());await page.locator('#importfile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'jobpath',schemaVersion:1,data}))});await expect(page.locator('#toast')).toContainText('备份已恢复')}
const records=()=>({direction:'web',hours:8,targetId:'a',target:'归档测试目标',jobs:[{id:'a',direction:'web',title:'归档测试目标',company:'合成公司A',jd:'合成原文'},{id:'b',direction:'web',title:'另一个目标',company:'合成公司B',jd:'合成原文'}],tasks:[{id:'t',key:'t',jobId:'a',title:'保留的实践',skill:'前端',acceptance:'验证输入输出',minutes:30,status:'完成',evidence:'独立完成页面并验证正常与异常输入',date:''}],applications:[{id:'application-a',title:'合成公司A',jobId:'a',stage:'面试',note:'保留的投递经验'}],answers:[]});

test('归档入口带数量，撤销可恢复目标及原任务和投递记录',async({page})=>{
 await page.goto('/');await importRecords(page,records());await page.locator('[data-page=jobs]').click();await page.locator('[data-open-saved]').click();
 await page.locator('#current-target .saved-more summary').click();await page.locator('#current-target [data-archive-saved]').click();await expect(page.locator('[data-scope-count=archived]')).toHaveText('1');await expect(page.locator('#current-target')).toBeEmpty();
 await page.locator('#saved-feedback').getByRole('button',{name:'查看归档',exact:true}).click();await expect(page.locator('#saved-list')).toContainText('归档测试目标');await expect(page.locator('#saved-list')).not.toContainText('另一个目标');
 await page.locator('#saved-feedback').getByRole('button',{name:'撤销',exact:true}).click();await expect(page.locator('[data-scope-count=archived]')).toHaveText('0');await expect(page.locator('#current-target')).toBeEmpty();
 await page.locator('[data-saved-scope=active]').first().click();await expect(page.locator('#current-target')).toContainText('归档测试目标');await page.locator('[data-page=prep]').click();await expect(page.locator('.learning-scroll')).toContainText('保留的实践');await page.locator('[data-page=career]').click();await expect(page.locator('[data-stage]')).toHaveValue('面试');
});

test('全部归档后仍可找回，归档视图不混入其他当前目标',async({page})=>{
 await page.goto('/');const data=records();data.jobs[0].archived=true;data.targetId='b';data.target='另一个目标';await importRecords(page,data);await page.locator('[data-page=jobs]').click();await page.locator('[data-open-saved]').click();await page.locator('[data-saved-scope=archived]').first().click();await expect(page.locator('#current-target')).toBeEmpty();await expect(page.locator('.saved-row')).toHaveCount(1);await expect(page.locator('.saved-row')).toContainText('归档测试目标');
 await page.locator('.saved-more summary').click();await page.locator('[data-archive-saved]').click();await page.locator('[data-saved-scope=active]').first().click();await expect(page.locator('.saved-row')).toHaveCount(2);await page.reload();await page.locator('[data-page=jobs]').click();await page.locator('[data-open-saved]').click();await expect(page.locator('.saved-row')).toHaveCount(2);
});

for(const first of ['personal_plan','career_chat'])test(`同时生成计划和对话均保留，先返回${first}`,async({page})=>{
 await page.route('**/api/local-ai',r=>r.fulfill({json:{configured:true,enabled:true}}));const pending=new Map();await page.route('**/api/ai',route=>{pending.set(route.request().postDataJSON().mode,route)});
 await setupLearning(page,'web');await page.locator('#ai-plan-goal').fill('并发计划');await page.locator('#generate-personal-plan').click();await page.locator('#assistant-launcher').click();await page.locator('#assistant-question').fill('并发对话');await page.locator('#ask-assistant').click();await expect.poll(()=>pending.size).toBe(2);
 const respond=async mode=>{const route=pending.get(mode),day=route.request().postDataJSON().payload.context.today;await route.fulfill({json:{data:mode==='personal_plan'?{title:'并发保存的计划',summary:'保留计划与对话',days:[{day,task:'实现并验证接口',minutes:30}]}:{reply:'并发保存的回答'}}})};
 await respond(first);await expect(page.locator(first==='personal_plan'?'.ai-plan-archive':'.chat-history')).toContainText(first==='personal_plan'?'并发保存的计划':'并发保存的回答');await expect(page.locator(first==='personal_plan'?'#ask-assistant':'#generate-personal-plan')).toBeDisabled();await respond(first==='personal_plan'?'career_chat':'personal_plan');
 await expect(page.locator('.ai-plan-archive')).toContainText('并发保存的计划');await expect(page.locator('.chat-history')).toContainText('并发保存的回答');await page.reload();await expect(page.locator('.ai-plan-archive')).toContainText('并发保存的计划');await page.locator('#assistant-launcher').click();await expect(page.locator('.chat-history')).toContainText('并发保存的回答');
});

test('导入新数据后，较晚返回的旧AI请求不会误报保存成功',async({page})=>{
 await page.route('**/api/local-ai',r=>r.fulfill({json:{configured:true,enabled:true}}));let pending;await page.route('**/api/ai',r=>{pending=r});await page.goto('/');await page.locator('#ai-plan-goal').fill('旧数据的请求');await page.locator('#generate-personal-plan').click();await expect.poll(()=>!!pending).toBe(true);await importRecords(page,{direction:'web',hours:8,jobs:[],tasks:[],applications:[],answers:[]});const day=new Date().toISOString().slice(0,10);await pending.fulfill({json:{data:{title:'不应写入的新计划',summary:'旧请求',days:[{day,task:'旧任务',minutes:30}]}}});await expect(page.locator('#toast')).toContainText('个人数据已切换');await page.locator('[data-page=prep]').click();await expect(page.locator('.ai-plan-archive')).not.toContainText('不应写入的新计划');await expect(page.locator('#generate-personal-plan')).toBeEnabled();
});

test('空白Offer名称不能生成无名记录，投递记录名称清楚',async({page})=>{
 await page.goto('/');await page.locator('[data-page=career]').click();await expect(page.getByRole('tab',{name:'投递记录',exact:true})).toBeVisible();await page.locator('[data-workspace-tab=offers]').click();await page.locator('#add-offer-direct').click();await page.locator('[name=title]').fill('   ');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await expect(page.locator('#form-error')).toContainText('请填写公司与岗位名称');await expect(page.locator('.offer-card')).toHaveCount(0);
});

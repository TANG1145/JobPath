import {test,expect} from '@playwright/test';
import {setupLearning} from './learning-helpers.mjs';
test('AI计划采用、持续对话、面试建议在新标签中完成闭环',async({page})=>{
 await page.route('**/api/local-ai',r=>r.fulfill({json:{configured:true,enabled:true}}));
 await page.route('**/api/ai',route=>{
  const body=route.request().postDataJSON();expect(route.request().headers().authorization).toBeUndefined();
  const date=body.payload.context.today;const outputs={personal_plan:{title:'合成AI实践计划',summary:'结合每周时间与现有进度',days:[{day:date,task:'独立完成接口并记录验证结果',minutes:180}]},career_chat:{reply:'先完成接口，再验证异常输入。'},interview_plan:{title:'合成面试准备',summary:'项目介绍与复盘',milestones:[{date,title:'项目讲解',preparation:'说明自己的实现与验证过程'}]}};
  return route.fulfill({json:{data:outputs[body.mode],generatedBy:'AI'}});
 });
 await setupLearning(page,'web');await page.locator('#ai-plan-goal').fill('生成自选周期实践计划');await page.locator('#generate-personal-plan').click();await expect(page.locator('.ai-plan-archive')).toContainText('合成AI实践计划');
 page.once('dialog',d=>d.accept());await page.locator('[data-adopt-ai]').click();await expect(page.locator('[data-adopt-ai]')).toBeDisabled();await expect(page.locator('[data-learning-edit]')).toHaveCount(1);await expect(page.locator('.learning-scroll')).toContainText('180 分钟');
 await page.locator('#assistant-launcher').click();await page.locator('#assistant-question').fill('今天怎么安排');await page.locator('#ask-assistant').click();await expect(page.locator('.chat-history')).toContainText('先完成接口');await page.reload();await page.locator('#assistant-launcher').click();await expect(page.locator('.chat-history')).toContainText('先完成接口');await page.keyboard.press('Escape');
 await page.locator('[data-page=career]').click();await page.locator('[data-action=application]').click();await page.locator('[name=title]').fill('合成面试公司');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await page.locator('[data-round]').first().click();await page.locator('[name=name]').fill('项目面试');await page.locator('[name=date]').fill(new Date().toLocaleDateString('en-CA'));await page.locator('[name=status]').selectOption('已安排');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await page.locator('[data-workspace-tab=interviews]').click();await expect(page.locator('[data-round-key]')).toHaveCount(1);
});
test('AI失败保留输入，原按钮可主动重试，没有发送预览门槛',async({page})=>{
 await page.route('**/api/local-ai',r=>r.fulfill({json:{configured:true,enabled:true}}));await page.route('**/api/ai',r=>r.fulfill({status:502,json:{message:'合成网络失败'}}));
 await page.goto('/');await page.locator('#ai-plan-goal').fill('明天学习接口');await page.locator('#generate-personal-plan').click();await expect(page.locator('.ai-inline-status')).toHaveText('合成网络失败');await expect(page.locator('#ai-plan-goal')).toHaveValue('明天学习接口');await expect(page.locator('#generate-personal-plan')).toBeEnabled();await expect(page.locator('#modal')).toBeHidden();
});

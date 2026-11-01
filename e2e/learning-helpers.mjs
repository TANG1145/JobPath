import {expect} from '@playwright/test';
export async function setupLearning(page,direction='robotics'){
 await page.goto('/');await page.locator('[data-page=jobs]').click();await page.locator('[data-action=jd]').click();await page.locator('[name=title]').fill('自由规划测试目标');await page.locator('[name=jd]').fill('本人确认的岗位资料');await page.locator('[name=direction]').selectOption(direction);await page.getByRole('button',{name:'确认并保存',exact:true}).click();await page.locator('#next-target').click();await expect(page.locator('h1')).toHaveText('备战控制台');
}
export async function addCustom(page,title='我的实验'){
 await page.locator('[data-action=addLearning]').click();await page.locator('[name=title]').fill(title);await page.locator('[name=skill]').fill('自选主题');await page.locator('[name=acceptance]').fill('运行一个示例并解释输入输出和限制');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await expect(page.locator('#modal')).not.toBeVisible();
}

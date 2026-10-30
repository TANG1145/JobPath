import {test,expect} from '@playwright/test';
test('Strands球内文字、无外框，重力落地后鼠标推动并保持点击可用',async({page})=>{await page.goto('/');await page.locator('[data-page=jobs]').click();const field=page.locator('.bubble-field'),ball=page.locator('[data-category]').first();await expect(field).toHaveAttribute('data-physics','running');await expect(field).toHaveCSS('border-top-width','0px');await expect(page.locator('.strands-container').first()).toBeVisible();await page.waitForTimeout(2200);await ball.scrollIntoViewIfNeeded();const rect=await ball.boundingBox(),label=await ball.locator('.orb-label').boundingBox();expect(label.x).toBeGreaterThanOrEqual(rect.x);expect(label.y).toBeGreaterThanOrEqual(rect.y);const before=Number(await ball.getAttribute('data-ball-x'));await page.mouse.move(rect.x-15,rect.y+rect.height*.4);await page.mouse.move(rect.x+rect.width*.4,rect.y+rect.height*.4,{steps:5});await expect.poll(async()=>Math.abs(Number(await ball.getAttribute('data-ball-x'))-before)).toBeGreaterThan(.5);await page.keyboard.press('Tab');await page.locator('[data-category-open=web]').focus();await page.keyboard.press('Enter');await expect(page.locator('#category-jobs-view')).toBeVisible();});
test('拖动释放后不误打开详情，筛选重建物理场，减弱动态后静止',async({page})=>{await page.goto('/');await page.locator('[data-page=jobs]').click();await expect(page.locator('.bubble-field')).toHaveAttribute('data-physics','running');await page.waitForTimeout(2000);const ball=page.locator('[data-category]').first(),r=await ball.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+80,r.y+r.height/2-80,{steps:12});await page.mouse.up();await expect(page.locator('#category-view')).toBeVisible();await expect(page.locator('#category-jobs-view')).toBeHidden();await page.getByLabel('搜索岗位分类').fill('测试');await expect(page.locator('[data-category]:visible')).toHaveCount(1);await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.bubble-field')).toHaveAttribute('data-physics','static');await expect(page.locator('[data-category=test]')).toHaveCSS('position','static');});

test('18个球共享同款渲染且只有一个WebGL源，减弱动态使用同款静态帧',async({page})=>{
 await page.setViewportSize({width:1920,height:1400});await page.goto('/');await page.locator('[data-page=jobs]').click();
 await expect(page.locator('[data-visual-state=shared]')).toHaveCount(18);
 await expect(page.locator('.strands-copy')).toHaveCount(18);
 await expect(page.locator('.strands-shared-source canvas')).toHaveCount(1);
 const pixels=await page.locator('.strands-copy').evaluateAll(canvases=>canvases.map(c=>{const d=c.getContext('2d').getImageData(128,40,1,1).data;return [...d]}));
 expect(pixels.every(p=>p[3]>0&&p[0]<60&&p[1]<60&&p[2]<60)).toBeTruthy();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.strands-still')).toHaveCount(18);await expect(page.locator('.strands-shared-source')).toHaveCount(0);
 expect(await page.locator('.strands-still').evaluateAll(imgs=>new Set(imgs.map(i=>i.src)).size)).toBe(1);
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('.strands-copy')).toHaveCount(18);
 await page.locator('[data-page=prep]').click();await expect(page.locator('.strands-shared-source')).toHaveCount(0);
});

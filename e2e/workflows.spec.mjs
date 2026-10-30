import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-30T14:00:00+08:00') });
});

async function chooseTarget(page, index = 0) {
  await page.goto('/');
  await page.locator('[data-target-public]').nth(index).click();
  await expect(page).toHaveURL(/#\/prepare/);
}

test('首访先选岗，生成计划、完成任务并保留目标', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '先选一个目标岗位' })).toBeVisible();
  await expect(page.getByText('先定一个目标，再谈计划')).toBeVisible();

  await page.locator('[data-target-public]').first().click();
  await expect(page).toHaveURL(/#\/prepare/);
  const title = await page.locator('h1').innerText();
  await expect(page.locator('.target-chip')).toContainText(title);

  await page.getByRole('button', { name: '生成 4/8 周计划', exact: true }).first().click();
  await page.locator('[name=weeks]').selectOption('4');
  await page.getByRole('button', { name: '预览计划', exact: true }).click();
  await expect(page.getByRole('heading', { name: '确认计划差异' })).toBeVisible();
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('#modal')).not.toBeVisible();
  await expect(page.locator('[data-task]')).toHaveCount(3);

  await page.locator('[data-task]').first().click();
  await page.locator('[name=status]').selectOption('完成');
  await page.locator('[name=evidence]').fill('独立实现了最小页面，验证了正常输入和空结果两种情况。');
  await page.locator('[name=accepted]').check();
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('#modal')).not.toBeVisible();
  await expect(page.getByText('独立实现了最小页面，验证了正常输入和空结果两种情况。')).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/#\/prepare/);
  await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('.target-chip')).toContainText(title);
});

test('粘贴 JD、XSS 纯文本和来源 URL 校验', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ 粘贴岗位 JD', exact: true }).click();
  await page.locator('[name=title]').fill('合成前端实习');
  await page.locator('[name=company]').fill('合成公司');
  await page.locator('[name=jd]').fill('熟悉 JavaScript <img src=x onerror="document.body.dataset.xss=1">');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page).toHaveURL(/#\/prepare/);
  expect(await page.locator('img[src=x]').count()).toBe(0);
  expect(await page.locator('body').getAttribute('data-xss')).toBeNull();

  await page.getByRole('button', { name: '编辑要求', exact: true }).first().click();
  await page.locator('[name=source]').fill('javascript:alert(1)');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('#form-error')).toContainText('HTTPS');
  await expect(page.locator('#modal')).toBeVisible();
});

test('三档宽度无横向溢出，移动端底部导航可见', async ({ page }) => {
  await chooseTarget(page);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['opportunities', 'prepare', 'career', 'settings']) {
      await page.goto(`/#/${route}`);
      const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      expect(size.width).toBe(width);
      expect(size.scroll).toBeLessThanOrEqual(width);
      if (width <= 390) await expect(page.locator('.bottom-nav')).toBeVisible();
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#/opportunities');
  await expect(page.locator('.bottom-nav')).toBeHidden();
  await expect(page.locator('.top-nav')).toBeVisible();
});

test('AI 关闭时隐藏 AI 入口，核心页面不外发请求', async ({ page, request }) => {
  const external = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:5197/') && !request.url().startsWith('data:')) external.push(request.url());
  });
  await page.goto('/#/settings');
  await expect(page.getByText('AI 未开启', { exact: false })).toBeVisible();
  await expect(page.locator('[data-ai-answer]')).toHaveCount(0);
  const health = await (await request.get('/api/health')).json();
  expect(health.aiEnabled).toBe(false);
  expect(external).toEqual([]);
});

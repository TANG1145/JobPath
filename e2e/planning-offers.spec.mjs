import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('投递、轮次、Offer 与历史可恢复', async ({ page }) => {
  await page.goto('/#/career');
  await page.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await page.locator('[name=title]').fill('合成前端实习');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.app-card')).toHaveCount(1);

  await page.locator('[data-stage]').first().selectOption('已投递');
  await page.locator('[name=appliedDate]').fill('2026-10-30');
  await page.locator('[name=reason]').fill('官网提交完成');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.app-card')).toContainText('投递：2026-10-30');

  await page.getByRole('button', { name: '添加轮次', exact: true }).click();
  await page.locator('[name=name]').fill('第一轮技术面');
  await page.locator('[name=date]').fill('2026-11-02');
  await page.locator('[name=status]').selectOption('已安排');
  await page.locator('[name=note]').fill('合成问题与准备清单');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.app-card')).toContainText('轮次：1');
  await page.locator('.app-history summary').click();
  await expect(page.locator('.app-card')).toContainText('第一轮技术面');

  await page.locator('[data-stage]').first().selectOption('Offer');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.app-card')).toContainText('Offer');
  await page.locator('[data-offer]').first().click();
  await page.locator('[name=city]').fill('上海');
  await page.locator('[name=compensation]').fill('月薪 10000 元，奖金待确认（合成测试）');
  await page.locator('[name=questions]').fill('<img src=x onerror="window.offerXSS=1">');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.offer-card')).toContainText('上海');
  expect(await page.locator('img[src=x]').count()).toBe(0);
  expect(await page.evaluate(() => window.offerXSS)).toBeUndefined();

  await page.reload();
  await expect(page.locator('.offer-card')).toContainText('上海');
  await page.locator('.app-history summary').click();
  await expect(page.locator('.app-card')).toContainText('已投递');
});

test('备份导出、未来版本拒绝与恢复', async ({ page }) => {
  await page.goto('/#/career');
  await page.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await page.locator('[name=title]').fill('备份测试岗位');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.goto('/#/settings');

  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份', exact: true }).click();
  const raw = await readFile(await (await pending).path());
  const backup = JSON.parse(raw);
  expect(backup.containsPersonalData).toBe(true);
  expect(backup.generationNotice).toContain('AI');
  expect(backup.data.applications).toHaveLength(1);
  expect(raw.toString()).not.toContain('DEEPSEEK_API_KEY');

  await page.locator('#importfile').setInputFiles({
    name: 'future.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"jobpath","schemaVersion":99,"data":{}}')
  });
  await expect(page.locator('#toast')).toContainText('格式或版本');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#importfile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: raw });
  await expect(page.locator('#toast')).toContainText('备份已恢复');
  await page.goto('/#/career');
  await expect(page.locator('.app-card')).toHaveCount(1);
});

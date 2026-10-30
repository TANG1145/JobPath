import { test, expect } from '@playwright/test';

test('编辑关闭提醒、草稿恢复与保存失败重试', async ({ page }) => {
  await page.goto('/#/career');
  await page.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await page.locator('[name=title]').fill('尚未提交的草稿岗位');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#cancel').click();
  await expect(page.locator('#modal')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#cancel').click();
  await expect(page.locator('#modal')).not.toBeVisible();

  await page.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await expect(page.locator('#restore-draft')).toBeVisible();
  await page.locator('#restore-draft').click();
  await expect(page.locator('[name=title]')).toHaveValue('尚未提交的草稿岗位');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.app-card')).toHaveCount(1);

  await page.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await page.locator('[name=title]').fill('保存故障合成岗位');
  await page.evaluate(() => {
    window.originalTx = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[1] === 'readwrite') throw new DOMException('模拟存储不足', 'QuotaExceededError');
      return window.originalTx.apply(this, args);
    };
  });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('#form-error')).toContainText('模拟存储不足');
  await expect(page.locator('[name=title]')).toHaveValue('保存故障合成岗位');
  await expect(page.locator('.save-state')).toContainText('保存失败');

  await page.evaluate(() => { IDBDatabase.prototype.transaction = window.originalTx; });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('#modal')).not.toBeVisible();
  await expect(page.locator('.app-card')).toHaveCount(2);
});

test('双标签冲突保留正式记录，刷新后可恢复失败输入', async ({ page, context }) => {
  await page.goto('/#/career');
  const other = await context.newPage();
  await other.goto('/#/career');

  await page.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await page.locator('[name=title]').fill('先保存的记录');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.app-card')).toHaveCount(1);

  await other.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await other.locator('[name=title]').fill('冲突后的草稿');
  await other.getByRole('button', { name: '保存', exact: true }).click();
  await expect(other.locator('#form-error')).toContainText('另一标签页');
  await expect(other.locator('[name=title]')).toHaveValue('冲突后的草稿');
  other.once('dialog', (dialog) => dialog.accept());
  await other.reload();
  await other.getByRole('button', { name: '+ 添加记录', exact: true }).click();
  await other.locator('#restore-draft').click();
  await expect(other.locator('[name=title]')).toHaveValue('冲突后的草稿');
  await other.getByRole('button', { name: '保存', exact: true }).click();
  await expect(other.locator('.app-card')).toHaveCount(2);
  await other.close();
});

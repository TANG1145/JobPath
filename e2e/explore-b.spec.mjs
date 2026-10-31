import { test, expect } from '@playwright/test';

test('B 集成：从机会页进入 18 方向探索，选择与筛选可用', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-page=jobs]').click();
  const entry = page.getByRole('link', { name: /探索 18 个方向/ });
  await expect(entry).toHaveCount(1);
  await entry.click();
  await expect(page).toHaveURL(/\/explore\.html$/);
  await expect(page.locator('.orb')).toHaveCount(18);
  await expect(page.locator('#category-detail h2')).toHaveText('Web 前端开发');
  await expect(page.locator('.category-count')).toContainText('8');

  await page.locator('.orb[data-id="product"]').click({ force: true });
  await expect(page.locator('#category-detail h2')).toHaveText('产品策划');
  await expect(page.locator('.category-count')).toContainText('4');

  await page.locator('#explore-search').fill('数据');
  await expect(page.locator('.orb:visible')).toHaveCount(5);
  await page.locator('#view-toggle').click();
  await expect(page.locator('.list-item:visible')).toHaveCount(5);
  await page.locator('#view-toggle').click();
  await expect(page.locator('.orb:visible')).toHaveCount(5);
  await page.locator('#explore-search').fill('');

  await page.getByRole('link', { name: /返回工作台/ }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5197/');
});

test('B 集成移动端：三列水晶球、无横向溢出、详情可见', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/explore.html');
  await expect(page.locator('#orb-field')).toHaveClass(/is-grid/);
  await expect(page.locator('.orb')).toHaveCount(18);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('.orb[data-id="operations"]').click({ force: true });
  await expect(page.locator('#category-detail h2')).toHaveText('产品与内容运营');
  await expect(page.locator('#category-detail h2')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

import { test, expect } from '@playwright/test';

test('探索页：18 个方向、选择、搜索与列表视图', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /探索 18 个方向/ }).click();
  await expect(page).toHaveURL(/\/explore\.html$/);
  await expect(page).toHaveTitle(/探索 18 个方向/);
  await expect(page.locator('.orb')).toHaveCount(18);
  await expect(page.locator('#category-detail h2')).toHaveText('Web 前端开发');

  await page.locator('.orb[data-id="product"]').click({ force: true });
  await expect(page.locator('#category-detail h2')).toHaveText('产品策划');
  await expect(page.locator('.category-count')).toContainText('0');

  await page.locator('#explore-search').fill('数据');
  await expect(page.locator('.orb:visible')).toHaveCount(5);
  await page.locator('#view-toggle').click();
  await expect(page.locator('.list-item:visible')).toHaveCount(5);
  await page.locator('#view-toggle').click();
  await expect(page.locator('.orb:visible')).toHaveCount(5);
  await page.locator('#explore-search').fill('');
  await expect(page.locator('.orb:visible')).toHaveCount(18);

  await page.getByRole('link', { name: /返回工作台/ }).click();
  await expect(page).toHaveURL(/\/#\/opportunities$/);
});

test('探索页移动端：三列水晶球与详情可见', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/explore.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator('#orb-field')).toHaveClass(/is-grid/);
  await expect(page.locator('.orb')).toHaveCount(18);
  await page.locator('.orb[data-id="operations"]').click({ force: true });
  await expect(page.locator('#category-detail h2')).toHaveText('产品与内容运营');
  await expect(page.locator('#category-detail h2')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

import {expect} from '@playwright/test';
export async function finishSaved(page){await expect.poll(async()=>!await page.locator('#modal').isVisible()||await page.locator('#return-saved').isVisible()).toBe(true);if(await page.locator('#return-saved').isVisible())await page.locator('#return-saved').click()}
export async function openSaved(page){if(!await page.locator('#detail-edit').isVisible()){if(await page.locator('#return-saved').isVisible())await page.locator('#return-saved').click();await page.locator('[data-organize]').first().click()}}
export async function openEdit(page){await openSaved(page);await page.locator('#detail-edit').click()}

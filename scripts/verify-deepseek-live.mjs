// Explicit opt-in: one paid provider call at most per run. No user browser data is read.
import {mkdirSync,writeFileSync} from 'node:fs';
import {configureNetwork} from '../backend/network.mjs';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {expect} from '@playwright/test';
import {Quota,hash} from '../backend/quota.mjs';
import {deepseek} from '../backend/ai.mjs';
import {createServer} from '../backend/http.mjs';
import {finishSaved,openAI} from '../e2e/saved-helpers.mjs';
if(!process.argv.includes('--allow-paid-call'))throw Error('Pass --allow-paid-call only when a paid verification is authorized');
process.loadEnvFile('.env');
const restoreNetwork=configureNetwork();
if(!process.env.DEEPSEEK_API_KEY)throw Error('Configure DEEPSEEK_API_KEY locally first');
mkdirSync('.local',{recursive:true,mode:0o700});
const quota=new Quota('.local/quota.sqlite',{personalDay:1,personalTotal:1});
const token=randomUUID();quota.invite(token,Date.now()+600000);
let calls=0,usage,enabled=true,browser;
const report={at:new Date().toISOString(),checks:[],providerCalls:0};
const server=createServer({quota,enabled:()=>enabled,origin:'http://127.0.0.1:5198',provider:async body=>{if(++calls>1)throw Error('Live verification allows only one upstream call');const result=await deepseek(body,{key:process.env.DEEPSEEK_API_KEY});usage=result.usage;return result}});
const check=name=>{report.checks.push(name);console.log('PASS '+name)};
await new Promise(r=>server.listen(5198,'127.0.0.1',r));
try{
 browser=await chromium.launch();const page=await browser.newPage();page.setDefaultTimeout(10000);
 const stored=()=>page.evaluate(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('jobpath-v1');q.onsuccess=()=>r(q.result)});return new Promise(r=>{const q=db.transaction('state').objectStore('state').get('main');q.onsuccess=()=>{db.close();r(q.result)}})});
 await page.goto('http://127.0.0.1:5198');await page.evaluate(t=>sessionStorage.setItem('jobpath-invite',t),token);
 await page.locator('[data-page=jobs]').click();await page.locator('[data-action=jd]').click();await page.locator('[name=title]').fill('合成岗位：前端协作开发');
 const jd='岗位职责：开发 Web 界面并与设计师协作。技能要求：必须掌握 React 或 Vue，任一即可；掌握 TypeScript；熟悉 Figma 者优先。申请资格：本科及以上，2027 届毕业生，至少实习 4 个月。';
 await page.locator('[name=jd]').fill(jd);await page.locator('[name=direction]').selectOption('web');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await finishSaved(page);
 await openAI(page);await expect(page.locator('#jd-send')).toBeEnabled();await page.locator('#jd-send').click();expect(calls).toBe(0);await page.locator('#cancel').click();check('未同意及取消预览均不请求供应商');
 await openAI(page);await expect(page.locator('#jd-send')).toBeEnabled();await page.locator('#jd-consent').check();const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/ai'));
 await page.locator('#jd-send').click();const response=await responsePromise;const result=await response.json();expect(response.status(),result.message).toBe(200);
 await expect(page.locator('#jd-status')).toContainText('DeepSeek AI记录已保存',{timeout:30000});expect(calls).toBe(1);await expect(page.locator('#jd-send')).toBeDisabled();check('真实 DeepSeek 请求成功且不会自动重复发送');
 const requirements=result.data.requirements;expect(requirements.some(r=>r.logic==='any'&&r.skillIds.includes('React')&&r.skillIds.includes('Vue'))).toBe(true);expect(requirements.some(r=>r.kind==='preferred'&&r.skillIds.includes('Figma'))).toBe(true);expect(requirements.flatMap(r=>r.skillIds).some(s=>/本科|2027|个月/.test(s))).toBe(false);expect(requirements.every(r=>jd.includes(r.sourceQuote))).toBe(true);check('原文引用、任一与优先关系、新技能和资格分离');
 expect((await stored()).jobs[0].requirements).toBeUndefined();await page.locator('#jd-edit').click();await expect(page.locator('#jd-status')).toContainText('请先勾选已审阅');await page.locator('#jd-review').check();await page.locator('#jd-edit').click();await expect(page.locator('#requirement-rows fieldset')).toHaveCount(requirements.length);expect((await stored()).jobs[0].requirements).toBeUndefined();check('审阅门槛和保存前不覆盖');
 await page.locator('[data-field=level]').first().selectOption('2');await page.getByRole('button',{name:'确认并保存',exact:true}).click();await finishSaved(page);expect((await stored()).jobs[0].requirements[0].level).toBe(2);check('候选可修改并保存正式要求');
 await page.reload();await page.locator('[data-page=jobs]').click();await page.locator('[data-open-saved]').click();await openAI(page);await expect(page.locator('#jd-status')).toContainText('已恢复上次');expect((await stored()).jobs[0].requirements.length).toBe(requirements.length);expect(calls).toBe(1);check('刷新后恢复已保存要求及 AI 结果');
 const send=(key)=>page.request.post('http://127.0.0.1:5198/api/ai',{headers:{Authorization:'Bearer '+token,'Idempotency-Key':key},data:{mode:'jd_extract',consentVersion:'2026-10-16-v1',payload:{text:jd}}});
 const denied=await send(randomUUID());expect(denied.status()).toBe(429);expect(calls).toBe(1);check('额度耗尽不再次调用供应商');
 enabled=false;const off=await send(randomUUID());expect(off.status()).toBe(503);expect(calls).toBe(1);check('关闭服务后继续阻断真实请求');
 report.status='passed';report.requirements=requirements;
}catch(e){report.status='failed';report.error=e.message;throw e}
finally{report.providerCalls=calls;report.usage=usage;report.ledger=quota.db.prepare('SELECT status,actual,code FROM requests WHERE invite=?').all(hash(token));quota.db.prepare('UPDATE invites SET disabled=1 WHERE hash=?').run(hash(token));writeFileSync('.local/deepseek-live-report.json',JSON.stringify(report,null,2),{mode:0o600});await browser?.close();await new Promise(r=>server.close(r));quota.close();restoreNetwork();console.log('Report: .local/deepseek-live-report.json');}

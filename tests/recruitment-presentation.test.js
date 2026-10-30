import test from 'node:test';import assert from 'node:assert/strict';
import {beijingTime,checkSummary,categoryTaglines,categoryTechnologies} from '../src/recruitment-presentation.js';
import {categories} from '../src/opportunity-categories.js';
test('北京时间转换，缺失和日期精度不补造',()=>{assert.equal(beijingTime('2026-10-30T12:29:34.568Z'),'2026/10/30 20:29');assert.equal(beijingTime('2026-10-30'),'2026/10/30');assert.equal(beijingTime(null),'未记录');assert.equal(beijingTime('未知'),'未记录')});
test('任务完成时间不能冒充岗位检查时间',()=>{assert.equal(checkSummary([],{started:Date.now(),status:'complete'}).label,'暂无更新记录');const summary=checkSummary([{checkedAt:'2026-10-30T12:00:00Z',hiringStatus:'open'},{checkedAt:'2026-10-29',hiringStatus:'unknown'}],{started:Date.now(),status:'failed'});assert.equal(summary.latest,'2026-10-30T12:00:00Z');assert.match(summary.label,/部分待核验/);assert.match(summary.runLabel,/失败/)});
test('全部分类都有短介绍与独立技术说明',()=>{for(const c of categories){assert.ok(categoryTaglines[c.id]);assert.ok(categoryTechnologies[c.id])}});

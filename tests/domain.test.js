import test from 'node:test';import assert from 'node:assert/strict';import {plan,validateBackup} from '../src/domain.js';
for(const h of [0,1,8,40])test(`计划不超过 ${h} 小时的 80% 容量`,()=>{const p=plan('web',h);assert.ok(p.reduce((s,t)=>s+t.minutes,0)<=h*48);assert.ok(p.every(t=>t.minutes<=90));});
test('拒绝未来版本与不完整备份',()=>{assert.throws(()=>validateBackup({app:'jobpath',schemaVersion:2}));assert.throws(()=>validateBackup({app:'jobpath',schemaVersion:1,data:{direction:'web',hours:8,tasks:[]}}));});

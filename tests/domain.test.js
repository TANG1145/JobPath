import test from 'node:test';import assert from 'node:assert/strict';import {validateBackup} from '../src/domain.js';
test('拒绝未来版本与不完整备份',()=>{assert.throws(()=>validateBackup({app:'jobpath',schemaVersion:2}));assert.throws(()=>validateBackup({app:'jobpath',schemaVersion:1,data:{direction:'web',hours:8,tasks:[]}}));});

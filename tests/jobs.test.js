import test from 'node:test';
import assert from 'node:assert/strict';
import {publicJobs,historicalJobs,jobState,catalogStats,snapshotJob} from '../src/jobs.js';
import {validateBackup} from '../src/domain.js';
const at=Date.parse('2026-10-30T06:00:00Z'),base=publicJobs[0];
test('官方目录12条、每方向4条、至少3家、来源无重复，关闭岗位不计数',()=>{
 const s=catalogStats([...publicJobs,...historicalJobs],at);assert.equal(s.count,12);assert.deepEqual(s.directions,{java:4,web:4,test:4});assert.ok(s.ready);assert.equal(new Set(publicJobs.map(j=>j.source)).size,12);assert.equal(new Set(publicJobs.map(j=>j.id)).size,12);
 for(const j of publicJobs){assert.ok(j.eligibility&&j.jd&&j.applicationEvidence);assert.equal(new URL(j.source).protocol,'https:');for(const r of j.requirements)assert.ok(j.jd.includes(r.quote));}
});
test('岗位7天边界、30天历史、未来/无效时钟、截止日期和关闭状态',()=>{
 const checked=Date.parse(base.checkedAt);assert.equal(jobState(base,checked+7*86400000).code,'current');assert.equal(jobState(base,checked+7*86400000+1).code,'stale');assert.ok(jobState(base,checked+30*86400000).current);assert.equal(jobState(base,checked+30*86400000+1).code,'historical');assert.equal(jobState(base,checked-1).current,false);assert.equal(jobState({...base,checkedAt:'bad'},at).current,false);assert.equal(jobState({...base,expires:'2026-10-29'},at).code,'closed');assert.equal(jobState({...base,applicationStatus:'closed'},at).current,false);
});
test('可访问不能代替要求/开放核验；未知记录不进入当前机会',()=>{
 for(const patch of [{requirementsVerified:false},{applicationStatus:'unknown'},{reviewStatus:'candidate'},{pageReachable:false},{sourceType:'aggregator'}])assert.equal(jobState({...base,...patch},at).current,false);
 assert.equal(catalogStats([base,{...base,id:'duplicate',city:'其他城市',source:base.source+'?city=other'}],at).count,1);assert.equal(jobState(base,NaN).current,false);assert.equal(jobState({...base,expires:'invalid'},at).current,false);
});
test('收藏复制快照、资格待确认，不含申请且不共享要求引用',()=>{
 const original={...publicJobs[1],checkedAt:new Date().toISOString()};const j=snapshotJob(original,'test-snapshot');assert.equal(j.qualification,'待确认');assert.equal(j.catalogVersion,original.version);assert.ok(!('stage' in j));j.requirements[0].skills.push('X');assert.ok(!original.requirements[0].skills.includes('X'));
 const data={direction:'web',hours:8,jobs:[j],tasks:[],applications:[],answers:[]};assert.equal(validateBackup({app:'jobpath',schemaVersion:1,data}),data);
 assert.throws(()=>snapshotJob({...original,applicationStatus:'closed'},'closed'));
});

import {Quota,hash} from './quota.mjs';import {validateInput,validateOutput,CONSENT} from './ai.mjs';import {mockJD} from '../src/jd-mock.js';
const fail=(status,message)=>{throw Object.assign(Error(message),{status})};
export class JDMock{
 constructor(file=':memory:',{provider=mockJD,timeout=1000,limits={}}={}){this.quota=new Quota(file,limits);this.provider=provider;this.timeout=timeout;this.quota.db.exec('CREATE TABLE IF NOT EXISTS jd_cache(client TEXT,key TEXT,fingerprint TEXT,result TEXT,PRIMARY KEY(client,key))');}
 client(client){if(!/^[\w-]{16,80}$/.test(client||''))fail(400,'模拟标识无效');if(!this.quota.valid(client)){try{this.quota.invite(client,Date.now()+365*86400000)}catch{fail(403,'模拟身份已过期')}}return client;}
 counts(client){return {...this.quota.counts(this.client(client)),mode:'mock',dailyLimit:this.quota.limits.personalDay,windowLimit:this.quota.limits.personalTotal};}
 async run(client,key,input){this.client(client);if(!/^[\w-]{16,80}$/.test(key||''))fail(400,'请求标识无效');if(input?.mode!=='jd_extract')fail(400,'此入口只支持JD整理');const text=validateInput(input),fingerprint=hash(text),cached=this.quota.db.prepare('SELECT * FROM jd_cache WHERE client=? AND key=?').get(hash(client),key);if(cached){if(cached.fingerprint!==fingerprint)fail(409,'同一标识不能更换原文');return {...JSON.parse(cached.result),quota:this.counts(client)}}
 const id=this.quota.reserve(client,key,'jd_mock');let timer,result;try{const raw=await Promise.race([Promise.resolve().then(()=>this.provider(text)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('模拟超时')),this.timeout)})]);const data=validateOutput('jd_extract',raw,text);result={status:'completed',mode:'mock',data,at:Date.now()};this.quota.finish(id,'completed',0);}catch{result={status:'failed',mode:'mock',message:'模拟未完成或返回内容无效。原文未修改，请继续手动编辑；不会自动重试。'};this.quota.finish(id,'failed',0);}finally{clearTimeout(timer)}this.quota.db.prepare('INSERT INTO jd_cache VALUES(?,?,?,?)').run(hash(client),key,fingerprint,JSON.stringify(result));return {...result,quota:this.counts(client)};
 }
 close(){this.quota.close()}
}
export {CONSENT};

import {emptyDataset,tables,validateDataset,readBackup,type Dataset,type RecordData,type Table} from '../../shared/schemas/model';
import {migrateLegacy,newProfile} from './migrate';
export type Change={table:Table;record?:RecordData;id?:string;expected:number|null;checkOnly?:boolean};
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
const complete=(tx:IDBTransaction)=>{const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error||Error('事务已取消；原数据未覆盖'))});done.catch(()=>{});return done;};
const immutable=new Set<Table>(['snapshots','requirements','materials','applicationMaterials','planItems','answers','turns','feedback','events']);
export async function openRepository(factory:IDBFactory=indexedDB,name='jobpath-v2'){
 const r=factory.open(name,1);r.onupgradeneeded=()=>{for(const t of [...tables,'meta','recovery'])r.result.createObjectStore(t,{keyPath:'id'})};return new Repository(await request(r));
}
export class Repository{
 constructor(public db:IDBDatabase){}
 async read(){const tx=this.db.transaction(tables,'readonly'),done=complete(tx);const rows=await Promise.all(tables.map(t=>request(tx.objectStore(t).getAll())));await done;return Object.fromEntries(tables.map((t,i)=>[t,rows[i]])) as Dataset;}
 async metadata(){const tx=this.db.transaction('meta','readonly');return request<any>(tx.objectStore('meta').get('active'))}
 async recoveries(){const tx=this.db.transaction('recovery','readonly');return request<any[]>(tx.objectStore('recovery').getAll())}
 async recovery(id:string,body:unknown){const tx=this.db.transaction('recovery','readwrite'),done=complete(tx);if(!await request(tx.objectStore('recovery').get(id)))tx.objectStore('recovery').put({id,at:Date.now(),body});await done;}
 async commit(changes:Change[]){
  const tx=this.db.transaction([...tables,'meta'],'readwrite'),done=complete(tx);let failure:unknown;
  try{const meta=await request<any>(tx.objectStore('meta').get('active'));if(!meta)throw Error('请先完成迁移确认');const d=emptyDataset();for(const t of tables)d[t]=await request(tx.objectStore(t).getAll());
   const touched=new Set();for(const c of changes){const id=c.record?.id||c.id;if(!id)throw Error('缺少记录ID');const key=c.table+':'+id;if(touched.has(key))throw Error('重复写入同一对象');touched.add(key);const previous=d[c.table].find(x=>x.id===id);if((previous?.revision??null)!==c.expected)throw Error('另一标签页已更新此记录，请重载后恢复草稿；本次没有覆盖。');if(c.checkOnly)continue;if(previous&&immutable.has(c.table))throw Error('历史版本只能追加，不能覆盖或删除');
   d[c.table]=d[c.table].filter(x=>x.id!==id);if(c.record){const record={...c.record,createdAt:previous?.createdAt??c.record.createdAt,updatedAt:Date.now(),revision:(previous?.revision??-1)+1};d[c.table].push(record);}}
   const valid=validateDataset(d);for(const c of changes){if(c.checkOnly)continue;const id=c.record?.id||c.id!;const record=valid[c.table].find(r=>r.id===id);if(record)tx.objectStore(c.table).put(record);else tx.objectStore(c.table).delete(id);}tx.objectStore('meta').put({...meta,revision:meta.revision+1,updatedAt:Date.now()});
  }catch(e){failure=e;try{tx.abort()}catch{}}try{await done}catch(e){throw failure||e}
 }
 // Explicit whole-backup import only. Keep the previous complete database in the same atomic transaction.
 async replace(data:Dataset,expectedMeta:number|null,source:unknown,label='import'){
  const valid=validateDataset(data),tx=this.db.transaction([...tables,'meta','recovery'],'readwrite'),done=complete(tx);let failure:unknown;
  try{const current=await request<any>(tx.objectStore('meta').get('active'));if((current?.revision??null)!==expectedMeta)throw Error('数据在预览后已变化，请重新预览');const prior=emptyDataset();for(const t of tables)prior[t]=await request(tx.objectStore(t).getAll());
   tx.objectStore('recovery').put({id:`${label}-${Date.now()}-${crypto.randomUUID()}`,at:Date.now(),body:current?{app:'jobpath',schemaVersion:2,exportedAt:new Date().toISOString(),data:prior}:source});
   for(const t of tables){tx.objectStore(t).clear();for(const record of valid[t]){const previous=prior[t].find(r=>r.id===record.id);tx.objectStore(t).put({...record,revision:previous?Math.max(previous.revision+1,record.revision):record.revision})}}tx.objectStore('meta').put({id:'active',schemaVersion:2,revision:(current?.revision??-1)+1,updatedAt:Date.now(),source:label});
  }catch(e){failure=e;try{tx.abort()}catch{}}try{await done}catch(e){throw failure||e}
 }
 async initialize(){
  // Serialize the existence check and seed in one transaction across tabs.
  const tx=this.db.transaction([...tables,'meta'],'readwrite'),done=complete(tx);let failure:unknown;
  try{const current=await request(tx.objectStore('meta').get('active'));if(!current){const d=emptyDataset();d.profiles=[newProfile()];validateDataset(d);tx.objectStore('profiles').put(d.profiles[0]);tx.objectStore('meta').put({id:'active',schemaVersion:2,revision:0,updatedAt:Date.now(),source:'new'})}}
  catch(e){failure=e;try{tx.abort()}catch{}}try{await done}catch(e){throw failure||e}
 }
 close(){this.db.close()}
}
export async function legacyBackup(factory:IDBFactory=indexedDB){
 if(factory.databases){const list=await factory.databases();if(!list.some(x=>x.name==='jobpath-v1'))return null;}
 return new Promise<any>((resolve,reject)=>{const r=factory.open('jobpath-v1');r.onupgradeneeded=()=>{r.transaction!.abort();resolve(null)};r.onerror=()=>{if(r.error?.name!=='AbortError')reject(r.error)};r.onsuccess=async()=>{const db=r.result;try{if(!db.objectStoreNames.contains('state')){resolve(null);return}const old=await request(db.transaction('state').objectStore('state').get('main'));resolve(old?{app:'jobpath',schemaVersion:1,data:old}:null)}catch(e){reject(e)}finally{db.close()}}});
}
export function parseImport(raw:string){if(raw.length>8*1024*1024)throw Error('备份超过8MB');if(/"(?:__proto__|constructor|prototype)"\s*:/.test(raw))throw Error('备份包含不允许的字段');const source=JSON.parse(raw);return {source,data:source.schemaVersion===1?migrateLegacy(source):readBackup(source)};}

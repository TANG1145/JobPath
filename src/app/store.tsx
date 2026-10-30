import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import {openRepository,legacyBackup,Repository,type Change} from '../storage/repository';
import {migrateLegacy,migrationSummary} from '../storage/migrate';
import {emptyDataset,type Dataset,type RecordData,type Table} from '../../shared/schemas/model';
export const fresh=(fields:Record<string,any>,id:string=crypto.randomUUID()):RecordData=>({id,createdAt:Date.now(),updatedAt:Date.now(),revision:0,...fields});
export const add=(table:Table,record:RecordData):Change=>({table,record,expected:null});
export const edit=(table:Table,record:RecordData,expected=record.revision):Change=>({table,record,expected});
export const remove=(table:Table,record:RecordData):Change=>({table,id:record.id,expected:record.revision});
export const event=(objectId:string,type:string,meta:Record<string,unknown>={})=>add('events',fresh({objectId,type,at:Date.now(),meta}));
export function download(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
type Store={data:Dataset;repo:Repository;commit:(changes:Change[])=>Promise<void>;reload:(reset?:boolean)=>Promise<void>;notice:string;setNotice:(v:string)=>void};
const Context=createContext<Store|null>(null);
export const useStore=()=>{const value=useContext(Context);if(!value)throw Error('数据尚未准备');return value};
export function Provider({children}:{children:ReactNode}){
 const [generation,setGeneration]=useState(0);const [repo,setRepo]=useState<Repository>(),[data,setData]=useState(emptyDataset),[migration,setMigration]=useState<{source:any;data:Dataset}|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[ready,setReady]=useState(false);const channel=useRef<BroadcastChannel|null>(null),source=useRef<any>(null);
 useEffect(()=>{let active=true;let db:Repository;openRepository().then(async r=>{db=r;if(!active){r.close();return}setRepo(r);if(!await r.metadata()){const old=await legacyBackup();source.current=old;if(old){await r.recovery('v07-original',old);const next=migrateLegacy(old);if(active)setMigration({source:old,data:next});return}await r.initialize()}if(active){setData(await r.read());setReady(true)}}).catch(e=>setError(e.message));return()=>{active=false;db?.close()}},[]);
 const reload=async(reset=false)=>{if(repo)setData(await repo.read());if(reset){setGeneration(n=>n+1);channel.current?.postMessage('updated')}};
 useEffect(()=>{if(!repo)return;const c=new BroadcastChannel('jobpath-records-v2');channel.current=c;c.onmessage=()=>{repo.read().then(setData);setNotice('另一个标签页已更新数据；未提交编辑保留原始版本，保存时仍会检查冲突。')};return()=>c.close()},[repo]);
 if(error)return <main><h1>未能读取或迁移数据</h1><p role="alert">{error}</p><p>原数据库未清空。请导出原始资料后处理损坏字段，不要继续覆盖。</p>{source.current&&<button onClick={()=>download('jobpath-recovery-v1.json',source.current)}>导出原始恢复副本</button>}</main>;
 if(migration&&repo)return <main><h1>升级数据前先核对</h1><p>已保留旧格式恢复副本；只有确认后才切换到新数据。原数据库保持不变。</p><pre>{JSON.stringify(migrationSummary(migration.data),null,2)}</pre><p>旧任务证据转为自报成果；旧回答上下文和未归属备注进入待整理，不补造事实。</p><button onClick={()=>download('jobpath-recovery-v1.json',migration.source)}>先下载旧格式副本</button> <button onClick={async()=>{try{await repo.replace(migration.data,null,migration.source,'migration-v1');setData(await repo.read());setMigration(null);setReady(true)}catch(e){setError((e as Error).message)}}}>确认迁移并核对新记录</button></main>;
 if(!repo||!ready)return <main><p role="status">正在读取本机资料…</p></main>;
 const commit=async(changes:Change[])=>{try{await repo.commit(changes);await reload();channel.current?.postMessage('updated');setNotice('已保存到本机')}catch(e){setNotice((e as Error).message);throw e}};
 return <Context.Provider value={{data,repo,commit,reload,notice,setNotice}}><div key={generation}>{children}</div></Context.Provider>;
}

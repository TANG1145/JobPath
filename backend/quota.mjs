import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
export const hash=t=>createHash('sha256').update(t).digest('hex');
export const dayKey=ms=>new Date(ms).toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});
export class Quota {
 constructor(file=':memory:',limits={}){this.db=new DatabaseSync(file);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS invites(hash TEXT PRIMARY KEY,expires INTEGER,disabled INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,invite TEXT,key TEXT,mode TEXT,at INTEGER,day TEXT,reserved INTEGER,actual INTEGER DEFAULT 0,status TEXT,code TEXT,UNIQUE(invite,key)); CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value INTEGER);`);}
 invite(token,expires){this.db.prepare('INSERT INTO invites(hash,expires) VALUES(?,?)').run(hash(token),expires)}
 valid(token,now=Date.now()){return !!this.db.prepare('SELECT 1 FROM invites WHERE hash=? AND disabled=0 ').get(hash(token))}
 counts(token,now=Date.now()){const h=hash(token),day=dayKey(now);const row=this.db.prepare('SELECT count(*) total,coalesce(sum(day=?),0) daily FROM requests WHERE invite=?').get(day,h);return {...row,unlimited:true};}
 reserve(token,key,mode,now=Date.now()){const h=hash(token),id=randomUUID();if(!this.valid(token,now))throw Object.assign(Error('AI连接不可用，请重新连接'),{status:401});try{this.db.prepare("INSERT INTO requests(id,invite,key,mode,at,day,reserved,status) VALUES(?,?,?,?,?,?,0,'reserved')").run(id,h,key,mode,now,dayKey(now));}catch(e){if(String(e.message).includes('UNIQUE'))throw Object.assign(Error('该请求已经提交，请查看生成结果'),{status:409});throw e}return id;}
 finish(id,status,actual=0,code=''){this.db.prepare('UPDATE requests SET status=?,actual=?,code=? WHERE id=?').run(status,actual,code,id);}
 close(){this.db.close()}
}

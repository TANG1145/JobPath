import {DatabaseSync} from 'node:sqlite';
export const shanghaiDay=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));
export function dueDay(now=Date.now()){const today=shanghaiDay(now);return now>=Date.parse(today+'T09:00:00+08:00')?today:shanghaiDay(now-86400000)}
export class RecruitmentStore{
 constructor(file=':memory:'){this.db=new DatabaseSync(file);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS recruitment(id TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS recruitment_runs(day TEXT PRIMARY KEY,started INTEGER,status TEXT,finished INTEGER,detail TEXT);`)}
 claim(day,now=Date.now()){const old=this.db.prepare('SELECT * FROM recruitment_runs WHERE day=?').get(day);if(old&&!(old.status==='running'&&now-old.started>20*60000))return false;return !!this.db.prepare(`INSERT INTO recruitment_runs(day,started,status) VALUES(?,?,'running') ON CONFLICT(day) DO UPDATE SET started=excluded.started,status='running' WHERE recruitment_runs.status='running' AND recruitment_runs.started<?`).run(day,now,now-20*60000).changes}
 finish(day,status,detail,now=Date.now()){this.db.prepare('UPDATE recruitment_runs SET status=?,finished=?,detail=? WHERE day=?').run(status,now,JSON.stringify(detail),day)}
 put(row){this.db.prepare('INSERT OR REPLACE INTO recruitment VALUES(?,?)').run(row.id,JSON.stringify(row))}
 snapshot(){return {rows:this.db.prepare('SELECT data FROM recruitment ORDER BY id').all().map(r=>JSON.parse(r.data)),lastRun:this.db.prepare('SELECT * FROM recruitment_runs ORDER BY started DESC LIMIT 1').get()||null,schedule:'每天 09:00（北京时间）'}}
 close(){this.db.close()}
}

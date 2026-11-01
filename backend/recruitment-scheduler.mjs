import {spawn} from 'node:child_process';
import {dueDay} from './recruitment-store.mjs';
export function startRecruitmentScheduler(store,{enabled=true,now=Date.now,launch=()=>spawn(process.execPath,['scripts/update-recruitment.mjs','--worker'],{stdio:['ignore','pipe','pipe'],env:process.env})}={}){
 let child,timer,timeout,closed=false;
 const tick=()=>{if(!enabled||closed||child)return;const day=dueDay(now());if(!store.claim(day,now()))return;try{child=launch();let result='';child.stdout?.on('data',b=>{result=(result+b.toString()).slice(-4000)});child.stderr?.on('data',()=>{});const finish=(status)=>{if(!child)return;clearTimeout(timeout);child=null;store.finish(day,status,{message:result.trim()||'采集未完成，已保留旧记录'},now())};child.once('error',()=>finish('failed'));child.once('exit',code=>finish(code===0?'complete':code===2?'partial':'failed'));timeout=setTimeout(()=>{child?.kill('SIGTERM')},15*60000);timeout.unref?.()}catch(e){child=null;store.finish(day,'failed',{message:'采集进程无法启动'},now())}};
 if(enabled){timer=setInterval(tick,60000);timer.unref?.();queueMicrotask(tick)}
 return {tick,stop(){closed=true;clearInterval(timer);clearTimeout(timeout);if(child){const stopped=child;child=null;stopped.kill('SIGTERM')}}};
}

import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createInterface} from 'node:readline';
let worker,starting,tail=Promise.resolve();
class ExplorerWorker{
 constructor(script){
  this.child=spawn('powershell.exe',['-NoProfile','-STA','-WindowStyle','Hidden','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:false,stdio:['pipe','pipe','ignore']});
  this.lines=createInterface({input:this.child.stdout});
  this.ready=this.wait();
  this.lines.on('line',line=>{if(line==='READY'||line==='OK'){this.resolve?.();this.clear()}else if(line==='ERROR'){this.reject?.(Error('文件夹未能打开，请重试'));this.clear()}});
  this.child.on('error',()=>this.stop());this.child.on('close',()=>this.stop());this.child.stdin.on('error',()=>this.stop());
 }
 clear(){clearTimeout(this.timer);this.resolve=this.reject=null}
 wait(){return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;this.timer=setTimeout(()=>this.stop(),10000)})}
 async reveal(file){await this.ready;if(this.closed)throw Error('文件服务已关闭，请重试');const done=this.wait();this.child.stdin.write(Buffer.from(file,'utf16le').toString('base64')+'\n');await done;}
 stop(){if(this.closed)return;this.closed=true;this.reject?.(Error('文件夹未能打开，请重试'));this.clear();this.lines.close();this.child.kill();if(worker===this)worker=null;}
}
export async function warmExplorer(){
 if(process.platform!=='win32')return;
 if(worker&&!worker.closed){await worker.ready;return worker}
 if(!starting)starting=(async()=>{const script=await readFile(new URL('./reveal-evidence.ps1',import.meta.url),'utf8');worker=new ExplorerWorker(script);await worker.ready;return worker})().finally(()=>{starting=null});
 return starting;
}
export function revealWindowsFile(file){
 if(process.platform!=='win32')return Promise.reject(Error('定位文件目前支持Windows'));
 const task=tail.then(async()=>{const current=await warmExplorer();await current.reveal(file)});tail=task.catch(()=>{});return task;
}
export function closeExplorer(){worker?.stop()}

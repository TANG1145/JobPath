import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,openSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const port='5175',url=`http://127.0.0.1:${port}`;
async function health(){try{const r=await fetch(url+'/api/health',{signal:AbortSignal.timeout(1000)});const b=await r.json();return r.ok&&b.version==='0.7.0'}catch{return false}}
if(process.argv.includes('--restart')){try{const info=JSON.parse(readFileSync('.local/server-process.json','utf8'));const actual=spawnSync('powershell.exe',['-NoProfile','-Command',"(Get-CimInstance Win32_Process -Filter 'ProcessId="+info.pid+"').CommandLine"],{encoding:'utf8',windowsHide:true}).stdout||'';if(actual.includes('server.mjs')&&info.cwd===process.cwd()){process.kill(info.pid);await new Promise(r=>setTimeout(r,800))}else console.log('没有可由本入口重启的服务。')}catch{console.log('未发现旧服务记录，将尝试启动。')}}
if(!await health()){
 const result=spawnSync(process.execPath,['build.mjs'],{stdio:'inherit'});if(result.status!==0)process.exit(1);
 mkdirSync('.local',{recursive:true});const out=openSync('.local/server.log','a');
 const child=spawn(process.execPath,[fileURLToPath(new URL('../server.mjs',import.meta.url))],{cwd:process.cwd(),detached:true,windowsHide:true,stdio:['ignore',out,out],env:{...process.env,PORT:port,RECRUITMENT_AUTO_UPDATE:'false'}});writeFileSync('.local/server-process.json',JSON.stringify({pid:child.pid,cwd:process.cwd()}));child.unref();
 let ready=false;for(let i=0;i<20;i++){if(await health()){ready=true;break}await new Promise(r=>setTimeout(r,500))}if(!ready){console.error('启动失败，请查看 .local/server.log；端口可能被其他应用占用。');process.exit(1)}
}
console.log('JobPath 已启动：'+url+'；后台服务独立运行，关闭启动窗口不会停止。');
if(!process.argv.includes('--no-open'))spawn('powershell.exe',['-NoProfile','-Command',`Start-Process '${url}'`],{windowsHide:true,stdio:'ignore'}).unref();

import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export function chooseWindowsFiles(){
 if(process.platform!=='win32')throw Error('本地文件选择目前支持Windows');
 const script=`[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.Windows.Forms; $dialog=New-Object System.Windows.Forms.OpenFileDialog; $dialog.Title='选择学习成果文件'; $dialog.Multiselect=$true; $dialog.CheckFileExists=$true; $owner=New-Object System.Windows.Forms.Form; $owner.TopMost=$true; try { if($dialog.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK){ ConvertTo-Json -Compress -InputObject @($dialog.FileNames) } else { '[]' } } finally { $dialog.Dispose(); $owner.Dispose() }`;
 return new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoProfile','-STA','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true});let output='';child.stdout.setEncoding('utf8');child.stdout.on('data',s=>output+=s);child.on('error',()=>reject(Error('无法打开文件选择窗口')));child.on('close',code=>{try{if(code!==0)throw Error();const result=JSON.parse(output.trim().replace(/^\uFEFF/,''));if(!Array.isArray(result))throw Error();resolve(result)}catch{reject(Error('文件选择未完成，请重试'))}})});
}
export function revealWindowsFile(file){
 if(process.platform!=='win32')throw Error('定位文件目前支持Windows');
 return new Promise((resolve,reject)=>{const child=spawn('explorer.exe',['/select,',file],{detached:true,stdio:'ignore',windowsHide:false});child.once('error',()=>reject(Error('无法打开文件资源管理器')));child.once('spawn',()=>{child.unref();resolve()})});
}
export class EvidenceFiles{
 constructor(root,{pick=chooseWindowsFiles,reveal=revealWindowsFile}={}){this.file=path.join(root,'.local','evidence-files.json');this.pick=pick;this.reveal=reveal;this.busy=false;}
 async read(){try{return JSON.parse(await readFile(this.file,'utf8'))}catch(e){if(e.code==='ENOENT')return {};throw Error('文件关联记录无法读取')}}
 async select(){if(this.busy)throw Error('文件选择窗口已经打开');this.busy=true;try{const selected=await this.pick();if(!selected.length)return [];const records=await this.read(),result=[];for(const file of selected){const absolute=path.resolve(file),info=await stat(absolute);if(!info.isFile())continue;let id=Object.keys(records).find(id=>records[id].path===absolute);id??=randomUUID();records[id]={path:absolute,name:path.basename(absolute)};result.push({id,name:path.basename(absolute)})}await mkdir(path.dirname(this.file),{recursive:true});const temp=this.file+'.tmp';await writeFile(temp,JSON.stringify(records),'utf8');await rename(temp,this.file);return result;}finally{this.busy=false}}
 async locate(id){const record=(await this.read())[id];if(!record)throw Error('本机没有此文件关联，请重新选择文件');try{if(!(await stat(record.path)).isFile())throw Error()}catch{throw Error('文件已移动或删除，请重新选择文件')}await this.reveal(record.path);}
}
export async function handleEvidence(req,url,{evidence,origin,json}){
 if(!url.pathname.startsWith('/api/evidence/'))return false;
 if(req.method!=='POST'||req.headers.origin!==origin||req.headers['x-jobpath-action']!=='evidence') {json(403,{message:'请从本机网页操作文件'});return true;}
 if(!evidence){json(503,{message:'本地文件服务尚未启用'});return true;}
 try{if(url.pathname==='/api/evidence/select')json(200,{files:await evidence.select()});else{const match=/^\/api\/evidence\/([a-f0-9-]{36})\/reveal$/.exec(url.pathname);if(!match)json(404,{message:'文件关联不存在'});else{await evidence.locate(match[1]);json(200,{ok:true})}}}catch(e){json(400,{message:e.message})}return true;
}

import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {randomBytes} from 'node:crypto';import path from 'node:path';
export class LocalAISettings{
 constructor(root,quota){this.file=path.join(root,'.local','ai-settings.json');this.quota=quota;this.value=null;try{const v=JSON.parse(readFileSync(this.file,'utf8'));if(typeof v.apiKey==='string'&&typeof v.token==='string')this.value=v}catch{}}
 status(){return {configured:!!this.value?.apiKey,enabled:!!this.value?.enabled,expires:null,provider:'DeepSeek',model:'deepseek-flash',storage:'本机服务端 .local/ai-settings.json'}}
 async configure(body,{fetchImpl=fetch}={}){if(!body||Object.keys(body).some(k=>!['apiKey','enabled','expires'].includes(k))||typeof body.enabled!=='boolean')throw Object.assign(Error('配置格式无效'),{status:400});const key=body.apiKey||this.value?.apiKey;if(typeof key!=='string'||!/^[A-Za-z0-9_-]{10,250}$/.test(key))throw Object.assign(Error('请填写有效 API Key'),{status:400});const expires=null;
 // Non-generative credential check. No completion tokens are requested.
 let response;try{response=await fetchImpl('https://api.deepseek.com/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)})}catch{throw Object.assign(Error('无法连接 DeepSeek，请检查网络'),{status:502})}if(!response.ok)throw Object.assign(Error('密钥验证失败，请检查 API Key 和账户权限'),{status:400});
 const token=randomBytes(24).toString('hex');this.quota.invite(token,expires);const value={apiKey:key,enabled:body.enabled,expires,token};mkdirSync(path.dirname(this.file),{recursive:true});try{writeFileSync(this.file,JSON.stringify(value),{mode:0o600})}catch{throw Object.assign(Error('配置未能保存，请检查目录权限'),{status:500})}this.value=value;return this.status();}
 disable(){if(this.value){writeFileSync(this.file,JSON.stringify({...this.value,enabled:false}),{mode:0o600});this.value.enabled=false}return this.status()}
}
export async function handleLocalAI(req,res,url,{settings,origin,json}){
 if(!settings)return false;if(!['/api/local-ai','/api/local-ai/disable'].includes(url.pathname))return false;
 if(req.method==='GET'&&url.pathname==='/api/local-ai'){if(settings.value?.token)res.setHeader('Set-Cookie',`jobpath_local=${settings.value.token}; HttpOnly; SameSite=Strict; Path=/api`);json(200,settings.status());return true;}
 if(req.method!=='POST'){json(405,{message:'不支持的操作'});return true}if(req.headers.origin!==origin){json(403,{message:'只允许从本机网页配置'});return true}if(!req.headers['content-type']?.startsWith('application/json')){json(400,{message:'请求格式错误'});return true}
 let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>4096){json(413,{message:'配置过长'});return true}chunks.push(chunk)}let body;try{body=JSON.parse(Buffer.concat(chunks).toString())}catch{json(400,{message:'配置无法解析'});return true}
 const status=url.pathname.endsWith('/disable')?settings.disable():await settings.configure(body);if(settings.value?.token)res.setHeader('Set-Cookie',`jobpath_local=${settings.value.token}; HttpOnly; SameSite=Strict; Path=/api`);json(200,status);return true;
}

import {writeFileSync} from 'node:fs';
import {configureNetwork} from '../backend/network.mjs';
import {expandedResources} from '../src/learning-resources.js';
process.loadEnvFile('.env');configureNetwork();
const results={};let cursor=0;
async function worker(){while(cursor<expandedResources.length){const r=expandedResources[cursor++];try{const res=await fetch(r.url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'JobPath-resource-link-check'}});const body=await res.text();results[r.id]={checkedAt:new Date().toISOString(),status:res.status,url:res.url,title:(body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]||'').slice(0,200),scope:'仅检查入口响应与页面标题；未安装运行、未验证全课程或硬件条件'};console.log(r.id,res.status)}catch(e){results[r.id]={checkedAt:new Date().toISOString(),status:0,scope:'连接未完成，待核验'};console.log(r.id,'unavailable')}}}
await Promise.all(Array.from({length:4},worker));
writeFileSync('src/learning-resource-checks.js','// Link checks only; no runtime or license certification.\nexport const learningResourceChecks='+JSON.stringify(results,null,2)+';\n');

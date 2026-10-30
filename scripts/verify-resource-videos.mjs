// Explicit network smoke test, separate from deterministic CI. No login, no mirroring.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {catalog} from '../src/catalog.js';
const browser=await chromium.launch({headless:true,...(process.env.AUDIT_PROXY?{proxy:{server:process.env.AUDIT_PROXY}}:{})});
const results=[];
try{for(const r of catalog.filter(r=>r.type==='video')){
 const page=await browser.newPage();const item={id:r.id,source:r.url,player:r.audit.videoUrl,checkedAt:new Date().toISOString(),browser:browser.version(),network:process.env.AUDIT_PROXY?'configured-proxy':'direct'};
 try{await page.goto(item.player,{waitUntil:'domcontentloaded',timeout:45000});const video=page.locator('video').first();await video.waitFor({timeout:15000});await video.evaluate(v=>{v.muted=true;return v.play()});await page.waitForFunction(()=>document.querySelector('video')?.currentTime>3,null,{timeout:30000});item.playback=await video.evaluate(v=>({time:v.currentTime,duration:v.duration,paused:v.paused,readyState:v.readyState,src:v.currentSrc,width:v.videoWidth,frames:v.getVideoPlaybackQuality().totalVideoFrames}));if(item.playback.frames<1||item.playback.width<1)throw Error('No decoded video');item.status='passed';}catch(e){item.status='failed';item.error=e.message;process.exitCode=1}finally{await page.close()}
 results.push(item);console.log(r.id,item.status);
}}finally{await browser.close();await mkdir('docs/audit/v05',{recursive:true});await writeFile('docs/audit/v05/video-playback.json',JSON.stringify(results,null,2)+'\n')}

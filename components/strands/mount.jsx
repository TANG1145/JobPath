import React from 'react';
import {createRoot} from 'react-dom/client';
import Strands from './Strands.jsx';
import {strandsStill} from '../../src/strands-still.js';
export {bindBubbleField} from '../../src/bubble-field.js';

// A single GPU renderer feeds every sphere, avoiding browser WebGL context limits.
export function mountField(hosts){
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let root=null,source=null,observer=null,disposed=false;
 const contexts=new Map(),visible=new Set();
 const still=host=>{host.replaceChildren();const img=new Image();img.src=strandsStill;img.alt='';img.className='strands-still';host.append(img);host.dataset.visualState='static'};
 const stop=()=>{observer?.disconnect();observer=null;root?.unmount();root=null;source?.remove();source=null;contexts.clear();visible.clear()};
 const start=()=>{
  stop();hosts.forEach(still);if(disposed||media.matches||!hosts.length)return;
  if(!document.querySelector('[data-strands-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/public/visuals/strands.css';link.dataset.strandsCss='true';document.head.append(link)}
  // Kept in the viewport for the renderer's visibility lifecycle, but never displayed.
  source=document.createElement('div');source.className='strands-shared-source';source.setAttribute('aria-hidden','true');document.body.append(source);
  hosts.forEach(host=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=256;canvas.className='strands-copy';canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');if(ctx){contexts.set(host,{canvas,ctx,ready:false});visible.add(host)}});
  observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target)}});hosts.forEach(h=>observer.observe(h));
  const frame=canvas=>{for(const [host,item] of contexts){if(!visible.has(host)&&item.ready)continue;item.ctx.clearRect(0,0,256,256);item.ctx.drawImage(canvas,0,0,256,256);if(!item.ready){host.replaceChildren(item.canvas);item.ready=true;host.dataset.visualState='shared'}}};
  root=createRoot(source);root.render(<Strands colors={['#b6793e','#FFB23E','#eee5bc','#74FF9A','#315640']} glass glassSize={1.12} count={3} energy={0.5} intensity={0.65} glow={0.18} dispersion={0.12} speed={0.5} interactive={false} clickPulse={false} intro={false} maxDevicePixelRatio={1} onFrame={frame}/>);
 };
 media.addEventListener('change',start);start();return ()=>{disposed=true;media.removeEventListener('change',start);stop();hosts.forEach(still)};
}

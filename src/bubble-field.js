import Matter from 'matter-js';
import {createBallWorld,nudgeBall} from './ball-physics.js';
export function bindBubbleField(field){
 if(!field)return ()=>{};
 const media=matchMedia('(prefers-reduced-motion: reduce)');let world,items=[],raf=0,last=0,accumulator=0,drag=null,previous=null,blockUntil=0,disposed=false,visible=true,width=0;
 const render=()=>items.forEach((el,i)=>{const b=world.balls[i],r=b.circleRadius;el.style.transform=`translate(${b.position.x-r}px,${b.position.y-r}px)`;el.style.setProperty('--roll',b.angle+'rad');el.dataset.ballX=b.position.x.toFixed(2);el.dataset.ballY=b.position.y.toFixed(2)});
 const tick=t=>{raf=0;if(disposed||!world||!visible||document.hidden)return;accumulator+=Math.min(50,last?t-last:16.67);last=t;while(accumulator>=1000/60){world.step();accumulator-=1000/60}render();if(drag||world.balls.some(b=>!b.isSleeping))raf=requestAnimationFrame(tick)};
 const wake=()=>{if(!raf&&world&&!media.matches&&!document.hidden&&visible){last=0;raf=requestAnimationFrame(tick)}};
 const clear=()=>{cancelAnimationFrame(raf);raf=0;drag=null;world?.clear();world=null;field.classList.remove('physics-active');field.querySelectorAll('[data-category]').forEach(el=>{el.style.removeProperty('transform');el.style.removeProperty('--roll')});field.style.removeProperty('height')};
 const rebuild=()=>{if(disposed)return;clear();width=field.clientWidth;if(width<1)return;items=[...field.querySelectorAll('[data-category]')].filter(el=>!el.hidden);if(media.matches||width<420||!items.length){field.dataset.physics='static';return}const radius=Math.min(108,Math.max(65,(width-24)/4.2));const cols=Math.max(1,Math.floor(width/(radius*2+8))),rows=Math.ceil(items.length/cols),height=Math.max(440,rows*(radius*2+8)+60);field.style.setProperty('--ball-size',radius*2+'px');field.style.height=height+'px';field.classList.add('physics-active');world=createBallWorld(width,height,radius,items.length);field.dataset.physics='running';render();wake()};
 const point=e=>{const rect=field.getBoundingClientRect();return {x:e.clientX-rect.left,y:e.clientY-rect.top}};
 const bodyFor=el=>{const index=items.indexOf(el?.closest('[data-category]'));return index<0?null:world?.balls[index]};
 const move=e=>{if(!world||media.matches)return;const p=point(e);if(drag){drag.constraint.pointA=p;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;wake()}else if(e.pointerType!=='touch'){if(previous){const v={x:p.x-previous.x,y:p.y-previous.y};if(Math.hypot(v.x,v.y)>.8)for(const b of world.balls)if(!b.isStatic)nudgeBall(b,p,v)}wake()}previous=p};
 const down=e=>{if(!world||e.button!==0||e.pointerType==='touch')return;const body=bodyFor(e.target);if(!body)return;Matter.Body.setStatic(body,false);Matter.Body.setVelocity(body,{x:0,y:0});const p=point(e),constraint=Matter.Constraint.create({pointA:p,bodyB:body,pointB:{x:p.x-body.position.x,y:p.y-body.position.y},length:0,stiffness:.2,damping:.15});Matter.Composite.add(world.engine.world,constraint);drag={constraint,x:e.clientX,y:e.clientY,moved:false};e.target.closest('button')?.setPointerCapture(e.pointerId);wake()};
 const up=()=>{if(!drag||!world)return;if(drag.moved)blockUntil=performance.now()+300;Matter.Composite.remove(world.engine.world,drag.constraint);drag=null;wake()};
 const click=e=>{if(e.detail>0&&performance.now()<blockUntil){e.preventDefault();e.stopImmediatePropagation()}};
 const focus=e=>{const b=bodyFor(e.target);if(b){Matter.Body.setStatic(b,true);render()}};
 const blur=e=>{const b=bodyFor(e.target);if(b){Matter.Body.setStatic(b,false);wake()}};
 const vis=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else wake()};
 const resize=new ResizeObserver(()=>{if(Math.abs(field.clientWidth-width)>1)rebuild()});resize.observe(field);
 const mutation=new MutationObserver(rebuild);field.querySelectorAll('[data-category]').forEach(el=>mutation.observe(el,{attributes:true,attributeFilter:['hidden']}));
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();else{cancelAnimationFrame(raf);raf=0}});observer.observe(field);
 const listeners=[['pointermove',move],['pointerdown',down],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['focusin',focus],['focusout',blur]];listeners.forEach(([name,fn])=>field.addEventListener(name,fn));field.addEventListener('click',click,true);media.addEventListener('change',rebuild);document.addEventListener('visibilitychange',vis);rebuild();
 return ()=>{disposed=true;clear();resize.disconnect();mutation.disconnect();observer.disconnect();listeners.forEach(([n,f])=>field.removeEventListener(n,f));field.removeEventListener('click',click,true);media.removeEventListener('change',rebuild);document.removeEventListener('visibilitychange',vis)};
}

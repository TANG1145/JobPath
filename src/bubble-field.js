// Pointer parallax and rolling, independent of the decorative WebGL renderer.
export function bindBubbleField(field){
 if(!field)return ()=>{};
 const media=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer: fine)');
 const items=[...field.querySelectorAll('[data-category]')];let raf=0,target={x:0,y:0},pos={x:0,y:0};
 const clear=()=>{cancelAnimationFrame(raf);raf=0;items.forEach(el=>{el.style.removeProperty('transform');el.style.removeProperty('--roll')})};
 const draw=()=>{raf=0;if(media.matches||!fine.matches||!field.isConnected||field.hidden)return;pos.x+=(target.x-pos.x)*.22;pos.y+=(target.y-pos.y)*.22;items.forEach((el,i)=>{const depth=.55+(i%3)*.23;el.style.transform=`translate(${(pos.x*18*depth).toFixed(2)}px,${(pos.y*14*depth).toFixed(2)}px)`;el.style.setProperty('--roll',`${(pos.x*13*depth).toFixed(2)}deg`)});if(Math.abs(target.x-pos.x)+Math.abs(target.y-pos.y)>.002)raf=requestAnimationFrame(draw)};
 const move=e=>{if(media.matches||!fine.matches||e.pointerType==='touch')return;const r=field.getBoundingClientRect();target={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};if(!raf)raf=requestAnimationFrame(draw)};
 const reset=()=>{target={x:0,y:0};if(!raf)raf=requestAnimationFrame(draw)};
 field.addEventListener('pointermove',move);field.addEventListener('pointerleave',reset);media.addEventListener('change',clear);
 return ()=>{clear();field.removeEventListener('pointermove',move);field.removeEventListener('pointerleave',reset);media.removeEventListener('change',clear)};
}

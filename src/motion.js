// Native adaptations of the supplied MicroSlats and Radar visual references.
// Decorative marks never represent days, live jobs, or measured scan progress.
let waveCleanup=()=>{};
let progressFrame=0,lastScope,lastProgress;
export function mountMotion(scope){
 cancelAnimationFrame(progressFrame);const ring=document.querySelector('.progress-ring');
 if(ring){const next=ring.style.getPropertyValue('--progress');if(lastScope===scope&&lastProgress!==undefined&&lastProgress!==next&&!matchMedia('(prefers-reduced-motion: reduce)').matches){ring.style.setProperty('--progress',lastProgress);getComputedStyle(ring).getPropertyValue('--progress');progressFrame=requestAnimationFrame(()=>ring.style.setProperty('--progress',next))}lastProgress=next;lastScope=scope;}
 waveCleanup();const canvas=document.querySelector('.checkin-wave');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,visible=false,last=0;
 function draw(time=0){
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(!w||!h)return;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  for(let y=0;y<h;y+=20)for(let x=0;x<w;x+=12){const a=(Math.sin(x*.025+y*.035-time*.0007)+Math.sin(x*.014-y*.05+time*.0004))/2,shift=a*1.7;ctx.fillStyle=`rgba(156,48,153,${.12+(a+1)*.19})`;ctx.beginPath();ctx.roundRect(x+1,y+2+shift,8,15,[4]);ctx.fill();}
  canvas.dataset.phase=String(Math.round(time/100));
 }
 function tick(time){if(time-last>32){draw(time);last=time}frame=requestAnimationFrame(tick)}
 function sync(){cancelAnimationFrame(frame);frame=0;if(visible&&!document.hidden&&!media.matches)frame=requestAnimationFrame(tick);else draw(0)}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()});observer.observe(canvas);
 const resize=new ResizeObserver(()=>draw(media.matches?0:performance.now()));resize.observe(canvas);media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);draw();
 waveCleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync)};
}
let celebrationTimer;
export function celebrateCheckin(){
 clearTimeout(celebrationTimer);document.querySelector('.checkin-celebration')?.remove();
 const card=document.createElement('aside');card.className='checkin-celebration';card.setAttribute('role','status');card.innerHTML=`<button aria-label="关闭打卡庆祝">×</button><div class="celebration-mark" aria-hidden="true">✓${Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><strong>今天的坚持，已记录</strong><p>又向目标前进了一步</p>`;document.body.append(card);const close=()=>{card.remove();clearTimeout(celebrationTimer)};card.querySelector('button').onclick=close;celebrationTimer=setTimeout(close,4200);
}
export function startRadar(){
 document.querySelector('.radar-popup')?.remove();document.querySelector('.scan-launcher')?.remove();
 const card=document.createElement('aside');card.className='radar-popup';card.setAttribute('role','dialog');card.setAttribute('aria-label','AI 岗位匹配');
 const ticks=Array.from({length:72},(_,i)=>`<line x1="150" y1="${i%6===0?9:14}" x2="150" y2="20" transform="rotate(${i*5} 150 150)"/>`).join('');
 card.innerHTML=`<button class="radar-close" aria-label="收起扫描窗口">−</button><div class="radar-art" aria-hidden="true"><svg viewBox="0 0 300 300"><g class="radar-grid">${[28,56,84,112,140].map(r=>`<circle cx="150" cy="150" r="${r}"/>`).join('')}<path d="M150 9v282M9 150h282M29 80l242 140M80 29l140 242M29 220 271 80M80 271 220 29"/>${ticks}</g></svg><div class="radar-sweep"></div>${[[62,27],[30,53],[70,68],[48,78],[78,43]].map(([x,y],i)=>`<i class="radar-blip" style="left:${x}%;top:${y}%;--delay:${i*.75}s"></i>`).join('')}<span class="radar-center"></span></div><h2>正在寻找适合你的机会</h2><p>结合目标、学习进度与岗位目录进行匹配</p><span class="scan-status" role="status">AI 正在分析…</span>`;
 const launcher=document.createElement('button');launcher.className='scan-launcher';launcher.textContent='◉ 查看岗位匹配进度';launcher.hidden=true;
 const toggle=open=>{card.hidden=!open;launcher.hidden=open};card.querySelector('button').onclick=()=>{toggle(false);launcher.focus()};const escape=e=>{if(e.key==='Escape'&&!card.hidden&&!document.querySelector('#modal[open]')){toggle(false);launcher.focus()}};document.addEventListener('keydown',escape);launcher.onclick=()=>toggle(true);document.body.append(card,launcher);
 return ()=>{document.removeEventListener('keydown',escape);const hadFocus=card.contains(document.activeElement)||document.activeElement===launcher;card.remove();launcher.remove();if(hadFocus)document.querySelector('#discover-jobs')?.focus()};
}

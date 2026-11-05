// Production motion follows real actions; no demo controls or persisted switches.
document.documentElement.dataset.motion='full';
export const motionEnabled=()=>true;
document.addEventListener('pointermove',e=>{
 const card=e.target.closest?.('.direction-card');if(!card||e.pointerType==='touch')return;
 const rect=card.getBoundingClientRect();card.style.setProperty('--glow-x',`${e.clientX-rect.left}px`);card.style.setProperty('--glow-y',`${e.clientY-rect.top}px`);
});
let calendarCleanup=()=>{},progressFrame=0,lastScope,lastProgress;
export function mountMotion(scope){
 cancelAnimationFrame(progressFrame);const ring=document.querySelector('.progress-ring');
 if(ring){const next=ring.style.getPropertyValue('--progress');if(lastScope===scope&&lastProgress!==undefined&&lastProgress!==next&&motionEnabled()){ring.style.setProperty('--progress',lastProgress);getComputedStyle(ring).getPropertyValue('--progress');progressFrame=requestAnimationFrame(()=>ring.style.setProperty('--progress',next))}lastProgress=next;lastScope=scope;}
 calendarCleanup();const calendar=document.querySelector('.checkin-calendar');if(!calendar)return;
 let visible=false;const sync=()=>calendar.classList.toggle('motion-paused',!visible||document.hidden);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()});observer.observe(calendar);document.addEventListener('visibilitychange',sync);
 calendarCleanup=()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);calendar.classList.add('motion-paused')};
}
let celebrationTimer;
export function celebrateCheckin(message='今天已打卡'){
 clearTimeout(celebrationTimer);document.querySelector('.checkin-celebration')?.remove();
 const card=document.createElement('aside');card.className='checkin-celebration';card.setAttribute('role','status');card.innerHTML=`<button aria-label="关闭打卡庆祝">×</button><div class="celebration-mark" aria-hidden="true">✓${Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><strong></strong>`;card.querySelector('strong').textContent=message;document.body.append(card);const close=()=>{card.remove();clearTimeout(celebrationTimer)};card.querySelector('button').onclick=close;celebrationTimer=setTimeout(close,4200);
}
let activeRadar;
export function startRadar(){
 activeRadar?.close();
 document.querySelector('.radar-popup')?.remove();document.querySelector('.scan-launcher')?.remove();
 const card=document.createElement('aside');card.className='radar-popup';card.setAttribute('role','dialog');card.setAttribute('aria-label','AI 岗位匹配');
 const ticks=Array.from({length:72},(_,i)=>`<line x1="150" y1="${i%6===0?9:14}" x2="150" y2="20" transform="rotate(${i*5} 150 150)"/>`).join('');
 card.innerHTML=`<button class="radar-close" aria-label="收起扫描窗口">−</button><div class="radar-art" aria-hidden="true"><svg viewBox="0 0 300 300"><g class="radar-grid">${[28,56,84,112,140].map(r=>`<circle cx="150" cy="150" r="${r}"/>`).join('')}<path d="M150 9v282M9 150h282M29 80l242 140M80 29l140 242M29 220 271 80M80 271 220 29"/>${ticks}</g></svg><div class="radar-sweep"></div>${[[62,27],[30,53],[70,68],[48,78],[78,43]].map(([x,y],i)=>`<i class="radar-blip" style="left:${x}%;top:${y}%;--delay:${i*.75}s"></i>`).join('')}<span class="radar-center"></span></div><h2>正在寻找适合你的机会</h2><p>结合目标、学习进度与岗位目录进行匹配</p><span class="scan-status" role="status">AI 正在分析…</span>`;
 const launcher=document.createElement('button');launcher.className='scan-launcher';launcher.textContent='◉ 查看岗位匹配进度';launcher.hidden=true;
 const toggle=open=>{card.hidden=!open;launcher.hidden=open};
 const close=()=>{document.removeEventListener('keydown',escape);const hadFocus=card.contains(document.activeElement)||document.activeElement===launcher;card.remove();launcher.remove();if(activeRadar?.close===close)activeRadar=null;if(hadFocus)document.querySelector('#discover-jobs')?.focus()};
 const minimize=()=>{toggle(false);launcher.focus()};
 const escape=e=>{if(e.key==='Escape'&&!card.hidden&&!document.querySelector('#modal[open]'))minimize()};
 card.querySelector('button').onclick=minimize;document.addEventListener('keydown',escape);launcher.onclick=()=>toggle(true);document.body.append(card,launcher);activeRadar={close};
 return close;
}

// Only compare committed changes, so failed saves never trigger a celebration.
export function celebrateSaved(before,after){
 const previousOffers=new Set(before.applications.filter(a=>a.stage==='Offer').map(a=>a.id));
 if(after.applications.some(a=>a.stage==='Offer'&&!previousOffers.has(a.id))){celebrateCheckin('收到新的 Offer');return;}
 const done=s=>(s.events||[]).filter(e=>e.type==='task_completed').length;
 if(done(after)>done(before))celebrateCheckin('又完成了一项任务');
}

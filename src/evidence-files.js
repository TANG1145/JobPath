export function mountEvidenceFiles({form,task,getTask,esc}){
 let files=structuredClone(task.evidenceFiles||[]),selecting=false;
 const area=document.createElement('section');area.className='evidence-files';form.querySelector('[name=evidence]').parentElement.after(area);
 async function request(url){const response=await fetch(url,{method:'POST',headers:{'X-JobPath-Action':'evidence'}});const data=await response.json();if(!response.ok)throw Error(data.message||'文件操作未完成');return data;}
 function draw(){area.innerHTML=`<div class="row"><h3>成果文件</h3><button type="button" id="select-evidence" ${selecting?'disabled':''}>${selecting?'请选择文件…':'＋ 选择本地文件'}</button></div><div class="evidence-list">${files.map((f,i)=>`<div class="evidence-file"><button type="button" data-reveal-evidence="${i}" title="在文件资源管理器中定位">${esc(f.name)}</button><button type="button" data-remove-evidence="${i}" aria-label="移除关联 ${esc(f.name)}">移除</button></div>`).join('')}</div><p class="evidence-status" role="status"></p>`;
 area.querySelector('#select-evidence').onclick=async()=>{selecting=true;draw();try{const result=await request('/api/evidence/select');if(!form.isConnected)return;for(const file of result.files)if(!files.some(f=>f.id===file.id))files.push(file);form.dispatchEvent(new Event('input',{bubbles:true}));selecting=false;draw()}catch(e){selecting=false;if(form.isConnected){draw();area.querySelector('.evidence-status').textContent=e.message}}};
 area.querySelectorAll('[data-reveal-evidence]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await request('/api/evidence/'+files[Number(b.dataset.revealEvidence)].id+'/reveal');area.querySelector('.evidence-status').textContent='已在资源管理器中定位'}catch(e){area.querySelector('.evidence-status').textContent=e.message}finally{b.disabled=false}});
 area.querySelectorAll('[data-remove-evidence]').forEach(b=>b.onclick=()=>{files.splice(Number(b.dataset.removeEvidence),1);draw();form.dispatchEvent(new Event('input',{bubbles:true}))});
 }
 form.readDraftExtra=()=>({evidenceFiles:files});form.restoreDraftExtra=value=>{if(Array.isArray(value?.evidenceFiles)){files=value.evidenceFiles.filter(f=>f&&/^[a-f0-9-]{36}$/.test(f.id)&&typeof f.name==='string');draw()}};
 form.beforeCommit=()=>{if(selecting)throw Error('请先完成文件选择');const current=getTask();if(!current)throw Error('任务已变化，请重新打开');current.evidenceFiles=structuredClone(files)};draw();
}

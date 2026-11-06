// One connection check before a request; never retries a paid generation.
export async function aiConnection(fetchImpl=fetch,storage=sessionStorage){
 const response=await fetchImpl('/api/local-ai',{credentials:'same-origin',signal:AbortSignal.timeout(5000)});
 if(response.ok){const status=await response.json();if(status.configured){storage.removeItem('jobpath-invite');return {local:true,enabled:status.enabled,expires:status.expires};}}
 return {local:false,token:storage.getItem('jobpath-invite')?.trim()||''};
}
export async function aiFetch(path,options={}, {fetchImpl=fetch,storage=sessionStorage}={}){
 const connection=await aiConnection(fetchImpl,storage);if(connection.local&&!connection.enabled&&path==='/api/ai')throw Error('本机 AI 已停用，请到设置中检查连接状态');
 const headers=new Headers(options.headers);headers.delete('Authorization');if(!connection.local&&connection.token)headers.set('Authorization','Bearer '+connection.token);
 return fetchImpl(path,{...options,headers,credentials:'same-origin'});
}

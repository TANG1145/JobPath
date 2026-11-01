import http from 'node:http';
// Optional server-side proxy. No proxy or credentials are exposed to the browser.
export function configureNetwork(env=process.env,configure=http.setGlobalProxyFromEnv){
 const proxy=env.APP_HTTP_PROXY?.trim();if(!proxy)return ()=>{};
 let url;try{url=new URL(proxy)}catch{throw Error('APP_HTTP_PROXY 必须是有效的 HTTP(S) 代理地址')}
 if(!['http:','https:'].includes(url.protocol))throw Error('APP_HTTP_PROXY 仅支持 HTTP(S) 代理');
 if(typeof configure!=='function')throw Error('代理模式需要 Node 24.14+ 或 25.4+');
 return configure({http_proxy:proxy,https_proxy:proxy,no_proxy:'localhost,127.0.0.1,::1'});
}

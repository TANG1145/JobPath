export function classifyRecruitment({text,title,apply=false,httpStatus=200,now=Date.now()}){
 if(httpStatus>=400)return {hiringStatus:'unknown',verification:`官网请求失败（${httpStatus}），不推断岗位关闭`};
 if(!text||!text.replace(/\s/g,'').includes(title.replace(/\s/g,'')))return {hiringStatus:'unknown',verification:'未能核对岗位正文，可能需要脚本、登录或人工复核'};
 if(/职位已下架|职位已关闭|岗位已关闭|该职位已结束|职位已过期|招聘已结束/.test(text))return {hiringStatus:'closed',verification:'官网明确显示职位已结束或下架'};
 const deadline=text.match(/(?:网申截止日期|申请截止日期)[:：]\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/);if(deadline&&Date.parse(deadline[1]+'T'+(deadline[2]||'23:59')+':00+08:00')<now)return {hiringStatus:'closed',verification:'官网标示的申请截止时间已过'};
 if(apply)return {hiringStatus:'open',verification:'本次官网详情可读且显示可用投递入口；最终受理以官网为准'};
 return {hiringStatus:'unknown',verification:'官方详情可读，但未确认有效投递入口'};
}
export function classifyCategory(title){for(const [id,re] of [['mobile',/移动端|Android|iOS|客户端/],['embedded',/嵌入式|底层软件/],['multimedia',/多媒体|音视频/],['robotics',/具身|机器人/],['cloud',/运维|可观测|SRE/],['database',/数据库|RDS/],['hardware',/硬件/],['chip',/芯片|器件设计/],['design',/交互设计|体验设计|UI设计/],['operations',/运营/],['test',/测试|质量/],['web',/前端/],['security',/安全|风控/],['data',/数据分析|数据挖掘/],['game',/游戏.*开发|引擎/],['product',/产品经理|产品策划/],['ai',/算法|模型|人工智能/],['java',/后端|Java|软件开发/]])if(re.test(title))return id;return null}
// Parse only the site's serialized public list. Never execute scripts from a recruitment page.
export function parseBaiduList(html){
 const match=html.match(/window\.__INITIAL_DATA__\s*=\s*([\s\S]*?);\s*window\.prefix=/);if(!match)return [];
 let input=match[1],json='',quoted=false,escape=false;
 for(let i=0;i<input.length;i++){const c=input[i];if(quoted){json+=c;if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"'){quoted=true;json+=c}else if(input.slice(i,i+9)==='undefined'){json+='null';i+=8}else json+=c}
 try{const data=JSON.parse(json),rows=data?.listData?.listDetailData;if(!Array.isArray(rows))return [];return rows.filter(r=>typeof r.name==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(r.postId)&&r.projectType==='日常实习项目').map(r=>({title:r.name,url:'https://talent.baidu.com/jobs/detail/INTERN/'+r.postId,city:String(r.workPlace||'请核对官网'),summary:String(r.workContent||'岗位职责请核对官网').slice(0,140),eligibility:String(r.serviceCondition||'技术要求请核对官网').slice(0,240),sourceUpdated:String(r.updateDate||'未记录')}))}catch{return []}
}

export function classifyRecruitment({text,title,apply=false,httpStatus=200,now=Date.now()}){
 if(httpStatus>=400)return {hiringStatus:'unknown',verification:`官网请求失败（${httpStatus}），不推断岗位关闭`};
 if(/职位已下架|职位已关闭|岗位已关闭|该职位已结束|职位已过期|招聘已结束|该职位已下线/.test(text||''))return {hiringStatus:'closed',verification:'官网明确显示职位已结束或下架'};
 if(!text||!text.replace(/\s/g,'').includes(title.replace(/\s/g,'')))return {hiringStatus:'unknown',verification:'未能核对岗位正文，可能需要脚本、登录或人工复核'};
 const deadline=text.match(/(?:网申截止日期|申请截止日期)[:：]\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/);if(deadline&&Date.parse(deadline[1]+'T'+(deadline[2]||'23:59')+':00+08:00')<now)return {hiringStatus:'closed',verification:'官网标示的申请截止时间已过'};
 if(apply)return {hiringStatus:'open',verification:'本次官网详情可读且显示可用投递入口；最终受理以官网为准'};
 return {hiringStatus:'unknown',verification:'官方详情可读，但未确认有效投递入口'};
}
export function classifyCategory(title){for(const [id,re] of [['mobile',/移动端|Android|iOS|客户端/],['embedded',/嵌入式|底层软件/],['multimedia',/多媒体|音视频/],['robotics',/具身|机器人/],['cloud',/运维|可观测|SRE/],['database',/数据库|RDS/],['hardware',/硬件/],['chip',/芯片|器件设计/],['design',/交互设计|体验设计|UI设计/],['operations',/运营/],['test',/测试|质量/],['web',/前端/],['security',/安全|风控/],['data',/数据分析|数据挖掘/],['game',/游戏.*开发|引擎/],['product',/产品经理|产品策划/],['ai',/算法|模型|人工智能/],['java',/后端|Java|软件开发/]])if(re.test(title))return id;return null}
// Parse only the site's serialized public list. Never execute scripts from a recruitment page.
export function parseBaiduData(html){
 const match=html.match(/window\.__INITIAL_DATA__\s*=\s*([\s\S]*?);\s*window\.prefix=/);if(!match)return null;
 let input=match[1],json='',quoted=false,escape=false;
 for(let i=0;i<input.length;i++){const c=input[i];if(quoted){json+=c;if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"'){quoted=true;json+=c}else if(input.slice(i,i+9)==='undefined'){json+='null';i+=8}else json+=c}
 try{return JSON.parse(json)}catch{return null}
}
export function parseBaiduList(html){const rows=parseBaiduData(html)?.listData?.listDetailData;if(!Array.isArray(rows))return [];return rows.filter(r=>typeof r.name==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(r.postId)&&r.projectType==='日常实习项目').map(r=>({title:r.name,url:'https://talent.baidu.com/jobs/detail/INTERN/'+r.postId,city:String(r.workPlace||'官网未披露'),summary:String(r.workContent||''),eligibility:String(r.serviceCondition||''),sourceUpdated:String(r.updateDate||'官网未披露')}))}

// Refresh fields only from the exact official detail page, never related-job cards.
export function extractRecruitmentDetail(row,{html='',text=''}={}){
 if(row.company==='百度'){
  const detail=parseBaiduData(html)?.detailData,p=detail?.postInfo;
  if(!p||!p.name||!p.workContent||!p.serviceCondition||new URL(row.source).pathname.split('/').at(-1)!==p.postId)return null;
  return {title:p.name,city:p.workPlace||'官网未披露',experience:[p.education,p.projectType,p.workYears].filter(Boolean).join('；'),summary:p.workContent,eligibility:p.serviceCondition,sourceUpdated:p.updateDate||p.publishDate||'官网未披露'};
 }
 const lines=text.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
 const section=(start,ends)=>{const i=lines.findIndex(s=>s===start);if(i<0)return '';let end=lines.length;for(let j=i+1;j<lines.length;j++)if(ends.includes(lines[j])){end=j;break}return lines.slice(i+1,end).filter(s=>s!==start).join('\n')};
 let summary='',eligibility='',city=row.city,experience='',sourceUpdated='官网未披露';
 if(row.company==='OPPO'){
  summary=section('岗位职责',['知识技能要求']);eligibility=section('知识技能要求',['文化匹配性','相关岗位推荐']);
  const apply=lines.indexOf('投递岗位');if(apply>=0)city=lines[apply+1];experience=lines.find(s=>/^应届生|^实习生/.test(s))||'';sourceUpdated=text.match(/(\d{4}-\d{2}-\d{2}) 发布/)?.[1]||sourceUpdated;
 }else if(row.company==='腾讯'){
  summary=section('岗位职责',['岗位要求']);eligibility=section('岗位要求',['申请岗位','相关推荐岗位']);
  const titleLine=lines.find(s=>s.startsWith(row.title));if(titleLine?.slice(row.title.length).trim())city=titleLine.slice(row.title.length).trim();
  experience=text.match(/([^\n]*工作经验)更新于/)?.[1]?.replace(/^技术|^产品|^设计/,'')||'';
  const date=text.match(/更新于(\d{4})年(\d{2})月(\d{2})日/);if(date)sourceUpdated=date.slice(1).join('-');
 }else if(row.company==='美团'){
  summary=section('岗位职责',['任职要求']);eligibility=section('任职要求',['工作城市']).replace(/^岗位要求\n/,'');city=text.match(/工作地点：([^\n]+)/)?.[1]||city;
 }else{
  summary=section('职位描述',['职位要求']);eligibility=section('职位要求',['投递','立即投递','申请职位','相关职位','联系我们​']);
  const i=lines.indexOf(row.title);if(i>=0&&row.company==='字节跳动')city=lines[i+1];
 }
 if(!summary||!eligibility||!text.replace(/\s/g,'').includes(row.title.replace(/\s/g,'')))return null;
 if(!experience)experience=eligibility.split('\n').find(s=>/学历|本科|硕士|博士|毕业/.test(s))?.replace(/^\d+[、.．]\s*/,'')||'官网未单列学历及经验';
 return {title:row.title,city,experience,summary,eligibility,sourceUpdated};
}

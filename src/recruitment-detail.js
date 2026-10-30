// Presentation-only grouping of existing source excerpts. No inferred requirements.
const clean=text=>String(text||'').replace(/^官网(?:要求|职责)片段[:：]/,'').trim();
const unique=items=>[...new Map(items.filter(Boolean).map(s=>[s.replace(/[\s。；;]+/g,''),s])).values()];
const placeholder=/请核对|请到|见下方|需.*(?:官网|原站)|以.*(?:为准|说明)|未获得|不推断|岗位标题未作为|未记录/;
const qualification=/学历|本科|硕士|博士|研究生|学位|专业|在读|在校|全日制|应届|毕业|\d{2,4}届|每周|个月|\d+天|[一二两三四五六七八九十\d]+年(?:以上|及以上|相关|的|游戏|引擎).*经验|背景/;
const sourceParts=text=>unique(clean(text).split(/[；;\n]+/).map(s=>s.replace(/^\s*(?:[-•]\s*|\d{1,2}[.、)]\s+)/,'').replace(/[。；;]+$/,'').trim()));
function completeExcerpt(text){
 const raw=clean(text);const lines=raw.split('\n').map(s=>s.replace(/^\s*[-•]\s*/,'').trim()).filter(Boolean);
 // Collectors store bounded excerpts. Keep an unfinished tail in source evidence only.
 if(/^官网(?:职责|要求)片段/.test(text||'')&&lines.length&&!/[。；.!?！？]$/.test(lines.at(-1)))lines.pop();
 return lines;
}
const objects={
 'huawei-hardware-36386':'硬件研发','huawei-chip-36387':'芯片与器件研发','huawei-software':'软件研发',
 'auto-177670260cda85c3':'百度移动生态风控中台','auto-2903ca2ba8c82a88':'贴吧主端发布与移动场景','auto-7250e86643c374e3':'运营数据监控与分析','auto-767f6dd9b2f7c00b':'大模型相关的 AI 智能营销金融方向产品','auto-d4dd505e6a96d10a':'通用 / 垂直场景 AI 智能体',
 'baidu-wenku':'文库主站和应用前端','baidu-front':'AI 数据平台界面','baidu-backend':'推理服务与平台工具','baidu-product':'百度搭子 Agent',
 'oppo-platform':'Agent 能力和研发效能平台','oppo-agent':'终端智能体','oppo-testing':'模型及推理服务','bili-llm':'大语言模型',
 'baidu-mobile-104728':'百度移动产品的广告研发','baidu-cloud-99647':'可观测数据底座和运维平台','baidu-db-97903':'数据库管控平台',
 'oppo-ux-1836':'ColorOS 体验或企业数字化系统','baidu-ops-106862':'内容与创作者生态',
 'baidu-data-73307':'用户行为和业务指标','baidu-data-98221':'用户增长与业务指标','baidu-data-75756':'内容生态指标',
 'baidu-data-100281':'大模型应用','baidu-data-106779':'企业 Agent 使用效果','baidu-data-81163':'AIGC 内容生产与效果评测',
 'baidu-voice-102273':'语音数据','baidu-web-70806':'百度小程序与 AI 原生应用的前端模块',
 'oppo-lowlevel-1838':'Linux、嵌入式与底层软件','oppo-media-1831':'音视频、相机、显示等多媒体方向',
 'auto-35d688d01350e11f':'VLA、WAM 等具身模型',
 'tx-inference':'大模型推理引擎和分布式推理调度','tx-cpu':'Agent 场景的 CPU 负载','tx-game-data':'游戏活跃与商业化效果','tx-mining':'游戏体验与增长',
 'tx-risk':'注册、登录、反作弊等流量场景','tx-data-security':'数据平台安全服务','tx-merchant':'商家客服与经营工具','tx-recommend':'电商推荐','tx-game-engine':'UE5 引擎与跨平台游戏'
};
export function recruitmentDetail(row){
 const legacy=!!row.jd; // Original catalog JD contains requirement quotes, not a responsibilities section.
 const qualifications=[],abilities=[],unclassified=[];
 const sources=[row.experience,completeExcerpt(row.eligibility).join('\n'),legacy?row.jd:'',legacy?row.summary:''];
 for(const input of sources)for(let text of sourceParts(input)){
  text=text.replace(/^还要求\s*/,'');
  if(!text||/^(日常实习|在校实习|实习|校招)$/.test(text))continue;
  if(placeholder.test(text)){unclassified.push(text);continue}
  (qualification.test(text.replace(/专业能力/g,''))||/(?:至少|必须).*实习经历/.test(text)?qualifications:abilities).push(text);
 }
 const q=unique(qualifications),skills=unique(abilities);
 const missing=[];if(!q.some(s=>/本科|硕士|博士|研究生|学历|学位/.test(s)))missing.push('学历');
 if(!q.some(s=>/毕业|\d{2,4}届|在校|在读|应届/.test(s)))missing.push('毕业时间 / 学生身份');
 if(!q.some(s=>/每周|个月|\d+天/.test(s)))missing.push('到岗频率 / 时长');
 const duties=legacy?[]:completeExcerpt(row.summary);
 return {object:objects[row.id]||'未披露',duties,qualifications:q,skills,missing,unclassified:unique(unclassified),partial:legacy||/^官网职责片段/.test(row.summary||'')||!duties.length||!objects[row.id]};
}

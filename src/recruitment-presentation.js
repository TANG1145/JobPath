export function beijingTime(value){
 if(value==null||value==='')return '未记录';
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value.replaceAll('-','/');
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '未记录';
 return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
}
export function checkSummary(rows,run){
 const dates=rows.map(r=>r.checkedAt).filter(v=>v&&Number.isFinite(Date.parse(v)));
 const latest=dates.sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
 const partial=rows.some(r=>(r.hiringStatus||'unknown')==='unknown');
 return {latest, label:latest?`最近检查 ${beijingTime(latest)} · ${partial?'部分待核验':'已有核验记录'}`:'暂无更新记录',runLabel:({complete:'任务已完成',partial:'部分来源待复核',failed:'检查失败，保留旧记录',running:'正在检查'})[run?.status]||'暂无后台任务记录'};
}
export const categoryTaglines={web:'页面交互、组件开发与前端工程化',java:'业务接口、数据存储与可靠服务',test:'测试设计、自动化与软件质量',ai:'机器学习、大模型与推理优化',data:'业务分析、统计实验与数据挖掘',security:'风险识别、访问控制与安全防护',product:'用户需求、产品方案与效果分析',game:'游戏客户端、引擎与图形渲染',mobile:'移动应用、系统能力与跨端体验',embedded:'驱动固件、操作系统与硬件协同',multimedia:'音视频处理、媒体框架与性能优化',robotics:'环境感知、动作建模与机器人控制',cloud:'云服务、自动化运维与系统可靠性',database:'查询存储、集群管控与数据库性能',hardware:'电路设计、硬件调试与可靠性验证',chip:'芯片架构、逻辑设计与功能验证',design:'用户研究、交互原型与体验设计',operations:'内容社区、用户增长与运营分析'};
export const categoryTechnologies={web:'HTML、CSS、JavaScript、React、Vue',java:'Java、Spring、SQL、HTTP',test:'Python、pytest、Playwright、接口测试',ai:'Python、C++、机器学习框架与 GPU',data:'SQL、Python、统计分析与 A/B 实验',security:'Linux、访问控制与风险策略',product:'用户访谈、原型设计与指标分析',game:'C++、Unity、UE5、图形学',mobile:'Kotlin、Swift、Android、iOS',embedded:'C/C++、Linux、MCU',multimedia:'音视频编解码、图像处理与渲染',robotics:'动作模型、仿真与控制系统',cloud:'Linux、Docker、Kubernetes、监控',database:'SQL、存储引擎、MySQL、PostgreSQL',hardware:'电路设计、PCB 与硬件测试',chip:'RTL、Verilog 与设计验证',design:'用户研究、交互原型与 Figma',operations:'内容策划、用户分析与效果复盘'};

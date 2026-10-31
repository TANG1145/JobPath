// Exploration taxonomy. Borrowed from the tjj branch's 18-direction list;
// this prototype keeps the words, but not its React/matter.js implementation.
export const categories = [
  { id: 'web', title: 'Web 前端开发', code: 'FRONTEND', accent: '#f2a33c', description: '把产品需求变成可操作的页面与交互。', keywords: ['前端', '网页', '界面', 'web', 'frontend', 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue'], focus: ['页面与交互实现', '组件与状态管理', '浏览器与工程化'] },
  { id: 'java', title: 'Java 后端开发', code: 'BACKEND', accent: '#8ed6a5', description: '构建业务服务、接口与可靠的数据处理。', keywords: ['后端', '服务端', 'java', 'backend', 'Spring', 'SQL', 'HTTP', '接口', '数据库'], focus: ['业务接口与服务', '数据存储与查询', '异常处理与服务验证'] },
  { id: 'test', title: '测试开发', code: 'QUALITY', accent: '#d9c48a', description: '用测试设计与自动化验证软件是否可靠。', keywords: ['测试', '质量', '自动化', 'test', 'qa', 'Python', 'pytest', 'Playwright'], focus: ['测试用例与边界', '接口与页面自动化', '缺陷定位与验证'] },
  { id: 'ai', title: 'AI 与算法工程', code: 'AI / ML', accent: '#e28b76', description: '研究和落地机器学习、大模型及推理基础设施。', keywords: ['人工智能', '算法', '大模型', 'ai', '机器学习', 'C++', 'Python', 'GPU'], focus: ['模型与算法', '推理及性能优化', 'AI 工程落地'] },
  { id: 'data', title: '数据分析与挖掘', code: 'DATA', accent: '#b9c7a1', description: '用统计、实验与建模理解业务和用户行为。', keywords: ['数据分析', '数据挖掘', 'data', 'SQL', 'Python', '统计', '实验'], focus: ['指标与分析框架', 'A/B 实验', '数据挖掘与建模'] },
  { id: 'security', title: '安全与风控', code: 'SECURITY', accent: '#f2b45c', description: '识别风险、设计安全策略并验证防护效果。', keywords: ['安全', '风控', 'security', '反作弊', '鉴权', 'Linux'], focus: ['风险识别与对抗', '访问控制', '安全策略与验证'] },
  { id: 'product', title: '产品策划', code: 'PRODUCT', accent: '#c9b79c', description: '理解用户问题，设计产品方案并推动落地。', keywords: ['产品', '策划', 'product', '需求', '用户', '电商'], focus: ['需求与用户研究', '产品方案与协作', '效果分析'] },
  { id: 'game', title: '游戏开发', code: 'GAME', accent: '#e0996a', description: '构建游戏客户端、引擎和交互体验。', keywords: ['游戏', '引擎', 'game', 'UE5', 'Unity', 'C++', '图形学'], focus: ['客户端与引擎', '图形与渲染', '跨平台性能'] },
  { id: 'mobile', title: '移动端开发', code: 'MOBILE', accent: '#9fcf9a', description: '构建手机与跨端应用。', keywords: ['Android', 'iOS', 'Kotlin', 'Swift', '鸿蒙'], focus: ['应用架构', '系统能力与交互', '性能与兼容性'] },
  { id: 'embedded', title: '嵌入式开发', code: 'EMBEDDED', accent: '#d6b36a', description: '开发连接硬件与系统的软件。', keywords: ['嵌入式', 'MCU', 'C++', 'Linux'], focus: ['驱动与固件', '操作系统', '硬件协同调试'] },
  { id: 'multimedia', title: '多媒体开发', code: 'MEDIA', accent: '#d98f8f', description: '处理音频、视频、图像与显示链路。', keywords: ['多媒体', '音视频', '编解码', '图像', '渲染'], focus: ['媒体框架', '图像和音视频处理', '性能优化'] },
  { id: 'robotics', title: '机器人与具身 AI', code: 'ROBOTICS', accent: '#a9c9b4', description: '让模型感知环境并驱动真实设备。', keywords: ['机器人', '具身', 'VLA', '仿真', '控制'], focus: ['感知与动作建模', '仿真及真机评测', '数据与控制'] },
  { id: 'cloud', title: '云平台与运维', code: 'CLOUD / SRE', accent: '#9fbfae', description: '构建可靠的云服务与自动化运维系统。', keywords: ['云平台', '运维', 'SRE', 'Docker', 'Kubernetes'], focus: ['可观测性', '自动化与容灾', '分布式可靠性'] },
  { id: 'database', title: '数据库研发', code: 'DATABASE', accent: '#d5c28a', description: '构建数据库引擎、管控与数据服务。', keywords: ['数据库', 'MySQL', 'PostgreSQL', 'SQL', '存储'], focus: ['查询与存储', '集群管控', '备份恢复与调优'] },
  { id: 'hardware', title: '硬件研发', code: 'HARDWARE', accent: '#d9a76a', description: '设计、调试和验证电子硬件。', keywords: ['硬件', '电路', 'PCB', '电子', '信号'], focus: ['电路与器件', '板级调试', '可靠性验证'] },
  { id: 'chip', title: '芯片设计', code: 'CHIP', accent: '#c7b18a', description: '设计与验证芯片及其关键模块。', keywords: ['芯片', 'IC', 'RTL', 'Verilog', '器件'], focus: ['逻辑与架构', '设计验证', '器件与实现'] },
  { id: 'design', title: '交互与体验设计', code: 'UX / UI', accent: '#e6b8a0', description: '把用户需求变成清晰的产品体验。', keywords: ['交互', '体验', '设计', 'UX', 'UI', 'Figma'], focus: ['用户研究', '交互原型', '视觉与可用性'] },
  { id: 'operations', title: '产品与内容运营', code: 'OPERATIONS', accent: '#b7c79a', description: '围绕用户、内容和产品效果开展运营。', keywords: ['运营', '内容', '社区', '增长', '用户'], focus: ['内容与社区', '运营策略', '数据复盘'] }
];

export const searchCategories = (query) => {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return categories;
  return categories.filter((category) => [category.title, category.code, category.description, ...category.keywords, ...category.focus].join(' ').toLowerCase().includes(needle));
};

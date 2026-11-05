# 启职 JobPath

明亮、简洁的本地求职工作台：发现岗位 → 建立学习计划 → 跟进投递与面试 → 比较 Offer。

2026-11-05：全站按 [DESIGN.md](DESIGN.md) 完成布局与样式整改。工作分支 `work/prep-career-ai`，修改仅在本地，未推送 GitHub。

## 启动

安装 Node.js 24，首次运行 `npm ci`，然后双击 **启动网站.cmd**。固定访问 http://127.0.0.1:5175 。关闭启动窗口不会结束后台服务；重启电脑后重新启动即可。不要直接打开 index.html。

```powershell
npm ci
node scripts/start-local.mjs --restart
```

## 页面与功能

| 入口 | 内容 |
|---|---|
| 机会 | 18个方向、招聘列表与详情、收藏岗位、私人JD、目标岗位 |
| 备战 | 当前目标与进度、打卡、学习任务、日程与计划、96条学习资源、浮动规划助手 |
| 求职 | 投递台账、AI投递建议、面试时间线、Offer对比、求职复盘 |
| 设置 | 个人目标、网页AI连接、备份与恢复 |

AI支持学习计划、对话、目录岗位投递顺序和面试准备。设置 → AI连接，可验证并保存自己的 DeepSeek Key。已移除网站自行设置的次数、预算、试用到期、每天三项任务和90分钟估时等门槛。供应商实际限流、网络错误和账户权限仍会如实反馈。

## 文档

- [网站使用说明](docs/USER_GUIDE.md)
- [AI配置](docs/AI_CONFIGURATION.md) · [课堂演示路线](docs/AI_DEMO_GUIDE.md) · [AI实现说明](docs/AI_BACKEND.md)
- [本轮整改与验收](docs/REDESIGN_ACCEPTANCE.md)
- [功能整理计划](docs/FUNCTIONAL_REORGANIZATION_PLAN.md) · [视觉整改计划](docs/VISUAL_REDESIGN_PLAN.md)
- 原始课程文档：[产品需求](docs/original/01_产品需求文档_PRD.docx)、[技术与交互设计](docs/original/02_技术与交互设计文档.docx)，原件保留。

## 验证

```powershell
npm test
npm run build
# 以下使用独立 Edge 测试上下文，先启动5175服务；AI使用合成响应
node scripts/check-workflow.mjs
node scripts/check-redesign.mjs
```

个人记录保存在浏览器本地，可导出恢复。统一使用127.0.0.1:5175，换域名或端口会进入另一个数据空间。没有个人登录、云同步、自动投递或企业Offer同步。岗位状态与资格应核对官网；目录资源为学习入口，运行环境见资源说明。

.env、.local、个人数据库、密钥和备份均不提交。原旧版界面验收资料保留用于追溯，本轮验收以REDESIGN_ACCEPTANCE为准。

# 启职 JobPath v0.8 基础版

围绕真实目标岗位的本机求职工作台：保存并确认 JD → 识别能力/证据/表达差距 → 共享准备任务 → 复用成果 → 记录材料版本、练习与投递。保留卡带未来主义配色，弱化装饰仪表。

**真实 AI 关闭，不部署上线。** 当前交付为重构方案 A—E 基础闭环，F—G 尚未完成。仓库：[TANG1145/JobPath](https://github.com/TANG1145/JobPath)。

## 本机运行

Node.js 24 推荐（最低 22.13），React / TypeScript / Vite 前端、Node / SQLite 网关。

```sh
npm ci
npm run dev
```

访问 http://127.0.0.1:5173 。`npm run dev` 先构建再启动服务；界面开发热更新可另开 `npm run dev:ui`（5174，代理本机 API）。生产构建位于 dist/，不含密钥或数据库。GitHub Actions 只测试，不部署。

## 验证

```sh
npm test
npm run test:core
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:legacy
```

旧版测试会从固定 Git 提交提取基线到忽略的 .local/，与新 UI 测试分开运行；两套浏览器测试使用同一测试端口，勿同时启动。

## 数据与升级

资料仅存当前浏览器 IndexedDB，22 张对象表通过唯一仓储写入。旧数据先预览、备份、确认迁移；原数据库不删除。设置支持导出 v2、导入 v1/v2、恢复副本；冲突拒绝静默覆盖，编辑可恢复草稿。旧未知题目、无归属 Offer 备注不补造。

**请先下载备份再清理浏览器。** 恢复区仍在浏览器内，不能防止浏览器整体数据被清除。旧版不能读取新版备份；详细回退步骤见 [阶段验收与恢复](docs/v08/BASELINE_AND_SCOPE.md)。

## 范围

今日最多三项重点、岗位工作区、手动可视化要求、五类差距、跨岗位共性任务、4/8 周折叠概览、独立成果复用、投递/轮次历史、材料及回答版本、手动练习自查、相关阶段 Offer 条件对照已实现。固定五题只作可选模板，不扩建静态题库。

新增 AI 场景尚未接入；现有模拟网关与限额测试继续保留。至少五位真实用户验证、真实 AI/计费、公网与发布验证尚未完成。[测试报告](docs/TEST_REPORT.md)区分新版自动化、旧版基线与未测项；[AI 契约草案](docs/v08/AI_CONTRACT_DRAFT.md)记录下一阶段边界。

岗位/资源沿用既有精选目录与核验记录，本轮不承诺外网实时有效，见 [资源核验](docs/RESOURCE_AUDIT.md)。.env、.local、数据库、邀请、用户备份不进入 Git。测试夹具及截图仅含合成数据。

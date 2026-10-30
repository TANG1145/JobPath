# 本地 AI 网关

真实调用按用户要求保持关闭。后端已实现 DeepSeek 适配；测试注入模拟供应商，不使用真实密钥或消耗模型额度。

## 配置与运行

Node 22.13+，建议 Node 24/25。`npm ci` 安装测试依赖，`npm run dev` 启动本机127.0.0.1:5173。复制 `.env.example` 为 `.env`，默认 `AI_ENABLED=false`。`npm run invite` 创建24字节随机邀请，原文仅存 `.local/invite.txt`（权限0600），SQLite只存哈希。文件不提交Git。设置页输入邀请，存于sessionStorage，不进入备份。

后续若明确启用真实调用，须本地填入密钥、核验当日模型与价格、设置窗口截止时间，并同时开启 AI_ENABLED 与 AI_PRICING_REVIEWED。不要将密钥放前端或聊天。窗口到期按每次请求检查关闭。

## 契约和保护

GET /api/health、GET /api/quota、POST /api/ai；固定 jd_extract/answer_feedback 两种模式。请求6KB文本上限，实际body16KB上限；每次预览同意，不接受任意提示词、URL抓取或工具。固定 deepseek-flash、关闭thinking、1500输出token、JSON输出；供应商最多等待20秒，不重试。

邀请每人每天2次/窗口20次，全站每天40次/窗口400次；每次预留60000 micro_cny，总预算24000000。SQLite单条条件INSERT原子预留，唯一邀请+幂等键，成功预留才访问模型。失败和超时仍占用；费用高于预留触发持久熔断。日志表不保存输入或输出正文。跨日采用Asia/Shanghai。

价格估算沿用设计文档的输入3元/百万token、输出10元/百万token。这是保守预算假设，不是当日人民币报价或账单保证。官方2026-10-30页面为美元与峰谷计价，真实启用前必须另核汇率、最大输入及usage边界。无需也不应因模拟联调自动开启真实服务。

官方核对来源：https://api-docs.deepseek.com/quick_start/pricing/ 与 https://api-docs.deepseek.com/api/create-chat-completion/ 。

## 限制

本地Node/SQLite实现，不是已部署的Cloudflare Worker/D1。D1远端并发、真实供应商计费、网络可达和合规验收仍是上线前门槛。本地全站额度按当前数据库终身累计，重新试用窗口须另行审查，不能删除费用表恢复额度。

## 后续范围调整（2026-10-30用户确认）

分方向练习、简历描述与自查改由AI模块承担，后续不扩展硬编码分方向题库。本轮仅完成投递轮次/历史及编辑保存保护；动态练习尚未实现，真实AI保持关闭。已有静态记录入口暂保留，不能将它们表述为已完成动态AI练习。未来仍须发送预览、逐次同意、限额与失败降级，AI不得编造经历或自动确认求职阶段。

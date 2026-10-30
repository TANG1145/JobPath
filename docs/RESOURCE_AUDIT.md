# 资源运行核验复现说明

2026-10-30。源码仅克隆到忽略目录 `.local/resource-audit/`，没有将它们当作个人成果或打包进产品。固定提交、许可证文件和核验范围见 [src/resource-audit.js](../src/resource-audit.js)；资源链接与任务映射见 [公开目录](../public/catalog/v1/resources.json)。重新核验须先checkout对应SHA，不假定未来main分支一致。

- Spring Petclinic：在仓库根运行 `./mvnw -Dtest=PetTypeFormatterTests test`，3项通过。
- Spring REST：在 `gs-rest-service/complete` 运行 `./mvnw test`，2项通过。
- TodoMVC：在 `examples/javascript-es6` 运行 `npm ci --ignore-scripts`、`npm run build`，静态服务打开dist；新增任务需真实输入并失焦触发change，勾选完成及Completed过滤通过。Store为内存实现，刷新清空是上游设计边界。
- Vite：将 `packages/create-vite/template-react` 复制到独立目录后 `npm install --ignore-scripts`、`npm run build`，静态服务打开dist；计数按钮0→1。
- pytest：`python3 -m pytest .local/resource-audit/pytest/doc/en/example/fixtures/test_fixtures_order_dependencies.py -q`，1项通过。
- Playwright examples：`npm install --ignore-scripts`、`npx playwright test --list`，45项仅发现，未运行。当前会话浏览器工具不提供上游示例所需的route mock/clock控制，不能把普通页面检查当成上游测试通过。

本机直连存在DNS失败，Maven使用隔离的 `.local/resource-audit/settings.xml` 配置已有本机代理；没有修改全局Maven设置。原始Maven下载日志保留在该忽略目录的 `*.raw` 文件；提交的[audit](audit)日志仅省略下载进度，保留编译和测试结果。

浏览器播放检查：六条原频道页面均受登录/反机器人验证阻断。源文章、具体视频和文档替代保留在资源目录；没有下载、镜像视频或绕过平台限制。课时时长字段是建议练习片段时间，不是全课程时长。Spring/React旧视频须对照当前文档，Playwright课程中的第三方AI服务段不在任务范围。

安装审计：TodoMVC报告40项问题（4 low/14 moderate/20 high/2 critical），Playwright示例报告2 high。保留为候选并优先文档替代；未强制升级上游项目或冒充其最新版已修复。JobPath生产代码未引用这些依赖。

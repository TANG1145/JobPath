# 自由目标规划（tjj，2026-10-31）

## 使用路径

1. 在「机会 → 我的理想 JD」打开岗位，选择「设为目标岗位」。全部 18 个方向及招聘摘要均可；归档/移除的岗位须先恢复。
2. 进入「备战 → 任务资源库」。默认筛选目标方向，也可跨方向浏览，按类型或关键字筛选。
3. 在资源详情点「加入目标计划」，填写任务名称、学习主题、1—90 分钟的本次学习估时和个人验收目标；也可新增完全自定义任务。取消不会写入计划，同一资源在同一目标下不会重复加入；可修改已有任务的学习范围。
4. 在「我的学习计划」调整顺序、编辑与记录进度，或移出未完成任务。标记完成须本人确认并记录至少 10 字成果证据。已完成项保留证据。
5. 可选「安排 4/8 周时间」：只调度已选任务，按每周预算的 80%、可用日和截止日期排期。预览后确认，容量不足的任务保留在计划中。它不是预设学习路线，也不自动补充任务。
6. 切换岗位后，各岗位的任务、进度及排期分别保留；备份包含全部目标。旧版未关联岗位的任务在「时间安排与历史」中只读查看，不默认为新目标任务。

准备差距仅显示用户计划的已完成/未完成任务及剩余估时，不依据预设技能打分，不等同于岗位资格。不提供 AI 规划，不恢复 AI 整理 JD。

## 资源覆盖和核验

保留原 24 条资源，新增每方向 2 份资料和 2 个维护方项目，共 96 条。文档 48、项目 42、视频 6。

| 方向 | 新增资料及项目主题 |
| --- | --- |
| Web 前端 | Vue、W3C WAI / GOV.UK Frontend |
| Java 后端 | Spring Boot、OpenJDK |
| 测试开发 | Vitest、Grafana k6 |
| AI 与算法 | PyTorch、Hugging Face Transformers |
| 数据分析 | pandas、Apache Superset |
| 安全与风控 | OWASP Juice Shop、WebGoat |
| 产品策划 | GOV.UK 用户研究与原型、Taiga |
| 游戏开发 | Godot、Bevy |
| 移动端 | Android Compose / Now in Android、Flutter |
| 嵌入式 | Zephyr、ESP-IDF |
| 多媒体 | FFmpeg、OpenCV |
| 机器人与具身 AI | ROS 2、LeRobot |
| 云平台与运维 | Kubernetes、Prometheus |
| 数据库研发 | PostgreSQL、DuckDB |
| 硬件研发 | KiCad、Raspberry Pi Pico |
| 芯片设计 | Verilator、cocotb |
| 交互与体验 | GOV.UK Design System、Penpot |
| 产品与内容运营 | WordPress、Matomo |

链接与核验时间见 `src/learning-resources.js` 和 `src/learning-resource-checks.js`。本轮新增 72 个入口全部返回 200，检查范围是响应和页面标题；没有下载运行 36 个项目，也没有验证完整课程。访问受限的 FFmpeg、OpenCV、Raspberry Pi 文档采用维护方 GitHub 文档入口。原有实践/视频审计保留，不挪用于新增资源。

`node scripts/check-learning-resources.mjs` 可重新检查新增入口，不调用 AI；`npm run catalog` 更新公开目录。不会自动选择资料、克隆仓库或启动外部项目。

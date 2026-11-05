> 历史实施记录。2026-11-05全站整改已替代文中的旧布局、次数/预算、固定周期与球体导航；当前行为见[本轮验收](REDESIGN_ACCEPTANCE.md)和[使用说明](USER_GUIDE.md)。

# B 方向集成：18 方向探索 / tb-b-integrate

日期：2026-10-31 / 11-01　分支：`tb-b-integrate`（从 `tjj` 切出）　状态：可运行 B 集成原型（方向 → 岗位列表 → 岗位详情 → 收藏/设为目标已打通）

## 1. 这轮做了什么

把上一轮 `tb-explore` 的探索页搬到 tjj 基座，并接上真实数据与 Strands：

- 新增 `/explore.html`：18 方向水晶球探索页；
- 使用 tjj 的 `src/opportunity-categories.js` 作为方向 taxonomy；
- 用 `jobsForCategory()` 读取真实 36 条招聘记录，按方向显示数量和 2 条样例；
- **方向 → 岗位列表 → 岗位详情链**：点击「查看 N 条岗位」进入该方向记录列表；点击任意记录进入详情，展示资格/经验/摘要/核验说明，并只放行 HTTPS 官方来源链接；可逐步返回列表和方向；
- **收藏 / 设为目标**：详情页「收藏」写入主应用同一条 `jobpath-v1` IndexedDB（复用 `storage.js` 的 revision 写入 + `domain.js` 校验 + `saved-records.js` 的 `fromRecruitment`），在机会页「我的理想 JD」立即可见；「设为目标」同步写入 `targetId/target/direction`，并把旧目标的活动计划存入 `targetSchedules`，回备战页立即生效；再点「收藏」可取消，若取消的是当前目标会同步解除。
- 用 `expandedResources` 显示每个方向新增的资源数量（全站 96 条）；
- 球体内部使用 tjj 真实的 **React Bits Strands** WebGL 纹理（`public/visuals/strands.js`），由 `build.mjs` 用 esbuild 生成；
- 保留我们自己的轻量 DOM 物理（拖动、碰撞、hover 暂停），没有引入 tjj 的 matter-js bubble-field；
- 机会页工具栏加入「◎ 探索 18 个方向」入口；
- 修复 tjj 原有 CI 红：Strands 增加 WebGL1 回退（GLSL ES 1.00 版 shader），Firefox headless / 老硬件没有 WebGL2 时渲染同款光带而不是静态替代；`dFdx/dFdy` 依赖 `GL_OES_standard_derivatives`，必须在上下文先 `getExtension` 启用，否则 `#extension` 指令会被编译期判为“not supported”；
- 静态服务器与构建脚本加入 `explore.html` / `explore.css` / `public/visuals/strands.css`。

## 2. 交互

- 拖动球体：移动 + 释放惯性；球体之间简单碰撞。
- 悬停：球体停止漂移并增强光带，方便点击。
- 点击方向：左侧显示方向职责、能力关键词、真实招聘数量、2 条样例和新增资源数。
- 查看岗位：按「可投（核验时）→ 待核验」排序显示记录列表；点击记录进入详情；「← 岗位列表」「← 方向」逐级返回。
- 岗位详情：公司/城市/类型、状态徽标、来源更新时间、核验时间、资格与要求、经验与备注、岗位摘要、核验说明、官方来源链接（仅 HTTPS）。
- 收藏/设为目标：详情页按钮即时反馈「已收藏 / 当前目标」，状态行带跳回主应用链接；本地存储不可用（如隐私模式）时按钮降级为仅查看并提示原因。
- 搜索：按标题、代码、描述、关键词过滤；`/` 聚焦，Esc 清空。
- 列表视图：球体 / 列表切换，保留键盘和读屏路径。
- 移动端 ≤760px：三列 CSS 网格，不加载 Strands；进入列表/详情自动滚动到可见位置；无横向溢出。
- `prefers-reduced-motion`：不启动 Strands 动态渲染，CSS 球体 + 静态布局。

## 3. 数据边界

- 招聘记录来自 tjj 的 `recruitmentCatalog`，共 36 条、9 家公司；其中 20 条标记待核验。页面写的是“招聘记录”，不是“实时在招岗位”。
- 方向样例与详情只展示公司/职位/城市/类型、资格与要求、摘要、核验说明；不推断薪资、截止日或录用概率。
- 官方来源链接只接受 HTTPS；其余字段一律转义为纯文本。
- 96 条资源中新增 72 条只检查了入口响应与标题，没有逐个运行项目或完整课程。
- 方向页本身不写存储；岗位详情「收藏 / 设为目标」写入与主应用共用的 `jobpath-v1` IndexedDB，写入前过同一套 `validateBackup` 校验，写冲突时回滚并提示，不会悄悄覆盖。

## 4. 与上一版原型的关系

| | `tb-explore` 原型 | `tb-b-integrate`（本分支） |
| --- | --- | --- |
| 基座 | tb-dev | tjj |
| 球体 | CSS 等离子 | 真实 Strands WebGL 纹理 + CSS 玻璃罩 |
| 数据 | 3 方向目录，15 方向无岗位 | 18 方向、36 条招聘记录、96 条资源 |
| 入口 | 机会页按钮 | 机会页工具栏「探索 18 个方向」 |
| 依赖 | 无新增生产依赖 | 继承 tjj 的 React/matter/esbuild/Playwright |

`tb-explore` 仍是更轻的视觉参考；本分支是 B 方向的真实集成。

## 5. 验证

- 94 / 94 单元测试通过。
- 完整套件 150 / 150 通过（50 条 × Chromium / Firefox / WebKit）：
  - 保留 tjj 原有 47 条；
  - 新增 3 条 B 集成测试：工具栏入口/18 球/真实计数/搜索/列表/返回、390px 三列与无溢出、详情页「收藏 + 设为目标」后主应用备战页与「我的理想 JD」立即可见。
- B 集成 3 条单独回归：Chromium / Firefox / WebKit 全部通过。
- Strands WebGL1 回退单独验证：三引擎强制禁用 WebGL2 后 `data-visual-state=shared` × 18、单一 WebGL 源、采样像素 `[11,11,11,235]`（暗色且不透明）与 WebGL2 路径一致。
- CI 的 headless Firefox 没有任何 WebGL 上下文（`AllowWebgl2:false` + GL 驱动耗尽）：共享渲染用例先探测 WebGL 能力，无 WebGL 时显式跳过（静态降级路径由其余用例覆盖），本地 Firefox 有 WebGL 时仍真实执行并通过。
- `npm run build` 通过，生成 `public/visuals/strands.js`。
- 日志：[e2e.txt](audit/v10/e2e.txt)、[unit.txt](audit/v10/unit.txt)。
- 截图：[桌面](audit/v10/explore-desktop.png)、[选择产品策划](audit/v10/explore-product.png)、[岗位列表](audit/v10/jobs-list.png)、[岗位详情](audit/v10/job-detail.png)、[收藏后](audit/v10/job-detail-save.png)、[设为目标后](audit/v10/job-detail-target.png)、[备战页当前目标](audit/v10/prep-target.png)、[手机](audit/v10/explore-mobile.png)、[入口](audit/v10/entry.png)。

## 6. 已知限制

1. **探索页仍是独立页面**：没有变成 tjj 的首页或路由；老分类球页面还在，等于两个探索入口并存。
2. **没有替换 tjj 的旧分类页**：本轮只新增入口，避免破坏 tjj 的 47 条回归测试。
3. **Strands 只作为球体纹理**：球体物理仍是我们自己的 DOM 版本，不是 tjj 的 matter-js bubble-field。
4. **移动端不加载 Strands**：为了首屏和触屏性能，≤760px 使用 CSS 球体。
5. **真实数据仍带边界**：36 条中 20 条待核验；96 条资源只有入口检查，不是运行认证。
6. **探索页与主应用同开两个标签页时**：两边共用 revision 写入，后写的一侧会收到“另一标签页已更新”并回滚（tjj 原有并发保护），刷新后重新读取即可；不会双写覆盖。
7. **tjj 依赖与采集调度器未清理**：React/matter/esbuild/Playwright 生产依赖、每日采集调度器仍在；本轮没有改它的范围。
8. **未合并 main，未部署**。

## 7. 下一步

- 决定探索是 tjj 首页还是机会页内的二级模式；
- 若保留，删除/重定向旧分类球页面，避免两个入口；
- 再评估是否把 matter-js 物理与 Strands 都保留，还是只留其一；
- 清理 tjj 的采集调度器/依赖边界，或把它拆成独立服务；
- 补真机触屏与 WebGL 降级走查。

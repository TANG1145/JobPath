# B 方向集成：18 方向探索 / tb-b-integrate

日期：2026-10-31　分支：`tb-b-integrate`（从 `tjj` 切出）　状态：可运行 B 集成原型

## 1. 这轮做了什么

把上一轮 `tb-explore` 的探索页搬到 tjj 基座，并接上真实数据与 Strands：

- 新增 `/explore.html`：18 方向水晶球探索页；
- 使用 tjj 的 `src/opportunity-categories.js` 作为方向 taxonomy；
- 用 `jobsForCategory()` 读取真实 36 条招聘记录，按方向显示数量和 2 条样例；
- 用 `expandedResources` 显示每个方向新增的资源数量（全站 96 条）；
- 球体内部使用 tjj 真实的 **React Bits Strands** WebGL 纹理（`public/visuals/strands.js`），由 `build.mjs` 用 esbuild 生成；
- 保留我们自己的轻量 DOM 物理（拖动、碰撞、hover 暂停），没有引入 tjj 的 matter-js bubble-field；
- 机会页工具栏加入「◎ 探索 18 个方向」入口；
- 静态服务器与构建脚本加入 `explore.html` / `explore.css` / `public/visuals/strands.css`。

## 2. 交互

- 拖动球体：移动 + 释放惯性；球体之间简单碰撞。
- 悬停：球体停止漂移并增强光带，方便点击。
- 点击：左侧显示方向职责、能力关键词、真实招聘数量、2 条样例和新增资源数。
- 搜索：按标题、代码、描述、关键词过滤；`/` 聚焦，Esc 清空。
- 列表视图：球体 / 列表切换，保留键盘和读屏路径。
- 移动端 ≤760px：三列 CSS 网格，不加载 Strands；无横向溢出。
- `prefers-reduced-motion`：不启动 Strands 动态渲染，CSS 球体 + 静态布局。

## 3. 数据边界

- 招聘记录来自 tjj 的 `recruitmentCatalog`，共 36 条、9 家公司；其中 20 条标记待核验。页面写的是“招聘记录”，不是“实时在招岗位”。
- 方向样例只展示公司/职位/城市/类型；不推断薪资、截止日或录用概率。
- 96 条资源中新增 72 条只检查了入口响应与标题，没有逐个运行项目或完整课程。
- 方向页不写入 IndexedDB，不改变画像、目标、计划或备份。

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
- 147 / 147 Playwright 通过：49 条 × Chromium / Firefox / WebKit。
  - 保留 tjj 原有 47 条；
  - 新增 2 条 B 集成测试：工具栏入口/18 球/真实计数/搜索/列表/返回、390px 三列与无溢出。
- `npm run build` 通过，生成 `public/visuals/strands.js`。
- 日志：[e2e.txt](audit/v10/e2e.txt)、[unit.txt](audit/v10/unit.txt)。
- 截图：[桌面](audit/v10/explore-desktop.png)、[选择产品策划](audit/v10/explore-product.png)、[手机](audit/v10/explore-mobile.png)、[入口](audit/v10/entry.png)。

## 6. 已知限制

1. **探索页仍是独立页面**：没有变成 tjj 的首页或路由；老分类球页面还在，等于两个探索入口并存。
2. **没有替换 tjj 的旧分类页**：本轮只新增入口，避免破坏 tjj 的 47 条回归测试。
3. **Strands 只作为球体纹理**：球体物理仍是我们自己的 DOM 版本，不是 tjj 的 matter-js bubble-field。
4. **移动端不加载 Strands**：为了首屏和触屏性能，≤760px 使用 CSS 球体。
5. **真实数据仍带边界**：36 条中 20 条待核验；96 条资源只有入口检查，不是运行认证。
6. **tjj 依赖与采集调度器未清理**：React/matter/esbuild/Playwright 生产依赖、每日采集调度器仍在；本轮没有改它的范围。
7. **未合并 main，未部署**。

## 7. 下一步

- 决定探索是 tjj 首页还是机会页内的二级模式；
- 若保留，删除/重定向旧分类球页面，避免两个入口；
- 把 18 方向、36 条招聘记录和 96 条资源接成可筛选的完整目录；
- 再评估是否把 matter-js 物理与 Strands 都保留，还是只留其一；
- 清理 tjj 的采集调度器/依赖边界，或把它拆成独立服务；
- 补真机触屏与 WebGL 降级走查。

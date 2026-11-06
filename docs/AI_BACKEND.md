# AI工作流与本地连接

更新：2026-11-05。

## 入口

POST /api/ai支持job_match、personal_plan、career_chat、application_plan、interview_plan；answer_feedback仅为历史API兼容。五题自测和AI提取JD界面保持移除。

src/ai-client.js先等待GET /api/local-ai建立本机HttpOnly会话，已配置时不发送缓存邀请。backend/http.mjs优先有效本机会话，兼容旧共享凭证。日常网页没有邀请输入或到期步骤。设置页验证官方/models端点并本地保存已有Key。

## 场景与上下文

backend/assistant.mjs收集画像、学习任务、当前方向目录岗位和面试历史，四个工具由固定流程执行，再组合独立场景prompt进行一次模型调用。任务与申请不再只截取前10条；对话存档和传入历史不使用固定20/4条截断。

投递推荐只允许目录候选ID，不允许杜撰岗位；unknown状态要求核实官网，不编造资格、招聘截止与履历。个人计划检查有效日期和正整数估时，采用时不以每日三项、90分钟、80%容量或周期外日期阻止用户。时间偏好交给提示与用户调整。

## 调用记录

backend/quota.mjs沿用旧SQLite结构以兼容本机数据，现为调用记录和重复提交保护。删除个人/全站日与累计次数、预算、预留费用、熔断和旧到期阻断，不读取limits控制调用，不用大阈值代替移除。明确停用仍有效，唯一请求标识防止相同请求重复生成。

网络超时、供应商限流、无效JSON、错误来源和无法解析的响应会明确报错，原输入保留，不自动付费重试。HTTP请求体与JSON类型校验属于协议边界，坏数据不伪装成成功。

## 结构

- frontend：ai-client、ai-settings、ai-plan、prep-tools、career-tools。
- backend：local-ai-settings、http、ai、assistant、quota。
- 记录：个人计划/对话按目标归属，申请与轮次复用同一数据源，生成后由用户采用。
- workflow元数据只包含场景、工具名和耗时，不记录密钥/认证头。

.env和.local保持Git忽略，静态服务不暴露配置、数据库或后端源文件。测试使用内存账本、临时合成配置和模拟模型，不读取真实Key。

## 岗位匹配与并发保存

job_match输入与其他规划模式相同，payload包含answer与context，输出为{title,summary,matches:[{jobId,reason,fit,preparation}]}。fit为优先考虑/可以尝试/需要补齐；空结果合法。服务端只接受当前候选的真实ID、非重复项和完整文字字段。候选工具排除明确截止及excludedJobIds，保留原始来源和核验信息。

server.mjs在提供者调用前，将招聘SQLite快照合并到服务端目录，保持与前端招聘状态的共同来源。个人自评、项目证据标记、方向兴趣和已申请来源随上下文提供，标记不等于已验证能力。

客户端AI网络请求可并行，onDraft采用过程通过共享队列依次执行，避免并发结果回滚覆盖。个人计划、投递与面试建议、岗位匹配都在存储失败时抛出错误；不再把仅模型返回成功误报为保存成功。

机会页的雷达不驱动业务、不伪造进度；请求finally中销毁，收起不会重发请求。opportunityMatch是schemaVersion1备份的可选字段，旧备份仍兼容。

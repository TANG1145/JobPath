import { badge, card, emptyState, esc, kv } from './components.js';
import { catalog, types } from '../catalog.js';
import { publicJobs, historicalJobs, jobState, catalogStats } from '../jobs.js';
import { match, recommend, weekly } from '../workflow.js';
import { skills } from '../domain.js';
import { offerFields } from '../planning.js';
import { stages } from '../applications.js';

export const names = { java: 'Java 后端', web: 'Web 前端', test: '测试开发' };

export const questions = [
  '用一分钟介绍你自己，以及最能证明能力的项目。',
  '解释一个你实际使用过的核心技术概念。',
  '描述一次排查故障的过程，你怎样缩小问题范围？',
  '你的项目如何处理异常输入和边界情况？',
  '如果重做一次项目，你会改进什么？'
];

const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
const clip = (value, length = 140) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
};

function feedbackText(entry) {
  const data = entry?.data || {};
  const labels = { strengths: '已覆盖', gaps: '待加强', evidenceQuotes: '原文依据', nextActions: '下一步' };
  const body = Object.entries(labels)
    .map(([key, label]) => Array.isArray(data[key]) && data[key].length
      ? `<p><strong>${label}</strong> ${esc(data[key].join('；'))}</p>`
      : '')
    .join('');
  return body || '<p class="muted small">没有可展示的反馈。</p>';
}

const radarPoint = (angle, radius, cx = 110, cy = 110) => {
  const radians = (angle * Math.PI) / 180;
  return [cx + Math.cos(radians) * radius, cy + Math.sin(radians) * radius];
};

function directionRadar(state) {
  const angles = [-90, 30, 150];
  const rows = Object.entries(names).map(([id, label], index) => {
    const result = recommend(id, state.ratings || {}, state.interests?.[id], state.projectEvidence);
    return { id, label, ...result, angle: angles[index] };
  });
  const hasSignal = rows.some((row) => row.score !== null);
  const summary = rows.map((row) => `${row.label} ${row.score === null ? '信息不足' : `${row.score}分`}`).join('；');
  return `<div class="radar-wrap">
    <svg class="radar" viewBox="0 0 220 220" role="img" aria-label="方向建议雷达：${esc(summary)}">
      <circle class="radar-ring" cx="110" cy="110" r="88"></circle>
      <circle class="radar-ring" cx="110" cy="110" r="58"></circle>
      <circle class="radar-ring" cx="110" cy="110" r="28"></circle>
      ${rows.map((row) => {
        const [x, y] = radarPoint(row.angle, 88);
        return `<line class="radar-axis" x1="110" y1="110" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"></line>`;
      }).join('')}
      <g class="radar-sweep"><line x1="110" y1="110" x2="110" y2="22"></line></g>
      <circle class="radar-origin" cx="110" cy="110" r="3"></circle>
      ${rows.filter((row) => row.score !== null).map((row) => {
        const radius = 18 + Math.min(68, row.score * 0.68);
        const [x, y] = radarPoint(row.angle, radius);
        return `<g class="radar-blip"><circle class="blip-ping" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8"></circle><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"></circle></g>`;
      }).join('')}
      ${hasSignal ? '' : '<text class="radar-empty" x="110" y="114" text-anchor="middle">NO SIGNAL</text>'}
    </svg>
  </div>`;
}

function capacityDial(used, capacity) {
  const pct = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0;
  return `<div class="dial" style="--pct:${pct}" role="img" aria-label="本周已排 ${used} / ${capacity} 分钟">
    <div class="dial-face"><strong>${pct}<span>%</span></strong><small>${used}/${capacity} MIN</small></div>
  </div>`;
}

function flightPath(state, target) {
  const scoped = (task) => !task.jobId || !target || task.jobId === target.id;
  const activeTasks = state.tasks.filter((task) => task.status !== '完成' && scoped(task));
  const hasTarget = Boolean(target);
  const hasPlan = Boolean(state.activePlan);
  const hasApplication = state.applications.length > 0;
  const hasInterview = state.applications.some((application) => ['面试', 'Offer'].includes(application.stage));
  const hasOffer = state.applications.some((application) => application.stage === 'Offer');
  let active = 0;
  if (!hasTarget) active = 0;
  else if (!hasPlan || activeTasks.length > 0) active = 1;
  else if (!hasApplication) active = 2;
  else if (!hasInterview) active = 3;
  else active = 4;
  const steps = [
    ['选岗', hasTarget],
    ['备战', hasPlan && activeTasks.length === 0],
    ['投递', hasApplication],
    ['面试', hasInterview],
    ['Offer', hasOffer]
  ];
  return `<ol class="flightpath" aria-label="求职主线进度">
    ${steps.map(([label, done], index) => `<li class="${done ? 'is-done' : ''}${index === active ? ' is-active' : ''}"${index === active ? ' aria-current="step"' : ''}><span class="fp-num">${String(index + 1).padStart(2, '0')}</span><span>${label}</span></li>`).join('')}
  </ol>`;
}

function signalTicker(items) {
  return `<div class="signal-ticker" aria-hidden="true">
    <div class="ticker-track">${[...items, ...items].map((item) => `<span>${esc(item)}</span><i>◆</i>`).join('')}</div>
  </div>`;
}

const statusTone = (label = '') => {
  if (/历史|关闭|下线/.test(label)) return 'muted';
  if (/异常|待|未知|未核验|超过7天/.test(label)) return 'warn';
  return 'ok';
};

const safeDate = (value) => String(value || '').slice(0, 10);

function recommendationCard(state) {
  const rated = Object.keys(state.ratings || {}).length;
  const rows = Object.entries(names)
    .map(([id, label]) => {
      const result = recommend(id, state.ratings || {}, state.interests?.[id], state.projectEvidence);
      return { id, label, ...result };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return card({
    eyebrow: '方向建议',
    title: '从哪个方向开始？',
    actions: '<button class="btn btn-ghost btn-sm" data-action="profile">调整画像</button>',
    body: `${directionRadar(state)}
      ${rated
        ? `<div class="rec-list compact">${rows.map((row) => `<div class="rec-row"><div class="rec-top"><span>${esc(row.label)}</span><strong>${row.score === null ? '信息不足' : `${row.score}/100`}</strong></div><p class="muted small">信息覆盖 ${Math.round(row.coverage * 100)}%</p></div>`).join('')}</div>`
        : '<p class="card-lede">给 3—5 项技能做自评，再选择兴趣和项目证据，雷达才会出现信号。</p>'}
      <p class="muted small">规则建议，不是录用概率。</p>`
  });
}

function profileCard(state) {
  const dayText = (state.days || [0, 1, 2, 3, 4, 5, 6]).map((day) => `周${dayNames[day]}`).join('、');
  const rated = Object.keys(state.ratings || {}).length;
  return card({
    eyebrow: '你的条件',
    title: '每周节奏',
    actions: '<button class="btn btn-ghost btn-sm" data-action="profile">编辑</button>',
    body: `${kv([
      ['可投入', `${state.hours ?? 8} 小时 / 周`],
      ['可用日', dayText || '未设置'],
      ['截止日期', state.deadline || '未设置'],
      ['技能自评', `${rated} 项已校准`]
    ])}`
  });
}

function officialJobCard(job, state, { archived = false, index = null } = {}) {
  const status = jobState(job);
  const local = state.jobs.find((item) => item.publicId === job.id);
  const isTarget = Boolean(local && local.id === state.targetId);
  const requirementText = (job.requirements || []).flatMap((item) => item.skills).slice(0, 4).join(' / ');
  const searchText = [job.company, job.title, job.city, job.intent, requirementText].filter(Boolean).join(' ').toLowerCase();

  return `<article class="job-card${isTarget ? ' is-target' : ''}${archived ? ' is-archived' : ''}" data-job-card data-direction="${esc(job.direction)}" data-search="${esc(searchText)}">
    ${index === null ? '' : `<span class="job-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`}
    <div class="job-row">
      <p class="job-meta">${esc(job.company)}<span>·</span>${esc(job.city || '城市待确认')}<span>·</span>${esc(job.intent || '类型待确认')}</p>
      ${badge(status.label, statusTone(status.label))}
    </div>
    <h3>${esc(job.title)}</h3>
    <p class="job-summary">${esc(clip(job.jd, 110))}</p>
    <div class="job-foot">
      <span class="muted small">${safeDate(job.checkedAt)} 核验${requirementText ? ` · ${esc(requirementText)}` : ''}</span>
      <div class="job-actions">
        ${archived ? '' : isTarget
          ? '<span class="badge badge-ok">当前目标</span>'
          : local
            ? `<button class="btn btn-primary btn-sm" data-target-job="${esc(local.id)}">设为目标</button>`
            : `<button class="btn btn-primary btn-sm" data-target-public="${esc(job.id)}">设为目标</button>`}
        ${archived || local ? '' : `<button class="btn btn-ghost btn-sm" data-save-public="${esc(job.id)}">收藏</button>`}
        <a class="btn btn-ghost btn-sm" href="${esc(job.source)}" target="_blank" rel="noopener noreferrer">原文 ↗</a>
      </div>
    </div>
    <details class="job-details">
      <summary>要求与核验说明</summary>
      <div class="detail-grid">
        <div><h4>资格</h4><p>${esc(job.eligibility || '未明确')}</p></div>
        <div><h4>要求摘录</h4><p>${esc(job.jd || '未提供')}</p></div>
        <div><h4>其他摘要</h4><p>${esc(job.notes || '请以原站为准')}</p></div>
        <div><h4>投递入口核验</h4><p>${esc(job.applicationEvidence || '未记录')}</p></div>
      </div>
      <p class="muted small">摘录不是完整 JD；薪资未披露则不推测；资格仍需本人确认。</p>
    </details>
  </article>`;
}

function localJobCard(job, state, index = null) {
  const isTarget = job.id === state.targetId;
  const requirements = job.requirements || [];
  const searchText = [job.company, job.title, job.city, job.jd].filter(Boolean).join(' ').toLowerCase();

  return `<article class="job-card${isTarget ? ' is-target' : ''}" data-job-card data-direction="${esc(job.direction)}" data-search="${esc(searchText)}">
    ${index === null ? '' : `<span class="job-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`}
    <div class="job-row">
      <p class="job-meta">${job.publicId ? '官方快照' : '私人 JD'}<span>·</span>${esc(job.city || '城市待确认')}<span>·</span>${esc(job.intent || '类型待确认')}</p>
      ${isTarget ? badge('当前目标', 'ok') : badge(job.qualification || '资格待确认', 'neutral')}
    </div>
    <h3>${esc(job.title)}</h3>
    <p class="job-summary">${esc(job.company || '未填写公司')} · ${esc(clip(job.jd, 110))}</p>
    <div class="job-foot">
      <span class="muted small">${requirements.length ? `${requirements.length} 条结构化要求` : '要求未结构化'}${job.sourceCheckedAt ? ` · ${safeDate(job.sourceCheckedAt)} 核验` : ''}</span>
      <div class="job-actions">
        ${isTarget ? '<span class="badge badge-ok">当前目标</span>' : `<button class="btn btn-primary btn-sm" data-target-job="${esc(job.id)}">设为目标</button>`}
        <button class="btn btn-ghost btn-sm" data-edit-job="${esc(job.id)}">编辑要求</button>
        <button class="btn btn-ghost btn-sm" data-apply-job="${esc(job.id)}">加入台账</button>
        ${job.source ? `<a class="btn btn-ghost btn-sm" href="${esc(job.source)}" target="_blank" rel="noopener noreferrer">原文 ↗</a>` : ''}
      </div>
    </div>
    <details class="job-details">
      <summary>查看 JD 与来源</summary>
      <p class="prewrap">${esc(job.jd || '未填写 JD')}</p>
      ${job.sourceNotes ? `<p class="muted small">${esc(job.sourceNotes)}</p>` : ''}
      ${job.source ? `<p class="small">来源：<a href="${esc(job.source)}" target="_blank" rel="noopener noreferrer">${esc(job.source)}</a></p>` : ''}
    </details>
  </article>`;
}

function startCard(stats, currentCount) {
  return `<section class="start-card">
    <div class="start-copy">
      <p class="eyebrow">开始</p>
      <h2>先定一个目标，再谈计划</h2>
      <p>选一个真实岗位，JobPath 才会围绕它算差距、排任务。没有目标时，不做泛泛的"学习计划"。</p>
      <div class="start-stats">
        <div><strong>${currentCount}</strong><span>核验岗位</span></div>
        <div><strong>${stats.companies}</strong><span>招聘品牌</span></div>
        <div><strong>${catalog.length}</strong><span>学习资源</span></div>
      </div>
      <p class="start-route"><span>选岗</span><i>→</i><span>差距</span><i>→</i><span>今日</span><i>→</i><span>证据</span><i>→</i><span>投递</span></p>
    </div>
    <ol class="start-steps">
      <li><span>1</span><div><strong>设定每周时间</strong><p>每周几小时、哪几天有空。</p><button class="btn btn-sm" data-action="profile">设置</button></div></li>
      <li><span>2</span><div><strong>选一个目标岗位</strong><p>从下方官方目录挑，或粘贴你手上的 JD。</p><button class="btn btn-sm" data-scroll="official-jobs">浏览目录</button></div></li>
    </ol>
  </section>`;
}

export function opportunities({ state }) {
  const current = publicJobs.filter((job) => jobState(job).current);
  const archived = [...publicJobs.filter((job) => !jobState(job).current), ...historicalJobs];
  const stats = catalogStats(publicJobs);
  const myJobs = state.jobs.filter((job) => !job.publicId || job.id === state.targetId);
  const target = state.jobs.find((job) => job.id === state.targetId);

  return `<div class="page-head">
    <div>
      <p class="eyebrow">机会 / Opportunities</p>
      <h1 aria-label="先选一个目标岗位">先选一个<span class="mark">目标岗位</span></h1>
      <p class="lede">从官方核验目录挑一个，或粘贴你手上的 JD。选定后，备战页只围绕它。</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" data-action="jd">+ 粘贴岗位 JD</button>
      <button class="btn" data-action="profile">调整时间</button>
    </div>
  </div>
  ${signalTicker([`${current.length} VERIFIED ROLES`, `${stats.companies} HIRING BRANDS`, `${safeDate(current[0]?.checkedAt) || 'SNAPSHOT'} SNAPSHOT`, 'LOCAL-FIRST', 'AI OFF'])}
  ${target ? '' : startCard(stats, current.length)}
  <div class="filterbar" role="search">
    <label class="search-field"><span class="sr-only">搜索岗位</span><input id="job-search" type="search" placeholder="搜索公司、岗位或技能"></label>
    <label class="select-field"><span>方向</span><select id="job-direction"><option value="">全部方向</option>${Object.entries(names).map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select></label>
  </div>
  <div class="content-grid">
    <div class="main-col">
      ${myJobs.length ? `<div class="section-head"><h2>我的岗位</h2><span>${myJobs.length}</span></div>
        <div class="job-list">${myJobs.map((job, index) => localJobCard(job, state, index)).join('')}</div>` : ''}
      <div class="section-head" id="official-jobs"><h2>官方岗位目录</h2><span>${current.length} 条当前机会 · ${stats.companies} 个招聘品牌</span></div>
      <div class="job-list">${current.length ? current.map((job, index) => officialJobCard(job, state, { index })).join('') : emptyState('目录快照已过期', '当前没有仍在核验期内的官方岗位；你仍可以粘贴 JD，或查看历史岗位。')}</div>
      <p id="job-empty" class="empty-inline" hidden>没有匹配的岗位。试试放宽搜索，或直接粘贴一份 JD。</p>
      ${archived.length ? `<details class="archive"><summary>历史与已关闭岗位 / ${archived.length}</summary><div class="job-list">${archived.map((job, index) => officialJobCard(job, state, { archived: true, index })).join('')}</div></details>` : ''}
    </div>
    <aside class="side-col">
      ${recommendationCard(state)}
      ${profileCard(state)}
      <p class="footnote">目录为 2026-10-30 人工核验快照。超过 7 天提示复核，超过 30 天转为历史；要求摘录不是完整 JD。</p>
    </aside>
  </div>`;
}

function taskRow(task) {
  return `<div class="task-row">
    <div class="task-main">
      <div class="task-top"><span class="eyebrow">${esc(task.skill || '任务')}</span>${badge(task.status, task.status === '完成' ? 'ok' : task.status === '暂缓' ? 'warn' : 'neutral')}</div>
      <h3>${esc(task.title)}</h3>
      <p class="muted small">${esc(task.minutes)} 分钟${task.date ? ` · ${esc(task.date)}` : ' · 未排期'}</p>
    </div>
    <button class="btn btn-sm" data-task="${esc(task.id)}">${task.status === '完成' ? '查看证据' : '打开任务'}</button>
  </div>`;
}

function targetCard(target) {
  const checked = target.sourceCheckedAt || target.checkedAt;
  return card({
    eyebrow: '目标岗位',
    title: target.title,
    actions: '<a class="btn btn-ghost btn-sm" href="#/opportunities">换目标</a>',
    body: `<p class="card-lede">${esc(target.company)} · ${esc(target.city || '城市待确认')} · ${esc(target.intent || '类型待确认')}</p>
      ${kv([
        ['来源', target.publicId ? '官方快照' : '私人 JD'],
        ['核验', checked ? safeDate(checked) : '未记录'],
        ['结构化要求', `${(target.requirements || []).length} 条`]
      ])}
      <div class="card-foot">
        <button class="btn btn-sm" data-edit-job="${esc(target.id)}">编辑要求</button>
        ${target.source ? `<a class="btn btn-ghost btn-sm" href="${esc(target.source)}" target="_blank" rel="noopener noreferrer">原站 ↗</a>` : ''}
      </div>`
  });
}

function gapCard(target, state) {
  const result = match(target.requirements || [], state.ratings || {});
  const gaps = result.rows.filter((row) => !row.met).slice(0, 3);
  const body = result.rows.length
    ? `<p class="card-lede">已知信息覆盖 ${Math.round(result.coverage * 100)}%${result.score === null ? ' · 信息不足，不展示总分' : ` · 已知项匹配 ${result.score}/100（非录用概率）`}</p>
      <div class="gap-list">${gaps.map((row) => `<div class="gap-row">
        <div><span class="badge ${row.met ? 'badge-ok' : row.coverage < 1 ? 'badge-warn' : 'badge-neutral'}">${row.met ? '已达标' : row.coverage < 1 ? '待评估' : '待补'}</span><strong>${esc(row.skills.join(row.logic === 'any' ? ' 或 ' : ' + '))}</strong> <span class="muted small">目标 ${row.level}</span></div>
        <p class="muted small">依据：${esc(clip(row.quote, 80))}</p>
      </div>`).join('') || '<p class="muted">当前要求都已达到自评目标；仍建议保留证据。</p>'}</div>`
    : `<p class="card-lede">这个岗位还没有结构化要求。先把 JD 里的硬性条件和优先项整理出来，差距才有意义。</p><button class="btn btn-primary btn-sm" data-edit-job="${esc(target.id)}">整理岗位要求</button>`;

  return card({
    eyebrow: '差距',
    title: '还差什么？',
    actions: result.rows.length ? `<button class="btn btn-ghost btn-sm" data-edit-job="${esc(target.id)}">编辑要求</button>` : '',
    body
  });
}

export function roadmapView(plan) {
  if (!plan) return '<p class="muted">还没有生成路线。生成后会先安排第 1 周，后续周只做预计。</p>';
  return `<div class="roadmap">
    ${plan.rows.map((row, index) => `<details class="week"${index === 0 ? ' open' : ''}>
      <summary><span>第 ${row.number} 周</span><span class="muted small">${row.used} / ${row.capacity} 分钟</span></summary>
      ${row.tasks.length ? row.tasks.map((task) => `<p class="week-task">${esc(task.date)} · ${esc(task.title)} · ${esc(task.minutes)} 分钟</p>`).join('') : '<p class="muted small">本周没有排入任务。</p>'}
    </details>`).join('')}
    <p class="muted small">${plan.backlog.length ? `仍有 ${plan.backlog.length} 项未排入；请缩小目标、增加时间或延后截止。` : '预计安排不等于已完成或达到岗位资格。'}</p>
  </div>`;
}

function resourceList(direction) {
  const items = catalog.filter((item) => item.direction === direction);
  return `<div class="resource-list">${items.map((item) => `<div class="resource-row">
    <div><span class="badge badge-neutral">${esc(types[item.type])}</span> <strong>${esc(item.title)}</strong><p class="muted small">${esc(item.section)} · 建议 ${esc(item.minutes)} 分钟</p></div>
    <a class="btn btn-ghost btn-sm" href="${esc(item.audit?.videoUrl || item.url)}" target="_blank" rel="noopener noreferrer">${item.type === 'video' ? '播放 ↗' : '打开 ↗'}</a>
  </div>`).join('')}</div>`;
}

export function prepare({ state, target }) {
  if (!target) return '';
  const activeTasks = state.tasks
    .filter((task) => task.status !== '完成' && (!task.jobId || task.jobId === target.id))
    .sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')));
  const completed = state.tasks.filter((task) => task.status === '完成' && (!task.jobId || task.jobId === target.id));
  const todayTasks = activeTasks.slice(0, 3);
  const capacity = state.activePlan?.capacity ?? Math.floor((state.hours || 0) * 60 * 0.8);
  const used = state.activePlan?.rows?.[0]?.used ?? activeTasks.reduce((sum, task) => sum + (Number(task.minutes) || 0), 0);
  const evidence = completed.filter((task) => String(task.evidence || '').trim()).slice(0, 3);
  const week = weekly(state.events || []);

  return `<div class="page-head">
    <div>
      <p class="eyebrow">备战 / Preparation</p>
      <h1>${esc(target.title)}</h1>
      <p class="lede">${esc(target.company)} · ${esc(target.city || '城市待确认')} · 目标已锁定。今天只做下一步。</p>
    </div>
    <div class="page-actions">
      ${state.activePlan ? '<button class="btn" data-action="plan">重排本周</button>' : ''}
      <a class="btn" href="#/opportunities">换目标</a>
    </div>
  </div>
  ${flightPath(state, target)}
  <div class="content-grid">
    <div class="main-col">
      <section class="card focus-card">
        <header class="card-head">
          <div class="card-title"><p class="eyebrow">今天</p><h2>${todayTasks.length ? '先做这一件事' : '还没有本周任务'}</h2></div>
          <div class="focus-meter">${capacityDial(used, capacity)}<span class="muted small">本周容量</span></div>
        </header>
        <div class="card-body">
          ${todayTasks.length ? todayTasks.map(taskRow).join('') : '<p class="card-lede">按每周可投入时间生成 4 或 8 周路线；只有第 1 周会写入行动队列，后续周只是预计。</p>'}
          <div class="card-foot">
            <button class="btn btn-primary btn-sm" data-action="plan">${state.activePlan ? '调整本周计划' : '生成 4/8 周计划'}</button>
            <span class="muted small">每天最多 3 项 · 预留 20% 机动</span>
          </div>
        </div>
      </section>
      ${gapCard(target, state)}
      <details class="card disclosure">
        <summary>本周路线与待办 <span class="muted small">${state.activePlan ? `${state.activePlan.weeks} 周路线` : '未生成'}</span></summary>
        <div class="card-body">${roadmapView(state.activePlan)}</div>
      </details>
      <details class="card disclosure">
        <summary>学习资料 <span class="muted small">${catalog.filter((item) => item.direction === state.direction).length} 条</span></summary>
        <div class="card-body">${resourceList(state.direction)}</div>
      </details>
    </div>
    <aside class="side-col">
      ${targetCard(target)}
      ${card({
        eyebrow: '本周',
        title: '进度',
        body: kv([
          ['已完成', `${completed.length} 项`],
          ['待做', `${activeTasks.length} 项`],
          ['投递记录', `${state.applications.length} 条`],
          ['7 天动作', `${week.completed + week.applications} 次`]
        ])
      })}
      ${card({
        eyebrow: '证据',
        title: '最近成果',
        actions: evidence.length ? '' : '<a class="btn btn-ghost btn-sm" href="#/career">去记录</a>',
        body: evidence.length
          ? evidence.map((task) => `<div class="evidence-row"><strong>${esc(task.title)}</strong><p class="muted small">${esc(clip(task.evidence, 90))}</p></div>`).join('')
          : '<p class="muted">还没有完成证据。完成任务时写下"我做了什么、如何验证"。</p>'
      })}
      ${card({
        eyebrow: '复盘',
        title: '面试与练习',
        body: `<p class="muted">五题文字练习、简历核查和面试复盘都在求职页，不挤占今天的行动。</p><a class="btn btn-sm" href="#/career">去求职页 →</a>`
      })}
    </aside>
  </div>`;
}

function applicationCard(application, index) {
  const rounds = application.rounds || [];
  const history = application.history || [];
  return `<article class="app-card">
    <div class="app-head">
      <div><h3>${esc(application.title)}</h3><p class="muted small">${esc(application.note || '下一步待补充')}</p></div>
      ${badge(application.stage, application.stage === 'Offer' ? 'ok' : application.stage === '拒绝' || application.stage === '撤回' ? 'muted' : 'neutral')}
    </div>
    <div class="app-meta">
      <span>投递：${esc(application.appliedDate || '未知')}</span>
      <span>下一步：${esc(application.date || '未设置')}</span>
      <span>轮次：${rounds.length}</span>
    </div>
    <div class="app-actions">
      <label class="inline-field"><span>阶段</span><select data-stage="${index}">${stages.map((stage) => `<option ${application.stage === stage ? 'selected' : ''}>${esc(stage)}</option>`).join('')}</select></label>
      <button class="btn btn-ghost btn-sm" data-editapp="${index}">编辑</button>
      <button class="btn btn-ghost btn-sm" data-round="${index}">添加轮次</button>
      ${application.stage === 'Offer' ? `<button class="btn btn-ghost btn-sm" data-offer="${index}">Offer 条件</button>` : ''}
    </div>
    ${rounds.length || history.length ? `<details class="app-history"><summary>轮次与阶段历史</summary>
      ${rounds.map((round, roundIndex) => `<div class="round-row"><div><strong>${esc(round.name)}</strong><p class="muted small">${esc(round.date || '日期待定')} · ${esc(round.status)} · ${esc(round.note || '')}</p></div><button class="btn btn-ghost btn-sm" data-round="${index}" data-round-index="${roundIndex}">编辑</button></div>`).join('')}
      ${history.map((entry) => `<p class="history-row">${esc(new Date(entry.at).toLocaleString())} · ${esc(entry.from)} → ${esc(entry.to)}${entry.reason ? ` · ${esc(entry.reason)}` : ''}</p>`).join('')}
      ${history.length ? '' : '<p class="muted small">旧记录没有阶段历史，不补造。</p>'}
    </details>` : ''}
  </article>`;
}

function offerSection(state) {
  const offers = state.applications.map((application, index) => ({ application, index })).filter(({ application }) => application.stage === 'Offer');
  const legacy = `<details class="legacy-offer"><summary>旧版 Offer 备注（保留）</summary><textarea id="offer" maxlength="4000" placeholder="仅本人确认的事实，不判断合同或录用结果">${esc(state.offer || '')}</textarea></details>`;
  if (!offers.length) {
    return `${emptyState('还没有 Offer 对比', '把某条记录的阶段改为 Offer 后，这里会显示七个字段的事实对比。')}${legacy}`;
  }
  return `<div class="offer-grid">${offers.map(({ application, index }) => `<article class="offer-card">
    <div class="offer-head"><h3>${esc(application.title)}</h3><button class="btn btn-sm" data-offer="${index}">编辑条件</button></div>
    ${offerFields.map(([key, label]) => `<div class="offer-field"><dt>${esc(label)}</dt><dd>${esc(application.offer?.[key] || '待确认')}</dd></div>`).join('')}
  </article>`).join('')}</div>${legacy}`;
}

export function career({ state, aiEnabled = false }) {
  const counts = stages.map((stage) => ({ stage, count: state.applications.filter((application) => application.stage === stage).length }));
  const week = weekly(state.events || []);
  return `<div class="page-head">
    <div><p class="eyebrow">求职 / Applications</p><h1>下一步是什么？</h1><p class="lede">只有本人确认才记为已投递；打开招聘网站不会改变状态。</p></div>
    <div class="page-actions"><button class="btn btn-primary" data-action="application">+ 添加记录</button><button class="btn" data-action="review">记录复盘</button></div>
  </div>
  <div class="stage-strip">${counts.map(({ stage, count }) => `<span class="stage-chip${count ? ' has-items' : ''}">${esc(stage)}<b>${count}</b></span>`).join('')}</div>
  <div class="content-grid">
    <div class="main-col">
      ${state.applications.length ? `<div class="app-list">${state.applications.map(applicationCard).join('')}</div>` : emptyState('还没有投递记录', '从目标岗位开始，把一次真实的投递记下来；没有投递也可以先记录准备中的岗位。', '<button class="btn btn-sm" data-action="application">添加第一条</button>')}
      <details class="card disclosure"${state.applications.some((application) => application.stage === 'Offer') ? ' open' : ''}>
        <summary>Offer 事实对比 <span class="muted small">只整理本人确认的信息</span></summary>
        <div class="card-body">${offerSection(state)}</div>
      </details>
      <details class="card disclosure">
        <summary>五题文字练习 <span class="muted small">静态自查可用</span></summary>
        <div class="card-body">
          <p class="muted small">说明情境、个人行动、验证证据和限制；不要补造指标或经历。</p>
          ${questions.map((question, index) => `<label class="answer-field"><span>0${index + 1} / ${esc(question)}</span><textarea data-answer="${index}" maxlength="4000" placeholder="记录你的回答">${esc(state.answers?.[index] || '')}</textarea>${aiEnabled ? `<button class="btn btn-ghost btn-sm" data-ai-answer="${index}">AI 反馈</button>` : ''}${state.feedback?.[index] ? `<details class="ai-feedback"><summary>上次 AI 反馈（需核实）</summary>${feedbackText(state.feedback[index])}</details>` : ''}</label>`).join('')}
        </div>
      </details>
      <details class="card disclosure">
        <summary>简历事实检查 <span class="muted small">${Object.values(state.checks || {}).filter(Boolean).length} / 5</span></summary>
        <div class="card-body">${['教育时间与经历准确', '项目与目标岗位相关', '明确说明个人贡献', '指标具有可核实依据', '作品链接已经本人检查'].map((label, index) => `<label class="check"><input type="checkbox" data-check="${index}" ${state.checks?.[index] ? 'checked' : ''}>${esc(label)}</label>`).join('')}</div>
      </details>
      <details class="card disclosure">
        <summary>复盘记录 <span class="muted small">面试后写三行</span></summary>
        <div class="card-body"><p class="prewrap">${esc(state.review || '还没有复盘。')}</p><button class="btn btn-sm" data-action="review">编辑复盘</button></div>
      </details>
    </div>
    <aside class="side-col">
      ${card({
        eyebrow: '最近 7 天',
        title: '行动回顾',
        body: kv([
          ['完成任务', `${week.completed} 次`],
          ['阶段变更', `${week.applications} 次`],
          ['待做任务', `${state.tasks.filter((task) => task.status !== '完成').length} 项`]
        ])
      })}
      ${card({
        eyebrow: '提示',
        title: '下一步建议',
        body: `<p class="muted">${state.applications.some((application) => application.stage === '面试') ? '有面试进行中：先记录轮次和问题，再把暴露的差距变成一个最小任务。' : '没有真实投递时，先完成一个可展示的最小实践，再打开目标岗位的原文链接。'}</p>`
      })}
    </aside>
  </div>`;
}

export function settings({ state, aiEnabled = false, version = '0.7.0' }) {
  return `<div class="page-head">
    <div><p class="eyebrow">设置 / Settings</p><h1>系统与数据</h1><p class="lede">个人数据只保存在当前浏览器；AI 默认关闭。</p></div>
  </div>
  <div class="content-grid">
    <div class="main-col">
      ${card({
        eyebrow: '画像',
        title: '每周条件',
        actions: '<button class="btn btn-sm" data-action="profile">编辑画像</button>',
        body: `${kv([
          ['方向', names[state.direction] || state.direction],
          ['每周可投入', `${state.hours ?? 8} 小时`],
          ['可用日', (state.days || [0, 1, 2, 3, 4, 5, 6]).map((day) => `周${dayNames[day]}`).join('、')],
          ['准备截止', state.deadline || '未设置'],
          ['技能自评', `${Object.keys(state.ratings || {}).length} 项`]
        ])}<div class="card-foot"><button class="btn btn-sm" data-action="profile">重新校准</button></div>`
      })}
      ${card({
        eyebrow: '数据',
        title: '备份与恢复',
        body: `<p class="muted">导出为明文 JSON，包含个人记录；请妥善保管。导入会完整替换当前数据。</p>
          <div class="card-foot"><button class="btn btn-primary btn-sm" data-action="export">导出备份</button><button class="btn btn-sm" data-action="import">导入备份</button><input type="file" id="importfile" accept=".json" hidden><button class="btn btn-danger btn-sm" data-action="clear">清空本机数据</button></div>`
      })}
      ${card({
        eyebrow: '实验功能',
        title: 'AI 助手',
        body: aiEnabled
          ? `<p class="muted">AI 已开启：每次发送前都会展示内容并要求同意，结果只是草稿。</p>
            <label class="field"><span>邀请令牌（仅当前标签页）</span><input id="invite" type="password" autocomplete="off"></label>
            <div class="card-foot"><button class="btn btn-sm" id="save-invite">保存并查询额度</button><button class="btn btn-ghost btn-sm" id="clear-invite">退出邀请</button></div>
            <p id="quota-status" class="muted small" role="status"></p>`
          : `<p class="muted">AI 未开启。核心流程（选岗、差距、计划、证据、台账、备份）都不依赖 AI。</p><p class="muted small">启用需要本地密钥、邀请与额度配置；见 docs/AI_BACKEND.md。</p>`
      })}
    </div>
    <aside class="side-col">
      ${card({
        eyebrow: '关于',
        title: 'JobPath',
        body: `<p class="muted">岗位要求驱动的本地求职备战工作台。当前为本地证据版，未部署公网。</p>${kv([
          ['版本', version],
          ['数据位置', '当前浏览器 IndexedDB'],
          ['服务端', '本地 Node 网关'],
          ['AI', aiEnabled ? '已开启' : '未开启']
        ])}`
      })}
      ${card({
        eyebrow: '提醒',
        title: '本地数据会丢',
        body: `<p class="muted">清理浏览器、换设备或隐私模式都会让数据消失。建议每周导出一次备份。</p>`
      })}
    </aside>
  </div>`;
}

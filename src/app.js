import { changeStage, validateApplication } from './applications.js';
import { fields, restoreFields, readDraft, writeDraft, clearDrafts } from './drafts.js';
import { roadmap, offerFields, validateOffer, validDate } from './planning.js';
import { publicJobs, snapshotJob } from './jobs.js';
import { resourceFor } from './catalog.js';
import { templates, safeUrl, today } from './workflow.js';
import { writeRevision } from './storage.js';
import { skills, validateBackup } from './domain.js';
import { esc } from './ui/components.js';
import { names, opportunities, prepare, career, settings, roadmapView } from './ui/views.js';

const $ = (selector) => document.querySelector(selector);
const APP_VERSION = '0.7.0';
const ROUTES = ['opportunities', 'prepare', 'career', 'settings'];
const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

const initial = () => ({
  direction: 'web',
  hours: 8,
  tasks: [],
  jobs: [],
  applications: [],
  answers: ['', '', '', '', ''],
  ratings: {},
  events: [],
  checks: {}
});

let state = initial();
let page = 'opportunities';
let db = null;
let revision = 0;
let saveText = '正在连接本地存储';
let saveFailed = false;
let pendingSaves = 0;
let queue = Promise.resolve();
let aiEnabled = false;
let appVersion = APP_VERSION;
let pendingNav = '';
let lastFocused = null;
let editSession = null;

const draftStorage = {
  getItem: (key) => sessionStorage.getItem(key),
  setItem: (key, value) => sessionStorage.setItem(key, value),
  removeItem: (key) => sessionStorage.removeItem(key)
};

const targetJob = () => state.jobs.find((job) => job.id === state.targetId) || null;

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jobpath-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const readRecord = (database) => new Promise((resolve, reject) => {
  const request = database.transaction('state').objectStore('state').get('main');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

function setSaveState() {
  document.querySelectorAll('.js-save-state').forEach((element) => {
    element.textContent = saveText;
    element.classList.toggle('is-error', saveFailed);
  });
}

async function save() {
  pendingSaves += 1;
  saveText = '保存中…';
  setSaveState();
  const snapshot = structuredClone(state);
  const operation = queue.then(async () => {
    if (!db) throw Error('本地存储不可用，请先导出备份');
    revision = await writeRevision(db, snapshot, revision);
    state.revision = revision;
    saveFailed = false;
    saveText = '已保存到此设备';
  });
  queue = operation.catch(() => {});
  try {
    await operation;
  } catch (error) {
    saveFailed = true;
    saveText = '保存失败';
    toast(error.message);
    throw error;
  } finally {
    pendingSaves -= 1;
    setSaveState();
  }
}

function event(type, id = '') {
  state.events ??= [];
  state.events.push({ type, id, at: Date.now() });
  state.events = state.events.slice(-2000);
}

let toastTimer = 0;
function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('is-visible'), 3200);
}

function routeFromHash() {
  const raw = location.hash.replace(/^#\/?/, '').split('?')[0];
  return ROUTES.includes(raw) ? raw : '';
}

function navigate(next, { replace = false } = {}) {
  if (!ROUTES.includes(next)) return;
  if (location.hash === `#/${next}`) {
    page = next;
    render();
    return;
  }
  if (replace) {
    history.replaceState(null, '', `#/${next}`);
    page = next;
    render();
    return;
  }
  location.hash = `#/${next}`;
}

function navLinks() {
  const items = [
    ['opportunities', '机会'],
    ['prepare', '备战'],
    ['career', '求职'],
    ['settings', '设置']
  ];
  return items.map(([id, label]) => `<a class="nav-link${page === id ? ' is-active' : ''}" href="#/${id}"${page === id ? ' aria-current="page"' : ''}>${label}</a>`).join('');
}

function topbar(target) {
  return `<header class="topbar">
    <a class="brand" href="#/opportunities" aria-label="启职 JobPath 首页">
      <span class="brand-mark">JP</span>
      <span class="brand-text"><strong>启职</strong><small>JOBPATH</small></span>
    </a>
    <div class="target-chip${target ? '' : ' is-empty'}">
      <span class="target-label">${target ? '当前目标' : '尚未选岗'}</span>
      ${target ? `<a class="target-name" href="#/prepare" title="${esc(target.title)}">${esc(target.company)} · ${esc(target.title)}</a>` : '<a class="target-name" href="#/opportunities">先选一个岗位 →</a>'}
    </div>
    <nav class="top-nav" aria-label="主导航">${navLinks()}</nav>
    <div class="top-status"><span class="save-state js-save-state" role="status">${esc(saveText)}</span><a class="icon-btn" href="#/settings" aria-label="设置">⚙</a></div>
  </header>`;
}

function footer() {
  return `<footer class="site-foot">
    <span>数据只保存在此浏览器 · 建议每周导出一次</span>
    <span>本地证据版 · v${esc(appVersion)}</span>
  </footer>`;
}

function bottomNav() {
  return `<nav class="bottom-nav" aria-label="移动端主导航">${navLinks()}</nav>`;
}

function render() {
  const target = targetJob();
  if (page === 'prepare' && !target) {
    page = 'opportunities';
    history.replaceState(null, '', '#/opportunities');
  }
  const content = page === 'opportunities'
    ? opportunities({ state })
    : page === 'prepare'
      ? prepare({ state, target })
      : page === 'career'
        ? career({ state, aiEnabled })
        : settings({ state, aiEnabled, version: appVersion });
  $('#app').innerHTML = `<a class="skip-link" href="#main" data-scroll="main">跳到主要内容</a><div class="scroll-rail" aria-hidden="true"><i></i></div>${topbar(target)}<main id="main" class="page" tabindex="-1">${content}</main>${footer()}${bottomNav()}`;
  setSaveState();
  bind();
  updateScrollRail();
  if (page === 'career') recoverInlineDrafts();
}

function updateScrollRail() {
  const rail = document.querySelector('.scroll-rail i');
  if (!rail) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
  rail.style.width = `${pct}%`;
}

/* ---------- navigation and target ---------- */

async function setTarget(localId) {
  const job = state.jobs.find((item) => item.id === localId);
  if (!job) return;
  state.targetId = job.id;
  state.target = job.title;
  state.direction = job.direction || state.direction;
  try {
    await save();
    toast('已设为目标岗位');
    navigate('prepare');
  } catch {
    /* save() already surfaced the error */
  }
}

async function targetPublic(publicId) {
  try {
    const source = publicJobs.find((job) => job.id === publicId);
    if (!source) return;
    let local = state.jobs.find((job) => job.publicId === source.id);
    if (!local) {
      local = snapshotJob(source, crypto.randomUUID());
      state.jobs.push(local);
    }
    await setTarget(local.id);
  } catch (error) {
    toast(error.message);
  }
}

async function savePublic(publicId) {
  try {
    if (state.jobs.some((job) => job.publicId === publicId)) {
      toast('该岗位已在你的岗位库中');
      return;
    }
    const source = publicJobs.find((job) => job.id === publicId);
    if (!source) return;
    state.jobs.push(snapshotJob(source, crypto.randomUUID()));
    await save();
    toast('已收藏岗位快照');
    render();
  } catch (error) {
    toast(error.message);
  }
}

/* ---------- modal and drafts ---------- */

function modal(title, body, submit = async () => {}, draftKey = title) {
  const dialog = $('#modal');
  lastFocused = document.activeElement;
  dialog.innerHTML = `<form id="form" class="modal-form">
    <header class="modal-head">
      <div><p class="eyebrow">编辑</p><h2 id="modal-title">${esc(title)}</h2></div>
      <button type="button" id="close" class="icon-btn" aria-label="关闭">✕</button>
    </header>
    <div class="modal-body">${body}</div>
    <p id="draft-status" class="draft-status" role="status"></p>
    <footer class="modal-actions">
      <div class="draft-actions"><button type="button" id="restore-draft" class="btn btn-ghost btn-sm" hidden>恢复草稿</button><button type="button" id="discard-draft" class="btn btn-ghost btn-sm" hidden>丢弃草稿</button></div>
      <span class="spacer"></span>
      <button type="button" id="cancel" class="btn">取消</button>
      <button type="submit" class="btn btn-primary">保存</button>
    </footer>
  </form>`;
  const form = $('#form');
  let baseline = '';
  let ready = false;
  const snapshot = () => ({ fields: fields(form), extra: form.readDraftExtra?.() ?? null });
  const session = {
    dirty: () => ready && JSON.stringify(snapshot()) !== baseline,
    capture: () => {
      if (!session.dirty()) return;
      try {
        writeDraft(draftStorage, draftKey, { ...snapshot(), at: Date.now() });
        $('#draft-status').textContent = '未提交；草稿只保留在本标签页，重新打开可恢复。';
      } catch {
        $('#draft-status').textContent = '草稿未能保存，请复制输入内容后重试。';
      }
    }
  };
  editSession = session;
  const close = () => {
    if (form.dataset.saving) return;
    if (session.dirty() && !confirm('内容尚未正式保存。关闭并保留本标签页草稿？')) return;
    session.capture();
    editSession = null;
    dialog.close();
    lastFocused?.focus?.();
  };
  $('#close').onclick = close;
  $('#cancel').onclick = close;
  dialog.oncancel = (event) => {
    event.preventDefault();
    close();
  };
  queueMicrotask(() => {
    if ($('#form') !== form) return;
    baseline = JSON.stringify(snapshot());
    ready = true;
    if (readDraft(draftStorage, draftKey)) {
      $('#restore-draft').hidden = false;
      $('#discard-draft').hidden = false;
      $('#draft-status').textContent = '发现未提交草稿；可恢复或丢弃。';
    }
    $('#restore-draft').onclick = () => {
      const draft = readDraft(draftStorage, draftKey);
      if (!draft) return;
      form.restoreDraftExtra?.(draft.extra);
      restoreFields(form, draft.fields);
      $('#draft-status').textContent = '已恢复草稿，请核对后保存。';
    };
    $('#discard-draft').onclick = () => {
      dropDraft(draftKey);
      $('#restore-draft').hidden = true;
      $('#discard-draft').hidden = true;
      $('#draft-status').textContent = '已丢弃暂存草稿。';
    };
    form.addEventListener('input', session.capture);
    form.addEventListener('change', session.capture);
  });
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (form.dataset.saving) return;
    form.dataset.saving = 'true';
    form.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    const before = structuredClone(state);
    try {
      const data = new FormData(form);
      form.beforeCommit?.(data);
      await submit(data);
      await save();
      dropDraft(draftKey);
      editSession = null;
      dialog.close();
      if (pendingNav) {
        const next = pendingNav;
        pendingNav = '';
        navigate(next);
      } else {
        render();
      }
      toast('已保存');
    } catch (error) {
      state = before;
      pendingNav = '';
      session.capture();
      let message = $('#form-error');
      if (!message) {
        message = document.createElement('p');
        message.id = 'form-error';
        message.className = 'form-error';
        message.setAttribute('role', 'alert');
        form.querySelector('.modal-body').append(message);
      }
      message.textContent = error.message;
    } finally {
      delete form.dataset.saving;
      form.querySelectorAll('button').forEach((button) => { button.disabled = false; });
    }
  };
  if (dialog.open) dialog.close();
  dialog.showModal();
}

const dropDraft = (key) => {
  try { draftStorage.removeItem(`jobpath-draft:${key}`); } catch { /* storage may be unavailable */ }
};
const dropAllDrafts = () => {
  try { clearDrafts(sessionStorage); } catch { /* storage may be unavailable */ }
};

async function saveInline(key, value) {
  if (key === 'legacy-offer') state.offer = value;
  else state.answers[Number(key.slice(7))] = value;
  try {
    writeDraft(draftStorage, key, { fields: [{ key: 'text', type: 'textarea', value }], at: Date.now() });
  } catch {
    toast('文字草稿未能暂存，请保留输入或导出备份');
  }
  try {
    await save();
    const latest = key === 'legacy-offer' ? state.offer : state.answers[Number(key.slice(7))];
    if (latest === value) dropDraft(key);
  } catch { /* the form still shows the text */ }
}

function recoverInlineDrafts() {
  for (const key of [...state.answers.map((_, index) => `answer-${index}`), 'legacy-offer']) {
    const draft = readDraft(draftStorage, key);
    if (!draft) continue;
    const input = key === 'legacy-offer' ? $('#offer') : document.querySelector(`[data-answer="${key.slice(7)}"]`);
    if (!input) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-ghost btn-sm';
    button.textContent = '恢复未保存文字';
    button.onclick = async () => {
      const value = draft.fields[0]?.value;
      if (typeof value !== 'string') return;
      input.value = value;
      await saveInline(key, value);
      if (!saveFailed) button.remove();
    };
    input.after(button);
  }
}

/* ---------- forms ---------- */

function profile() {
  const target = targetJob();
  const skillIds = [...new Set([...skills[state.direction], ...((target?.requirements || []).flatMap((requirement) => requirement.skills))])];
  const daySet = new Set(state.days || [0, 1, 2, 3, 4, 5, 6]);
  const body = `<p class="notice">方向由目标岗位决定：<strong>${esc(names[state.direction])}</strong>。选定新岗位后会自动切换；技能自评会保留。</p>
    <div class="form-grid">
      <label class="field"><span>每周可投入小时（0—80）</span><input name="hours" type="number" min="0" max="80" required value="${esc(state.hours)}"></label>
      <label class="field"><span>准备截止日期</span><input name="deadline" type="date" value="${esc(state.deadline || '')}"></label>
      <label class="field"><span>毕业年月</span><input name="graduation" type="month" value="${esc(state.graduation || '')}"></label>
      <label class="field"><span>求职类型</span><select name="intent"><option>待确认</option><option ${state.intent === '实习' ? 'selected' : ''}>实习</option><option ${state.intent === '校招' ? 'selected' : ''}>校招</option></select></label>
      <label class="field"><span>目标城市</span><input name="cities" value="${esc(state.cities || '')}" placeholder="例如：上海、杭州"></label>
      <label class="field"><span>项目证据</span><select name="projectEvidence"><option value="">未回答</option><option value="0" ${state.projectEvidence === 0 ? 'selected' : ''}>明确没有</option><option value="1" ${state.projectEvidence === 1 ? 'selected' : ''}>有（自报）</option></select></label>
    </div>
    <p class="field-label">每周可用日期</p>
    <div class="check-row">${dayNames.map((day, index) => `<label class="check"><input type="checkbox" name="day" value="${index}" ${daySet.has(index) ? 'checked' : ''}>周${day}</label>`).join('')}</div>
    <p class="field-label">方向兴趣（未知可留空）</p>
    <div class="form-grid">${Object.entries(names).map(([id, label]) => `<label class="field"><span>${esc(label)}</span><select name="interest-${id}"><option value="">未知</option>${[0, 1, 2, 3, 4].map((value) => `<option ${state.interests?.[id] === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>`).join('')}</div>
    <p class="field-label">技能自评（0 未接触 / 1 跟随教程 / 2 独立完成 / 3 可解释扩展）</p>
    <div class="form-grid">${skillIds.map((skill) => `<label class="field"><span>${esc(skill)}</span><select name="skill-${esc(skill)}"><option value="">未知</option>${[0, 1, 2, 3].map((value) => `<option value="${value}" ${state.ratings?.[skill] === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>`).join('')}</div>`;
  modal('个人画像', body, (data) => {
    const hours = Number(data.get('hours'));
    if (!Number.isFinite(hours) || hours < 0 || hours > 80) throw Error('每周小时应在 0—80 之间');
    const deadline = data.get('deadline') || '';
    if (deadline && !validDate(deadline)) throw Error('截止日期无效');
    state.hours = hours;
    state.deadline = deadline;
    state.graduation = data.get('graduation') || '';
    state.intent = data.get('intent') || '待确认';
    state.cities = data.get('cities') || '';
    state.days = data.getAll('day').map(Number);
    state.interests = {};
    for (const id of Object.keys(names)) {
      const value = data.get(`interest-${id}`);
      if (value !== '') state.interests[id] = Number(value);
    }
    const evidence = data.get('projectEvidence');
    state.projectEvidence = evidence === '' ? null : Number(evidence);
    state.ratings ??= {};
    for (const [key, value] of data) {
      if (!key.startsWith('skill-')) continue;
      const skill = key.slice(6);
      if (value === '') delete state.ratings[skill];
      else state.ratings[skill] = Number(value);
    }
    event('profile_updated');
  }, 'profile');
}

function application(job, index) {
  const current = index !== undefined ? state.applications[index] : { title: job?.title || '', note: '', date: '' };
  const body = `${job ? `<p class="notice">绑定岗位：${esc(job.company || '')} · ${esc(job.title)}</p>` : ''}
    <label class="field"><span>公司 / 岗位</span><input name="title" required maxlength="150" value="${esc(current.title)}"></label>
    <div class="form-grid">
      <label class="field"><span>实际投递日期（未知可留空）</span><input name="appliedDate" type="date" value="${esc(current.appliedDate || '')}"></label>
      <label class="field"><span>下一步日期（可选）</span><input name="date" type="date" value="${esc(current.date || '')}"></label>
    </div>
    <label class="field"><span>下一步行动</span><input name="note" maxlength="500" value="${esc(current.note || '')}" placeholder="例如：补完项目后投递"></label>
    <p class="muted small">填写日期不会自动标记已投递；阶段仍需单独确认。</p>`;
  modal(current.id ? '编辑求职记录' : '添加求职记录', body, (data) => {
    const next = validateApplication({
      ...current,
      ...Object.fromEntries(data),
      id: current.id || crypto.randomUUID(),
      stage: current.stage || '收藏',
      jobId: job?.id || current.jobId || null
    });
    if (index !== undefined) state.applications[index] = next;
    else state.applications.push(next);
    event('application_saved', next.id);
  }, `application:${current.id || index || job?.id || 'new'}`);
}

function editRound(index, roundIndex) {
  const current = state.applications[index];
  const round = current.rounds?.[roundIndex] || { name: '', date: '', status: '待安排', note: '' };
  const body = `<p class="notice">${esc(current.title)} · 轮次不会自动改变申请阶段。</p>
    <label class="field"><span>轮次名称</span><input name="name" required maxlength="100" value="${esc(round.name)}" placeholder="一面 / 技术面 / HR 面"></label>
    <div class="form-grid">
      <label class="field"><span>日期</span><input name="date" type="date" value="${esc(round.date || '')}"></label>
      <label class="field"><span>状态</span><select name="status">${['待安排', '已安排', '已完成', '取消'].map((status) => `<option ${round.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>问题、反馈与下一步</span><textarea name="note" maxlength="4000">${esc(round.note || '')}</textarea></label>`;
  modal('面试轮次', body, (data) => {
    const rounds = structuredClone(current.rounds || []);
    const next = { ...Object.fromEntries(data), id: round.id || crypto.randomUUID() };
    if (roundIndex === undefined) rounds.push(next);
    else rounds[roundIndex] = next;
    state.applications[index] = validateApplication({ ...current, rounds });
    event('interview_round', current.id || String(index));
  }, `round:${current.id || index}:${round.id || 'new'}`);
}

function stageDialog(index, next) {
  const current = state.applications[index];
  if (!current || current.stage === next) return;
  const body = `<p class="notice">${esc(current.title)}：${esc(current.stage)} → ${esc(next)}</p>
    <p class="muted">请确认这是真实发生的求职动作或结果。回退会保留历史，但不会删除 Offer 条件。</p>
    ${next === '已投递' ? `<label class="field"><span>实际投递日期（未知可留空）</span><input name="appliedDate" type="date" value="${esc(current.appliedDate || '')}"></label>` : ''}
    <label class="field"><span>变更说明（可选）</span><textarea name="reason" maxlength="1000"></textarea></label>`;
  modal('确认求职阶段', body, (data) => {
    state.applications[index] = changeStage(state.applications[index], next, {
      reason: data.get('reason'),
      appliedDate: data.has('appliedDate') ? data.get('appliedDate') : current.appliedDate || ''
    });
    event('application_stage', current.id || String(index));
  }, `stage:${current.id || index}:${next}`);
}

function taskModal(task) {
  const resources = resourceFor(task.skill, state.direction).slice(0, 4)
    .map((resource) => `<a href="${esc(resource.audit?.videoUrl || resource.url)}" target="_blank" rel="noopener noreferrer">${esc(resource.title)}</a>`)
    .join(' · ');
  const body = `<p class="notice">验收：提供一个可复现的实例，说明个人实现与验证过程。完成为用户自报，不代表系统通过测试。</p>
    <p class="prewrap">${esc(task.acceptance || '完成可复现的实践并记录个人贡献。')}</p>
    ${resources ? `<p class="muted small">学习入口：${resources}</p>` : ''}
    <div class="form-grid">
      <label class="field"><span>预计分钟（1—90）</span><input name="minutes" type="number" min="1" max="90" step="1" required value="${esc(task.minutes)}" ${task.status === '完成' ? 'readonly' : ''}></label>
      <label class="field"><span>状态</span><select name="status">${['待做', '进行中', '完成', '暂缓'].map((status) => `<option ${task.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>成果证据：我做了什么、如何验证、遇到的问题</span><textarea name="evidence" maxlength="4000">${esc(task.evidence || '')}</textarea></label>
    <label class="check"><input type="checkbox" name="accepted" ${task.status === '完成' ? 'checked' : ''}>我已完成实践并检查验收要求</label>`;
  modal(`任务 / ${task.skill || ''}`, body, (data) => {
    const current = state.tasks.find((item) => item.id === task.id);
    if (!current) throw Error('任务不存在');
    const status = data.get('status');
    const evidence = data.get('evidence') || '';
    if (status === '完成' && (!data.get('accepted') || evidence.trim().length < 10)) {
      throw Error('完成任务需要勾选验收，并填写至少 10 个字的证据');
    }
    const minutes = Number(data.get('minutes'));
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 90) throw Error('估时应为 1–90 分钟');
    if (current.status !== '完成' && status === '完成') event('task_completed', current.id);
    current.minutes = minutes;
    current.status = status;
    current.evidence = evidence;
    current.completedAt = status === '完成' ? Date.now() : null;
  }, `task:${task.id}`);
}

function addJob() {
  const body = `<div class="form-grid">
      <label class="field"><span>职位名称</span><input name="title" required maxlength="100" placeholder="例如：前端开发实习生"></label>
      <label class="field"><span>公司</span><input name="company" required maxlength="100"></label>
      <label class="field"><span>方向</span><select name="direction">${Object.entries(names).map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select></label>
      <label class="field"><span>城市（可选）</span><input name="city" maxlength="60"></label>
      <label class="field"><span>招聘类型</span><select name="intent"><option>待确认</option><option>实习</option><option>校招</option></select></label>
      <label class="field"><span>来源 URL（可选，仅 HTTPS）</span><input name="source" type="url" placeholder="https://..."></label>
    </div>
    <label class="field"><span>JD 原文 / 明确要求</span><textarea name="jd" required maxlength="10000" placeholder="粘贴原文，保留要求和资格信息；不做自动推断。"></textarea></label>
    <p class="muted small">保存后只留在本机；可在岗位卡里继续把要求结构化。</p>`;
  modal('粘贴岗位 JD', body, (data) => {
    const title = String(data.get('title') || '').trim();
    const company = String(data.get('company') || '').trim();
    if (!title || !company) throw Error('职位名称和公司不能为空');
    const source = data.get('source') ? safeUrl(data.get('source')) : '';
    const job = {
      id: crypto.randomUUID(),
      title,
      company,
      direction: data.get('direction'),
      city: String(data.get('city') || '').trim(),
      intent: data.get('intent') || '待确认',
      qualification: '待确认',
      sourceNotes: '',
      requirements: [],
      checkedAt: Date.now(),
      jd: String(data.get('jd') || ''),
      source
    };
    if (!job.jd.trim()) throw Error('JD 原文不能为空');
    state.jobs.push(job);
    event('job_created', job.id);
    if (!state.targetId) {
      state.targetId = job.id;
      state.target = job.title;
      state.direction = job.direction;
      pendingNav = 'prepare';
    }
  }, 'jd:new');
}

function editJob(job) {
  let draft = structuredClone(job.requirements || []);
  const body = `<div class="form-grid">
      <label class="field"><span>官方来源 URL</span><input name="source" value="${esc(job.source || '')}" placeholder="https://..."></label>
      <label class="field"><span>城市</span><input name="city" value="${esc(job.city || '')}"></label>
      <label class="field"><span>招聘类型</span><select name="intent">${['待确认', '实习', '校招'].map((value) => `<option ${job.intent === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      <label class="field"><span>资格核对</span><select name="qualification">${['待确认', '符合', '不符合'].map((value) => `<option ${job.qualification === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      <label class="field"><span>截止日期</span><input name="expires" type="date" value="${esc(job.expires || '')}"></label>
      <label class="field"><span>资格条件原文</span><input name="eligibility" value="${esc(job.eligibility || '')}"></label>
    </div>
    <div class="notice">选择必需/优先、全部/任一技能；证据必须出现在下方 JD 原文里。保存前不会覆盖岗位。</div>
    <div id="requirement-rows"></div>
    <button type="button" id="add-requirement" class="btn btn-ghost btn-sm">+ 新增要求</button>
    <label class="field"><span>原始 JD / 可补充官方全文</span><textarea name="jd" required maxlength="10000">${esc(job.jd || '')}</textarea></label>`;
  modal('编辑岗位要求', body, (data) => {
    const requirements = draft.map((requirement) => {
      if (!requirement.skills.length || !requirement.quote.trim() || !data.get('jd').includes(requirement.quote)) {
        throw Error('每条要求必须选择技能，并填写 JD 原文中的证据');
      }
      return requirement;
    });
    const source = data.get('source') ? safeUrl(data.get('source')) : '';
    Object.assign(job, Object.fromEntries(data), {
      requirements,
      source,
      checkedAt: Date.now()
    });
    event('job_confirmed', job.id);
  }, `job:${job.id}`);

  const rows = () => {
    $('#requirement-rows').innerHTML = draft.map((requirement, index) => `<fieldset class="requirement-row">
      <legend>要求 ${index + 1}</legend>
      <div class="form-grid three">
        <label class="field"><span>性质</span><select data-r="${index}" data-field="kind"><option value="required" ${requirement.kind === 'required' ? 'selected' : ''}>必需</option><option value="preferred" ${requirement.kind === 'preferred' ? 'selected' : ''}>优先</option></select></label>
        <label class="field"><span>关系</span><select data-r="${index}" data-field="logic"><option value="all" ${requirement.logic === 'all' ? 'selected' : ''}>全部满足</option><option value="any" ${requirement.logic === 'any' ? 'selected' : ''}>任一满足</option></select></label>
        <label class="field"><span>目标层级</span><select data-r="${index}" data-field="level">${[1, 2, 3].map((level) => `<option ${requirement.level === level ? 'selected' : ''}>${level}</option>`).join('')}</select></label>
      </div>
      <div class="skill-picker">${[...new Set([...Object.values(skills).flat(), 'Vue', 'Playwright', 'Git', ...requirement.skills])].map((skill) => `<label class="check"><input type="checkbox" data-skill="${esc(skill)}" data-r="${index}" ${requirement.skills.includes(skill) ? 'checked' : ''}>${esc(skill)}</label>`).join('')}</div>
      <label class="field"><span>原文证据</span><textarea data-r="${index}" data-field="quote" maxlength="300">${esc(requirement.quote)}</textarea></label>
      <button type="button" class="btn btn-ghost btn-sm" data-remove="${index}">移除此要求</button>
    </fieldset>`).join('');
    $('#requirement-rows').querySelectorAll('[data-field]').forEach((element) => {
      element.oninput = () => {
        draft[Number(element.dataset.r)][element.dataset.field] = element.dataset.field === 'level' ? Number(element.value) : element.value;
      };
    });
    $('#requirement-rows').querySelectorAll('[data-skill]').forEach((element) => {
      element.onchange = () => {
        const requirement = draft[Number(element.dataset.r)];
        requirement.skills = element.checked
          ? [...requirement.skills, element.dataset.skill]
          : requirement.skills.filter((skill) => skill !== element.dataset.skill);
      };
    });
    $('#requirement-rows').querySelectorAll('[data-remove]').forEach((element) => {
      element.onclick = () => {
        draft.splice(Number(element.dataset.remove), 1);
        rows();
      };
    });
  };
  $('#add-requirement').onclick = () => {
    if (draft.length >= 10) {
      toast('最多 10 条要求');
      return;
    }
    draft.push({ kind: 'required', logic: 'all', level: 2, skills: [], quote: '' });
    rows();
  };
  rows();
  $('#form').readDraftExtra = () => structuredClone(draft);
  $('#form').restoreDraftExtra = (value) => {
    if (Array.isArray(value)) {
      draft = structuredClone(value);
      rows();
    }
  };
}

/* ---------- planning ---------- */

function previewPlan(weeks, start) {
  const target = targetJob();
  if (!target) {
    toast('先选一个目标岗位');
    return;
  }
  const keyOf = (task) => task.key || `legacy-${task.id || crypto.randomUUID()}`;
  const scope = (task) => !task.jobId || task.jobId === state.targetId;
  const done = state.tasks.filter((task) => task.status === '完成' && scope(task)).map((task) => ({ ...task, key: keyOf(task) }));
  const pending = [...(state.backlog || []).filter(scope), ...state.tasks.filter((task) => task.status !== '完成' && scope(task))]
    .map((task) => ({ ...task, key: keyOf(task), deps: task.deps || [] }));
  const items = new Map(templates(state.direction, target.requirements || [], state.ratings || {}).map((task) => [task.key, task]));
  for (const task of pending) items.set(task.key, task);
  const completed = done.map((task) => task.key);
  const result = roadmap([...items.values()], {
    weeks,
    start,
    hours: state.hours,
    deadline: state.deadline || '',
    days: state.days || [0, 1, 2, 3, 4, 5, 6],
    completed,
    reserved: done
  });
  const affected = state.tasks.filter((task) => task.status !== '完成' && scope(task));
  modal('确认计划差异', `<p>将保留 ${done.length} 项已完成任务及证据；第 1 周安排 ${result.rows[0].tasks.length} 项。相同任务的未完成笔记会尽量保留。</p>
    <details class="inline-details"><summary>查看受影响的未完成任务 / ${affected.length}</summary>${affected.map((task) => `<p class="muted small">${esc(task.title)} · ${esc(task.status)} · ${esc(task.date || '未排期')}</p>`).join('') || '<p class="muted small">无</p>'}</details>
    ${roadmapView(result)}`, () => {
    state.plans ??= [];
    state.plans.push({ id: crypto.randomUUID(), createdAt: Date.now(), tasks: structuredClone(state.tasks), overview: state.activePlan || null, jobId: state.targetId || null });
    const id = crypto.randomUUID();
    state.activePlan = { ...result, id, createdAt: Date.now(), jobId: state.targetId || null };
    const allDone = state.tasks.filter((task) => task.status === '完成');
    state.tasks = allDone.concat(result.rows[0].tasks.map((task) => ({
      ...task,
      id: crypto.randomUUID(),
      planId: id,
      status: task.status === '进行中' ? '进行中' : '待做',
      evidence: task.evidence || '',
      jobId: state.targetId || null
    })));
    state.backlog = result.rows.slice(1).flatMap((row) => row.tasks.map((task) => ({
      ...task,
      jobId: state.targetId || null,
      reason: `预计第 ${row.number} 周；尚未写入行动队列`
    }))).concat(result.backlog.map((task) => ({
      ...task,
      jobId: state.targetId || null,
      reason: '周期容量、截止或先修限制'
    })));
    event('plan_created', id);
  }, 'plan-confirm');
}

function openPlan() {
  modal('设置计划周期', `<label class="field"><span>预计周期</span><select name="weeks"><option value="4">4 周</option><option value="8" ${state.activePlan?.weeks === 8 ? 'selected' : ''}>8 周</option></select></label>
    <label class="field"><span>开始日期</span><input name="start" type="date" value="${today()}" required></label>
    <p class="muted">按每周 ${esc(state.hours)} 小时、可用日和截止日期计算。下一步先预览，最后确认才写入行动队列。</p>`, () => {}, 'plan');
  $('#form button[type="submit"]').textContent = '预览计划';
  $('#form').onsubmit = (event) => {
    event.preventDefault();
    try {
      const data = new FormData(event.target);
      previewPlan(Number(data.get('weeks')), data.get('start'));
    } catch (error) {
      toast(error.message);
    }
  };
}

/* ---------- review, backup, AI ---------- */

function openReview() {
  const target = targetJob();
  modal('面试复盘', `<label class="field"><span>这次面试暴露了什么？</span><textarea name="review" required maxlength="4000">${esc(state.review || '')}</textarea></label>
    <label class="field"><span>补缺任务标题（可选）</span><input name="task" maxlength="150" placeholder="例如：补充一次边界输入测试"></label>`, (data) => {
    state.review = data.get('review');
    const title = String(data.get('task') || '').trim();
    if (title) {
      state.tasks.push({
        id: crypto.randomUUID(),
        key: crypto.randomUUID(),
        skill: '面试复盘',
        jobId: target?.id || null,
        title,
        minutes: 30,
        status: '待做',
        evidence: '',
        date: ''
      });
      event('review_task');
    }
    event('review');
  }, 'review');
}

function exportBackup() {
  const payload = {
    app: 'jobpath',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    containsPersonalData: true,
    generationNotice: '部分反馈可能为 AI 辅助，需核实',
    data: state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `jobpath-backup-${today()}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('备份已导出，请妥善保管');
}

async function importFile(event) {
  const input = event.target;
  try {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) throw Error('文件超过 2MB');
    const raw = await file.text();
    if (/"(?:__proto__|constructor|prototype)"\s*:/.test(raw)) throw Error('备份包含不允许的字段');
    const next = validateBackup(JSON.parse(raw));
    if (!confirm(`将覆盖当前数据：${next.jobs.length} 个岗位、${next.tasks.length} 个任务、${next.applications.length} 条申请。请先导出当前备份，确认继续？`)) return;
    const previous = state;
    state = next;
    try {
      await save();
    } catch (error) {
      state = previous;
      throw error;
    }
    dropAllDrafts();
    render();
    toast('备份已恢复');
  } catch (error) {
    toast(error.message);
  } finally {
    input.value = '';
  }
}

async function clearAll() {
  if (!confirm('确定清空所有本地个人数据？请先导出备份。')) return;
  const previous = state;
  state = initial();
  try {
    await save();
    dropAllDrafts();
    saveFailed = false;
    render();
    toast('已清空本机数据');
  } catch {
    state = previous;
  }
}

function aiPreview(mode, payload, onDraft) {
  modal('AI 发送预览', `<p class="notice">以下内容会发送至本地服务端和 DeepSeek。请删除个人及第三方联系方式。每次请求消耗额度，失败也可能计费。</p>
    <pre class="preview">${esc(mode === 'jd_extract' ? payload.text : payload.answer)}</pre>
    <label class="check"><input id="ai-consent" type="checkbox">我同意仅发送上述内容</label>
    <button type="button" id="send-ai" class="btn btn-primary">发送一次请求</button>
    <p id="ai-result" class="muted small" role="status"></p>`, () => {}, 'ai');
  $('#form button[type="submit"]').hidden = true;
  $('#send-ai').onclick = async () => {
    if (!$('#ai-consent').checked) {
      $('#ai-result').textContent = '请先确认发送内容';
      return;
    }
    const button = $('#send-ai');
    button.disabled = true;
    try {
      const token = sessionStorage.getItem('jobpath-invite') || '';
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({ mode, payload, consentVersion: '2026-10-16-v1' }),
        signal: AbortSignal.timeout(25000)
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.message || 'AI 不可用，请继续手动编辑');
      $('#modal').close();
      onDraft(data.data);
    } catch (error) {
      $('#ai-result').textContent = `${error.name === 'TimeoutError' ? '请求超时，可能已占用额度' : error.message}。原文已保留，可关闭此窗口使用手动入口。`;
    } finally {
      button.textContent = '本次请求已结束（不会自动重试）';
    }
  };
}

/* ---------- bindings ---------- */

function applyJobFilter() {
  const query = ($('#job-search')?.value || '').trim().toLowerCase();
  const direction = $('#job-direction')?.value || '';
  let shown = 0;
  document.querySelectorAll('[data-job-card]').forEach((card) => {
    const text = card.dataset.search || '';
    const visible = (!query || text.includes(query)) && (!direction || card.dataset.direction === direction);
    card.hidden = !visible;
    if (visible) shown += 1;
  });
  const empty = $('#job-empty');
  if (empty) empty.hidden = shown > 0;
}

function bind() {
  document.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      const action = actions[element.dataset.action];
      if (!action) return;
      const result = action();
      if (result?.catch) result.catch((error) => toast(error.message));
    });
  });
  document.querySelectorAll('[data-scroll]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.getElementById(element.dataset.scroll);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target?.focus?.({ preventScroll: true });
    });
  });
  document.querySelectorAll('[data-target-job]').forEach((element) => {
    element.addEventListener('click', () => setTarget(element.dataset.targetJob));
  });
  document.querySelectorAll('[data-target-public]').forEach((element) => {
    element.addEventListener('click', () => targetPublic(element.dataset.targetPublic));
  });
  document.querySelectorAll('[data-save-public]').forEach((element) => {
    element.addEventListener('click', () => savePublic(element.dataset.savePublic));
  });
  document.querySelectorAll('[data-edit-job]').forEach((element) => {
    element.addEventListener('click', () => {
      const job = state.jobs.find((item) => item.id === element.dataset.editJob);
      if (job) editJob(job);
    });
  });
  document.querySelectorAll('[data-apply-job]').forEach((element) => {
    element.addEventListener('click', () => {
      const job = state.jobs.find((item) => item.id === element.dataset.applyJob);
      if (!job) return;
      if (state.applications.some((application) => application.jobId === job.id)) {
        toast('该岗位已有台账记录');
        return;
      }
      application(job);
    });
  });
  document.querySelectorAll('[data-task]').forEach((element) => {
    element.addEventListener('click', () => {
      const task = state.tasks.find((item) => item.id === element.dataset.task);
      if (task) taskModal(task);
    });
  });
  document.querySelectorAll('[data-stage]').forEach((element) => {
    const index = Number(element.dataset.stage);
    element.value = state.applications[index]?.stage || element.value;
    element.addEventListener('change', () => stageDialog(index, element.value));
  });
  document.querySelectorAll('[data-editapp]').forEach((element) => {
    element.addEventListener('click', () => application(null, Number(element.dataset.editapp)));
  });
  document.querySelectorAll('[data-round]').forEach((element) => {
    element.addEventListener('click', () => {
      const index = Number(element.dataset.round);
      editRound(index, element.dataset.roundIndex === undefined ? undefined : Number(element.dataset.roundIndex));
    });
  });
  document.querySelectorAll('[data-offer]').forEach((element) => {
    element.addEventListener('click', () => {
      const application = state.applications[Number(element.dataset.offer)];
      if (!application) return;
      const body = `<p class="notice">只记录本人确认的条件，不自动排名、不判断合同。</p>${offerFields.map(([key, label]) => key === 'deadline'
        ? `<label class="field"><span>${esc(label)}</span><input type="date" name="${key}" value="${esc(application.offer?.[key] || '')}"></label>`
        : `<label class="field"><span>${esc(label)}</span><textarea name="${key}" maxlength="2000" placeholder="未知请留空">${esc(application.offer?.[key] || '')}</textarea></label>`).join('')}`;
      modal(`Offer 条件 / ${application.title}`, body, (data) => {
        const offer = Object.fromEntries(offerFields.map(([key]) => [key, String(data.get(key) || '').trim()]));
        validateOffer(offer);
        application.offer = offer;
        event('offer_updated', application.id || application.title);
      }, `offer:${application.id || element.dataset.offer}`);
    });
  });
  document.querySelectorAll('[data-answer]').forEach((textarea) => {
    textarea.addEventListener('input', () => saveInline(`answer-${textarea.dataset.answer}`, textarea.value));
  });
  document.querySelectorAll('[data-check]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      state.checks ??= {};
      state.checks[checkbox.dataset.check] = checkbox.checked;
      save().catch(() => {});
    });
  });
  document.querySelectorAll('[data-ai-answer]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.aiAnswer);
      const textarea = document.querySelector(`[data-answer="${index}"]`);
      aiPreview('answer_feedback', { questionId: `q${index + 1}`, answer: textarea.value }, async (data) => {
        state.feedback ??= {};
        state.feedback[index] = { data, generatedBy: 'AI', generatedAt: new Date().toISOString(), needsReview: true };
        await save();
        render();
      });
    });
  });
  const offer = $('#offer');
  if (offer) offer.addEventListener('change', () => saveInline('legacy-offer', offer.value));
  const importInput = $('#importfile');
  if (importInput) importInput.addEventListener('change', importFile);
  const search = $('#job-search');
  if (search) search.addEventListener('input', applyJobFilter);
  const direction = $('#job-direction');
  if (direction) direction.addEventListener('change', applyJobFilter);
  const saveInvite = $('#save-invite');
  if (saveInvite) {
    saveInvite.addEventListener('click', async () => {
      const token = String($('#invite').value || '').trim();
      sessionStorage.setItem('jobpath-invite', token);
      try {
        const response = await fetch('/api/quota', { headers: { Authorization: `Bearer ${token}` } });
        const quota = await response.json();
        $('#quota-status').textContent = response.ok
          ? `今日剩余 ${quota.dailyRemaining} 次 / 窗口 ${quota.windowRemaining} 次 · ${quota.resetTimezone} 重置`
          : quota.message || '邀请无效';
      } catch {
        $('#quota-status').textContent = '无法查询；手动功能不受影响';
      }
    });
  }
  const clearInvite = $('#clear-invite');
  if (clearInvite) {
    clearInvite.addEventListener('click', () => {
      sessionStorage.removeItem('jobpath-invite');
      $('#invite').value = '';
      $('#quota-status').textContent = '已清除会话邀请';
    });
  }
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.job-card, .focus-card').forEach((card) => {
      card.addEventListener('pointermove', (pointer) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${pointer.clientX - rect.left}px`);
        card.style.setProperty('--my', `${pointer.clientY - rect.top}px`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }
}

const actions = {
  profile,
  application: () => application(targetJob()),
  jd: addJob,
  plan: openPlan,
  review: openReview,
  export: exportBackup,
  import: () => $('#importfile')?.click(),
  clear: clearAll
};

window.addEventListener('beforeunload', (event) => {
  if (editSession?.dirty() || pendingSaves || saveFailed) {
    editSession?.capture();
    event.preventDefault();
    event.returnValue = '';
  }
});

window.addEventListener('hashchange', () => {
  const next = routeFromHash();
  if (!next) {
    history.replaceState(null, '', `#/${page}`);
    return;
  }
  page = next;
  render();
});

window.addEventListener('scroll', updateScrollRail, { passive: true });
window.addEventListener('resize', updateScrollRail);

/* ---------- boot ---------- */

try {
  db = await openDatabase();
  const saved = await readRecord(db);
  if (saved) {
    state = validateBackup({ app: 'jobpath', schemaVersion: 1, data: saved });
    revision = state.revision || 0;
  }
  saveText = '已保存到此设备';
} catch {
  saveText = '临时模式 · 未持久保存';
  saveFailed = true;
}

try {
  const response = await fetch('/api/health', { cache: 'no-store' });
  if (response.ok) {
    const health = await response.json();
    aiEnabled = Boolean(health.aiEnabled);
    appVersion = health.version || appVersion;
  }
} catch {
  aiEnabled = false;
}

const initialPage = routeFromHash() || (state.targetId ? 'prepare' : 'opportunities');
if (!routeFromHash()) history.replaceState(null, '', `#/${initialPage}`);
page = initialPage;
render();

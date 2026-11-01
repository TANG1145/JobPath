import { categories } from './opportunity-categories.js';
import { jobsForCategory } from './recruitment-catalog.js';
import { expandedResources } from './learning-resources.js';
import { validateBackup } from './domain.js';
import { writeRevision } from './storage.js';
import { fromRecruitment } from './saved-records.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const palette = ['#f2a33c', '#8ed6a5', '#d9c48a', '#e28b76', '#b9c7a1', '#f2b45c', '#c9b79c', '#e0996a', '#9fcf9a', '#d6b36a', '#d98f8f', '#a9c9b4', '#9fbfae', '#d5c28a', '#d9a76a', '#c7b18a', '#e6b8a0', '#b7c79a'];
categories.forEach((category, index) => { category.accent = palette[index % palette.length]; });

const searchCategories = (query) => {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return categories;
  return categories.filter((category) => [category.title, category.code, category.description, ...category.keywords, ...category.focus].join(' ').toLowerCase().includes(needle));
};

const $ = (selector) => document.querySelector(selector);
const field = $('#orb-field');
const layer = $('#orb-layer');
const list = $('#explore-list');
const detail = $('#category-detail');
const search = $('#explore-search');
const toggle = $('#view-toggle');
const randomButton = $('#random-orb');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const pointer = { x: 0, y: 0, inside: false };
const orbs = [];
let selectedId = '';
let detailView = 'direction';
let view = 'field';
let grid = false;
let dragging = null;
let layoutRect = { width: 0, height: 0 };
let lastFrame = 0;
let frameRequest = 0;
let currentJobId = '';

const countFor = (id) => jobsForCategory(id).length;
const resourcesFor = (id) => expandedResources.filter((resource) => resource.direction === id).length;
const currentCategory = () => categories.find((category) => category.id === selectedId);
const safeDate = (value) => String(value || '').slice(0, 10);
const safeSource = (value) => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
};
const statusBadge = (job) => (job.hiringStatus === 'open'
  ? '<span class="status-badge is-open">可投（核验时）</span>'
  : '<span class="status-badge is-pending">待核验</span>');

/* ---- 收藏 / 设为目标：与主应用共享 jobpath-v1 IndexedDB ---- */
let saveStore;            // undefined = 未加载；null = 不可用；object = { db, state, revision }
let saveLoading = null;
let saveQueue = Promise.resolve();

const initialData = () => ({ direction: 'web', hours: 8, tasks: [], jobs: [], applications: [], answers: ['', '', '', '', ''], ratings: {} });
const openJobDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('jobpath-v1', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('state');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const readJobDb = (db) => new Promise((resolve, reject) => {
  const request = db.transaction('state').objectStore('state').get('main');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
function loadSaveStore() {
  if (saveStore !== undefined) return Promise.resolve(saveStore);
  if (!saveLoading) {
    saveLoading = (async () => {
      try {
        const db = await openJobDb();
        const saved = await readJobDb(db);
        const state = saved ? validateBackup({ app: 'jobpath', schemaVersion: 1, data: saved }) : initialData();
        saveStore = { db, state, revision: state.revision || 0 };
      } catch {
        saveStore = null;
      }
      saveLoading = null;
      return saveStore;
    })();
  }
  return saveLoading;
}
function persistSave() {
  const snapshot = structuredClone(saveStore.state);
  const operation = saveQueue.then(async () => {
    validateBackup({ app: 'jobpath', schemaVersion: 1, data: snapshot });
    saveStore.revision = await writeRevision(saveStore.db, snapshot, saveStore.revision);
    saveStore.state.revision = saveStore.revision;
  });
  saveQueue = operation.catch(() => {});
  return operation;
}
async function mutateSave(change) {
  const store = await loadSaveStore();
  if (!store) throw new Error('本地存储不可用（隐私模式或数据库被禁用），收藏未保存');
  const before = structuredClone(store.state);
  change(store.state);
  try {
    await persistSave();
  } catch (error) {
    store.state = before;
    throw error;
  }
}
const currentJob = () => {
  const category = currentCategory();
  return category ? jobsForCategory(category.id).find((job) => job.id === currentJobId) : null;
};
const savedJobFor = (jobId) => {
  if (!saveStore) return null;
  return saveStore.state.jobs.find((job) => job.publicId === jobId && !job.removed) || null;
};
const sanitizeJob = (job, category) => ({ ...job, category: category.id, source: safeSource(job.source) });
function setSaveStatus(html) {
  const status = $('#job-save-status');
  if (status) status.innerHTML = html;
}
async function toggleSaveJob(job, category) {
  const store = await loadSaveStore();
  if (!store) {
    setSaveStatus('本地存储不可用（隐私模式或数据库被禁用）；仅可查看，未保存。');
    return;
  }
  const existing = store.state.jobs.find((item) => item.publicId === job.id);
  const wasSaved = Boolean(existing && !existing.removed);
  try {
    await mutateSave((state) => {
      if (wasSaved) {
        existing.removed = true;
        if (state.targetId === existing.id) {
          state.targetId = null;
          state.target = '';
        }
      } else if (existing) {
        existing.removed = false;
        existing.archived = false;
        existing.savedAt = existing.updatedAt = Date.now();
      } else {
        state.jobs.push(fromRecruitment(sanitizeJob(job, category)));
      }
    });
    updateJobActions();
    setSaveStatus(wasSaved
      ? '已取消收藏。既有台账与任务会保留；若此前设为目标，已同步解除。'
      : '已收藏到本机。可在 <a href="/">机会页「我的理想 JD」</a> 查看与整理要求。');
  } catch (error) {
    setSaveStatus(`保存失败：${esc(error.message)}`);
  }
}
async function setTargetJob(job, category) {
  const store = await loadSaveStore();
  if (!store) {
    setSaveStatus('本地存储不可用（隐私模式或数据库被禁用）；未设置目标。');
    return;
  }
  try {
    await mutateSave((state) => {
      let saved = state.jobs.find((item) => item.publicId === job.id && !item.removed);
      if (!saved) {
        const existing = state.jobs.find((item) => item.publicId === job.id);
        if (existing) {
          existing.removed = false;
          existing.archived = false;
          existing.savedAt = existing.updatedAt = Date.now();
          saved = existing;
        } else {
          saved = fromRecruitment(sanitizeJob(job, category));
          state.jobs.push(saved);
        }
      }
      if (state.activePlan?.jobId) {
        state.targetSchedules ??= {};
        state.targetSchedules[state.activePlan.jobId] = structuredClone(state.activePlan);
      }
      state.targetId = saved.id;
      state.target = saved.title;
      state.direction = saved.direction;
      state.activePlan = state.targetSchedules?.[saved.id] || null;
    });
    updateJobActions();
    setSaveStatus('已设为目标岗位。备战页的当前目标、学习计划与时间安排都会围绕它展开，可 <a href="/">回备战控制台</a> 查看。');
  } catch (error) {
    setSaveStatus(`保存失败：${esc(error.message)}`);
  }
}
function updateJobActions() {
  const saveButton = $('[data-save-job]');
  const targetButton = $('[data-target-job]');
  if (!saveButton || !targetButton) return;
  const job = currentJob();
  if (!job) return;
  const saved = savedJobFor(job.id);
  const target = Boolean(saved && saveStore && saveStore.state.targetId === saved.id);
  saveButton.textContent = saved ? '已收藏' : '收藏';
  saveButton.classList.toggle('is-saved', Boolean(saved));
  saveButton.setAttribute('aria-pressed', String(Boolean(saved)));
  targetButton.textContent = target ? '当前目标' : '设为目标';
  targetButton.disabled = Boolean(target);
}

function renderOrb(orb) {
  if (grid) return;
  orb.element.style.transform = `translate3d(${orb.x - orb.size / 2}px, ${orb.y - orb.size / 2}px, 0)`;
}

function createOrbs() {
  categories.forEach((category, index) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'orb';
    element.dataset.id = category.id;
    element.style.setProperty('--accent', category.accent);
    element.innerHTML = `<span class="orb-plasma"></span><span class="orb-strands" data-strands-host="${esc(category.id)}" aria-hidden="true"></span><span class="orb-gloss"></span><span class="orb-label">${esc(category.title)}</span><span class="orb-code">${esc(category.code)}</span>`;
    element.setAttribute('aria-pressed', 'false');
    element.setAttribute('aria-label', `${category.title}，${category.code}，点击查看方向`);
    const orb = {
      category,
      element,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 104,
      pointerId: null,
      dragging: false,
      hovered: false,
      moved: 0,
      index
    };
    orbs.push(orb);
    element.addEventListener('click', () => {
      if (element.dataset.dragged === 'true') {
        element.dataset.dragged = 'false';
        return;
      }
      selectCategory(category.id, true);
    });
    element.addEventListener('pointerdown', (event) => beginDrag(event, element, category.id));
    element.addEventListener('pointerenter', () => {
      orb.hovered = true;
      orb.vx = 0;
      orb.vy = 0;
    });
    element.addEventListener('pointerleave', () => { orb.hovered = false; });
    layer.append(element);
  });
}

function beginDrag(event, element, id) {
  if (grid || view !== 'field' || event.button !== 0) return;
  const orb = orbs.find((item) => item.category.id === id);
  if (!orb) return;
  event.preventDefault();
  orb.dragging = true;
  orb.pointerId = event.pointerId;
  orb.moved = 0;
  orb.vx = 0;
  orb.vy = 0;
  orb.element.setPointerCapture?.(event.pointerId);
  dragging = orb;
}

function endDrag(event) {
  if (!dragging) return;
  if (event && dragging.pointerId !== event.pointerId) return;
  dragging.dragging = false;
  dragging.element.dataset.dragged = dragging.moved > 5 ? 'true' : 'false';
  dragging.element.releasePointerCapture?.(dragging.pointerId);
  dragging = null;
}

function renderDetail(category) {
  const jobs = jobsForCategory(category.id);
  const count = jobs.length;
  const resources = resourcesFor(category.id);
  const samples = jobs.slice(0, 2).map((job) => `<li><strong>${esc(job.company || '未注明公司')}</strong> · ${esc(job.title)}<span>${esc(job.city || '城市待确认')} · ${esc(job.intent || '类型待确认')}</span></li>`).join('');
  detailView = 'direction';
  detail.innerHTML = `<p class="eyebrow">Selected / ${esc(category.code)}</p>
    <p class="category-code">${esc(category.code)}</p>
    <h2>${esc(category.title)}</h2>
    <p class="category-copy">${esc(category.description)}</p>
    <ul class="category-focus">${category.focus.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="category-count"><strong>${count}</strong><span>条招聘记录 · ${resources} 条新增资源</span></div>
    ${samples ? `<ul class="category-samples">${samples}</ul>` : ''}
    <p class="empty-category">招聘记录包含待核验状态；它不是实时在招保证，也不会自动替你做投递决定。</p>
    <div class="keyword-row">${category.keywords.slice(0, 8).map((keyword) => `<span>${esc(keyword)}</span>`).join('')}</div>
    <div class="category-actions">
      <button class="btn btn-primary btn-sm" type="button" data-jobs-view="${esc(category.id)}">查看 ${count} 条岗位 →</button>
      <button class="btn btn-sm" type="button" id="copy-keywords">复制关键词</button>
    </div>`;
}

function renderJobList(category) {
  const jobs = jobsForCategory(category.id)
    .slice()
    .sort((a, b) => (a.hiringStatus === 'open' ? 0 : 1) - (b.hiringStatus === 'open' ? 0 : 1));
  detailView = 'jobs';
  detail.innerHTML = `<div class="back-row">
      <button class="btn btn-ghost btn-sm" type="button" data-back-direction="${esc(category.id)}">← ${esc(category.title)}</button>
      <span class="eyebrow">Jobs / ${jobs.length}</span>
    </div>
    <h2>${esc(category.title)} · ${jobs.length} 条招聘记录</h2>
    <p class="empty-category">包含待核验记录；状态与资格以官网为准，本页不自动投递。</p>
    ${jobs.length
      ? `<div class="job-list-panel">${jobs.map((job) => `<button type="button" class="job-row" data-job-id="${esc(job.id)}">
          <span class="job-row-head"><strong>${esc(job.company || '未注明公司')} · ${esc(job.title)}</strong>${statusBadge(job)}</span>
          <span class="job-row-meta">${esc(job.city || '城市待确认')} · ${esc(job.intent || '类型待确认')} · 核验 ${safeDate(job.checkedAt)}</span>
          <span class="job-row-verification">${esc(job.verification || '')}</span>
        </button>`).join('')}</div>`
      : '<p class="empty-category">这个方向暂时没有招聘记录；回到机会页，粘贴一份真实 JD 先当目标。</p>'}
    <div class="category-actions"><a class="btn btn-sm" href="/">回机会页</a></div>`;
}

function renderJobDetail(job, category) {
  const source = safeSource(job.source);
  const experience = String(job.experience || '').trim();
  const eligibility = String(job.eligibility || '').trim();
  detailView = 'job';
  currentJobId = job.id;
  detail.innerHTML = `<div class="back-row">
      <button class="btn btn-ghost btn-sm" type="button" data-back-jobs="${esc(category.id)}">← 岗位列表</button>
      <span class="eyebrow">Job / ${esc(job.id)}</span>
    </div>
    <h2>${esc(job.title)}</h2>
    <p class="job-detail-company">${esc(job.company || '未注明公司')} · ${esc(job.city || '城市待确认')} · ${esc(job.intent || '类型待确认')}</p>
    <div class="job-meta-grid">
      <div><span>状态</span>${statusBadge(job)}</div>
      <div><span>来源更新</span>${esc(safeDate(job.sourceUpdated) || '未记录')}</div>
      <div><span>核验时间</span>${esc(safeDate(job.checkedAt))}</div>
    </div>
    ${eligibility ? `<section class="job-section"><h3>资格与要求</h3><p class="prewrap">${esc(eligibility)}</p></section>` : ''}
    ${experience && experience !== eligibility ? `<section class="job-section"><h3>经验与备注</h3><p class="prewrap">${esc(experience)}</p></section>` : ''}
    <section class="job-section"><h3>岗位摘要</h3><p class="prewrap">${esc(job.summary || '官方来源未提供摘要；请打开原站核对。')}</p></section>
    <section class="job-section"><h3>核验说明</h3><p class="job-verification">${esc(job.verification || '未记录')}</p></section>
    <div class="job-actions">
      <button class="btn btn-sm" type="button" data-save-job="${esc(job.id)}">收藏</button>
      <button class="btn btn-sm" type="button" data-target-job="${esc(job.id)}">设为目标</button>
      <span class="job-actions-hint">保存到本机「我的理想 JD」，不会自动投递</span>
    </div>
    <div class="category-actions">
      ${source ? `<a class="btn btn-primary btn-sm" href="${esc(source)}" target="_blank" rel="noopener noreferrer">官方来源 ↗</a>` : ''}
      <button class="btn btn-sm" type="button" data-back-jobs="${esc(category.id)}">返回列表</button>
    </div>
    <p class="job-save-status" id="job-save-status" role="status" aria-live="polite"></p>
    <p class="empty-category">薪资、截止日期与最新在招状态以官网为准；本页不会替你投递或自动推进阶段。</p>`;
  updateJobActions();
}

function onDetailClick(event) {
  const jobsButton = event.target.closest('[data-jobs-view]');
  if (jobsButton) {
    const category = categories.find((item) => item.id === jobsButton.dataset.jobsView);
    if (category) {
      renderJobList(category);
      if (grid) detail.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
    return;
  }
  const jobRow = event.target.closest('[data-job-id]');
  if (jobRow) {
    const category = currentCategory();
    const job = category ? jobsForCategory(category.id).find((item) => item.id === jobRow.dataset.jobId) : null;
    if (job) {
      renderJobDetail(job, category);
      if (grid) detail.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
    return;
  }
  const saveJobButton = event.target.closest('[data-save-job]');
  if (saveJobButton) {
    const job = currentJob();
    const category = currentCategory();
    if (job && category) toggleSaveJob(job, category);
    return;
  }
  const targetJobButton = event.target.closest('[data-target-job]');
  if (targetJobButton) {
    const job = currentJob();
    const category = currentCategory();
    if (job && category) setTargetJob(job, category);
    return;
  }
  const backDirection = event.target.closest('[data-back-direction]');
  if (backDirection) {
    const category = categories.find((item) => item.id === backDirection.dataset.backDirection);
    if (category) renderDetail(category);
    return;
  }
  const backJobs = event.target.closest('[data-back-jobs]');
  if (backJobs) {
    const category = categories.find((item) => item.id === backJobs.dataset.backJobs);
    if (category) renderJobList(category);
    return;
  }
  if (event.target.closest('#copy-keywords')) {
    const category = currentCategory();
    if (!category) return;
    const button = $('#copy-keywords');
    navigator.clipboard.writeText(category.keywords.join(' ')).then(() => {
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = '复制关键词'; }, 1600);
    }).catch(() => { button.textContent = '复制失败'; });
  }
}

function selectCategory(id, { scroll = false } = {}) {
  const category = categories.find((item) => item.id === id);
  if (!category) return;
  selectedId = id;
  orbs.forEach((orb) => {
    const selected = orb.category.id === id;
    orb.element.classList.toggle('is-selected', selected);
    orb.element.setAttribute('aria-pressed', String(selected));
  });
  list.querySelectorAll('[data-id]').forEach((item) => item.classList.toggle('is-selected', item.dataset.id === id));
  renderDetail(category);
  if (scroll && grid) detail.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
}

function layout() {
  if (!field || view === 'list') return;
  const rect = field.getBoundingClientRect();
  layoutRect = { width: rect.width, height: rect.height };
  grid = rect.width < 760;
  field.classList.toggle('is-grid', grid);
  if (grid) {
    orbs.forEach((orb) => {
      orb.element.style.width = '';
      orb.element.style.height = '';
      orb.element.style.transform = '';
    });
    return;
  }
  const columns = rect.width < 980 ? 5 : 6;
  const rows = Math.ceil(orbs.length / columns);
  const base = Math.max(64, Math.min(106, Math.min((rect.width / columns) * 0.62, (rect.height / rows) * 0.56)));
  orbs.forEach((orb, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const jitterX = Math.sin(index * 12.9898) * (rect.width / columns) * 0.16;
    const jitterY = Math.cos(index * 78.233) * (rect.height / rows) * 0.12;
    orb.size = Math.round(base * (index % 4 === 0 ? 1.06 : 0.96));
    orb.x = Math.min(rect.width - orb.size / 2 - 8, Math.max(orb.size / 2 + 8, (column + 0.5) / columns * rect.width + jitterX));
    orb.y = Math.min(rect.height - orb.size / 2 - 8, Math.max(orb.size / 2 + 8, (row + 0.5) / rows * rect.height + jitterY));
    orb.vx = (Math.random() - 0.5) * 0.09;
    orb.vy = (Math.random() - 0.5) * 0.09;
    orb.element.style.width = `${orb.size}px`;
    orb.element.style.height = `${orb.size}px`;
    renderOrb(orb);
  });
}

function step(dt) {
  const margin = 8;
  const width = layoutRect.width;
  const height = layoutRect.height;
  for (const orb of orbs) {
    if (orb.dragging || orb.hovered) continue;
    orb.vx *= 0.992;
    orb.vy *= 0.992;
    if (pointer.inside && !grid) {
      const dx = orb.x - pointer.x;
      const dy = orb.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < 150) {
        const force = ((150 - distance) / 150) * 0.045;
        orb.vx += (dx / distance) * force;
        orb.vy += (dy / distance) * force;
      }
    }
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;
    const minX = orb.size / 2 + margin;
    const maxX = width - orb.size / 2 - margin;
    const minY = orb.size / 2 + margin;
    const maxY = height - orb.size / 2 - margin;
    if (orb.x < minX) { orb.x = minX; orb.vx = Math.abs(orb.vx) * 0.72; }
    if (orb.x > maxX) { orb.x = maxX; orb.vx = -Math.abs(orb.vx) * 0.72; }
    if (orb.y < minY) { orb.y = minY; orb.vy = Math.abs(orb.vy) * 0.72; }
    if (orb.y > maxY) { orb.y = maxY; orb.vy = -Math.abs(orb.vy) * 0.72; }
  }

  for (let i = 0; i < orbs.length; i += 1) {
    for (let j = i + 1; j < orbs.length; j += 1) {
      const a = orbs[i];
      const b = orbs[j];
      if (a.hovered || b.hovered || a.dragging || b.dragging) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minimum = (a.size + b.size) / 2 + 4;
      if (distance >= minimum) continue;
      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = (minimum - distance) / 2;
      if (!a.dragging) { a.x -= nx * overlap; a.y -= ny * overlap; }
      if (!b.dragging) { b.x += nx * overlap; b.y += ny * overlap; }
      const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relative < 0) {
        a.vx += nx * relative * 0.5;
        a.vy += ny * relative * 0.5;
        b.vx -= nx * relative * 0.5;
        b.vy -= ny * relative * 0.5;
      }
    }
  }

  for (const orb of orbs) renderOrb(orb);
}

function frame(now) {
  frameRequest = requestAnimationFrame(frame);
  if (reducedMotion.matches || grid || view !== 'field' || document.hidden) return;
  const dt = Math.min(2.2, Math.max(0.2, (now - lastFrame) / 16.67));
  lastFrame = now;
  step(dt);
}

function buildList() {
  list.innerHTML = categories.map((category) => `<button class="list-item" type="button" data-id="${esc(category.id)}" style="--accent:${esc(category.accent)}">
    <span class="list-orb"></span>
    <span class="list-copy"><strong>${esc(category.title)}</strong><small>${esc(category.code)} · ${countFor(category.id)} 条岗位</small></span>
  </button>`).join('');
  list.querySelectorAll('[data-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectCategory(button.dataset.id, { scroll: true });
      if (view === 'list') detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

function applySearch() {  const matched = new Set(searchCategories(search.value).map((category) => category.id));
  orbs.forEach((orb) => {
    const visible = matched.has(orb.category.id);
    orb.element.hidden = !visible;
    orb.element.classList.toggle('is-dim', !visible);
  });
  list.querySelectorAll('[data-id]').forEach((button) => {
    button.hidden = !matched.has(button.dataset.id);
  });
  const label = $('.field-hud > span');
  if (label) label.textContent = `FIELD / ${String(matched.size).padStart(2, '0')} SIGNALS`;
  if (matched.size === 0) {
    if (!list.querySelector('.list-empty')) {
      const empty = document.createElement('p');
      empty.className = 'list-empty';
      empty.textContent = '没有匹配的方向。试试搜索“前端”“数据”或“设计”。';
      list.append(empty);
    }
  } else {
    list.querySelector('.list-empty')?.remove();
  }
}

function setView(next) {
  view = next;
  const listMode = view === 'list';
  field.hidden = listMode;
  list.hidden = !listMode;
  toggle.textContent = listMode ? '球体视图' : '列表视图';
  toggle.setAttribute('aria-pressed', String(listMode));
  if (!listMode) {
    layout();
    lastFrame = performance.now();
  }
}

let strandsCleanup = null;
async function mountStrands() {
  if (reducedMotion.matches || window.innerWidth < 760) return;
  try {
    const module = await import('/public/visuals/strands.js');
    const hosts = [...document.querySelectorAll('[data-strands-host]')];
    strandsCleanup = module.mountField(hosts);
    orbs.forEach((orb) => orb.element.classList.add('has-strands'));
  } catch {
    // The CSS orb is the fallback: no WebGL, no React/matter bundle.
    strandsCleanup = null;
  }
}

createOrbs();
buildList();
layout();
selectCategory('web');
frame(performance.now());
mountStrands();
loadSaveStore().then(() => { if (detailView === 'job') updateJobActions(); });
window.addEventListener('resize', layout);
if ('ResizeObserver' in window) new ResizeObserver(layout).observe(field);

field.addEventListener('pointermove', (event) => {
  const rect = field.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
  pointer.inside = true;
  if (!dragging) return;
  dragging.moved += Math.hypot(event.movementX || 0, event.movementY || 0);
  const size = dragging.size / 2;
  dragging.x = Math.min(rect.width - size - 8, Math.max(size + 8, pointer.x));
  dragging.y = Math.min(rect.height - size - 8, Math.max(size + 8, pointer.y));
  dragging.vx = 0;
  dragging.vy = 0;
  renderOrb(dragging);
});
field.addEventListener('pointerleave', () => {
  pointer.inside = false;
  if (dragging) {
    dragging.dragging = false;
    dragging.element.dataset.dragged = 'true';
    dragging = null;
  }
});
window.addEventListener('pointerup', endDrag);

search.addEventListener('input', applySearch);
search.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    search.value = '';
    applySearch();
    search.blur();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
});

toggle.addEventListener('click', () => setView(view === 'list' ? 'field' : 'list'));
detail.addEventListener('click', onDetailClick);
randomButton.addEventListener('click', () => {
  const visible = orbs.filter((orb) => !orb.element.hidden);
  const pick = visible[Math.floor(Math.random() * visible.length)] || orbs[0];
  if (pick) {
    selectCategory(pick.category.id, { scroll: true });
    if (view === 'list') setView('field');
  }
});

window.addEventListener('pagehide', () => {
  cancelAnimationFrame(frameRequest);
  strandsCleanup?.();
}, { once: true });

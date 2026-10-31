import { categories, searchCategories } from './explore-data.js';
import { publicJobs, jobState } from './jobs.js';
import { esc } from './ui/components.js';

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
let view = 'field';
let grid = false;
let dragging = null;
let layoutRect = { width: 0, height: 0 };
let lastFrame = 0;
let frameRequest = 0;

const countFor = (id) => publicJobs.filter((job) => job.direction === id && jobState(job).current).length;

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
    element.innerHTML = `<span class="orb-plasma"></span><span class="orb-gloss"></span><span class="orb-label">${esc(category.title)}</span><span class="orb-code">${esc(category.code)}</span>`;
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
  const count = countFor(category.id);
  detail.innerHTML = `<p class="eyebrow">Selected / ${esc(category.code)}</p>
    <p class="category-code">${esc(category.code)}</p>
    <h2>${esc(category.title)}</h2>
    <p class="category-copy">${esc(category.description)}</p>
    <ul class="category-focus">${category.focus.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="category-count"><strong>${count}</strong><span>${count ? '条当前核验岗位' : '当前三方向目录暂未覆盖'}</span></div>
    <p class="empty-category">${count ? '这只是方向入口，不代表录用概率；具体岗位仍需打开官方来源核验。' : '可以回到机会页，直接粘贴一份真实 JD，把它变成你此刻的目标岗位。'}</p>
    <div class="keyword-row">${category.keywords.slice(0, 8).map((keyword) => `<span>${esc(keyword)}</span>`).join('')}</div>
    <div class="category-actions">
      <a class="btn btn-primary btn-sm" href="/#/opportunities">${count ? '去机会页看看' : '去粘贴 JD'}</a>
      <button class="btn btn-sm" type="button" id="copy-keywords">复制关键词</button>
    </div>`;
  const copy = $('#copy-keywords');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(category.keywords.join(' '));
      copy.textContent = '已复制';
      setTimeout(() => { copy.textContent = '复制关键词'; }, 1600);
    } catch {
      copy.textContent = '复制失败';
    }
  });
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

function applySearch() {
  const matched = new Set(searchCategories(search.value).map((category) => category.id));
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

createOrbs();
buildList();
layout();
selectCategory('web');
frame(performance.now());
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
randomButton.addEventListener('click', () => {
  const visible = orbs.filter((orb) => !orb.element.hidden);
  const pick = visible[Math.floor(Math.random() * visible.length)] || orbs[0];
  if (pick) {
    selectCategory(pick.category.id, { scroll: true });
    if (view === 'list') setView('field');
  }
});

window.addEventListener('pagehide', () => cancelAnimationFrame(frameRequest), { once: true });

// Small, dependency-free render helpers. Keep these pure: no state, no DOM.
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => entities[char]);

export function badge(label, tone = 'neutral') {
  return `<span class="badge badge-${tone}">${esc(label)}</span>`;
}

export function meter(value, max, label = '') {
  const safeMax = Number(max) > 0 ? Number(max) : 1;
  const pct = Math.max(0, Math.min(100, Math.round((Number(value) / safeMax) * 100)));
  return `<div class="meter" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${esc(max)}" aria-valuenow="${esc(value)}"><i style="width:${pct}%"></i></div>`;
}

export function card({ eyebrow = '', title = '', actions = '', body = '', className = '', id = '' } = {}) {
  const head = eyebrow || title || actions
    ? `<header class="card-head">
        <div class="card-title">
          ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
          ${title ? `<h2>${esc(title)}</h2>` : ''}
        </div>
        ${actions ? `<div class="card-actions">${actions}</div>` : ''}
      </header>`
    : '';
  return `<section class="card ${className}"${id ? ` id="${esc(id)}"` : ''}>${head}<div class="card-body">${body}</div></section>`;
}

export function emptyState(title, body, action = '') {
  return `<div class="empty">
    <span class="empty-mark" aria-hidden="true">◇</span>
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${action ? `<div class="empty-action">${action}</div>` : ''}
  </div>`;
}

export function kv(rows) {
  return `<dl class="kv">${rows.map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
}

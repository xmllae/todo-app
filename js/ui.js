/**
 * =================================================================
 * ui.js - 渲染函数（任务列表 / 看板 / 日历 / 仪表盘 / 统计）
 * =================================================================
 * 包含所有 UI 渲染逻辑：
 * - rCal / rT（核心列表渲染，含 taskHTML）
 * - rKanban（看板视图）
 * - renderTaskDash / initTaskDashReorder（仪表盘）
 * - focusTimer 相关
 * - rTpl（模板管理）
 * - rStats（统计）
 * - 优先级相关（颜色、徽章、轨道等）
 * - 自动归档检查
 * =================================================================
 */

// ─────────────────────────────────────────────
// ① 优先级颜色 & 徽章
// ─────────────────────────────────────────────

function hexToRgba(hex, a) {
  if (!hex || hex.length < 7) return 'rgba(0,0,0,' + a + ')';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function prioSubProgressVars(p) {
  const hex = prioColor(p) || '#eab308';
  if (!hex || hex.length < 7) return '--sub-track:rgba(234,179,8,.22);--sub-fill:linear-gradient(90deg,#fbbf24,#f59e0b)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '--sub-track:rgba(234,179,8,.22);--sub-fill:linear-gradient(90deg,#fbbf24,#f59e0b)';
  const dk    = document.body.classList.contains('dark');
  const track = dk ? 'rgba(' + r + ',' + g + ',' + b + ',.3)' : 'rgba(' + r + ',' + g + ',' + b + ',.15)';
  const r2    = Math.min(255, r + 20);
  const g2    = Math.min(255, g + 20);
  const b2    = Math.min(255, b + 20);
  const light = '#' + [r2, g2, b2].map(x => {
    const h = x.toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
  return '--sub-track:' + track + ';--sub-fill:linear-gradient(90deg,' + light + ',' + hex + ')';
}

function prioLabel(p) { return { high: '高', medium: '中', low: '低', normal: '中' }[p] || '中'; }
function prioColor(p) { return priorityColors[p] || '#94a3b8'; }
function prioPillLabel(p) { return { high: '高优先', medium: '中优先', low: '低优先', normal: '中优先' }[p] || '中优先'; }
function prioShortLabel(p) { return { high: '高', medium: '中', low: '低', normal: '中' }[p] || '中'; }

function prioBarTier(p) { return p === 'high' ? 'high' : 'low'; }

function prioPriorityBarHtml(p) {
  return '<div class="priority-bar priority-bar-spacer" aria-hidden="true"></div>';
}

function prioListRowTierClass(t) {
  if (t.archived || t.frozen) return '';
  if ((t.priority || 'medium') !== 'high') return '';
  return ' high';
}

function prioBadge(p, clickTid) {
  const cls    = 'tag prio-pill prio-' + (p || 'medium') + '-pill';
  const onclick = clickTid != null ? ' onclick="event.stopPropagation();cyclePriority(' + clickTid + ')" title="点击切换优先级"' : '';
  return '<span class="' + cls + '"' + onclick + '>' + prioPillLabel(p) + '</span>';
}

function prioRailHtml(priority, isArchived, isFrozen, clickTid) {
  if (isArchived) return prioRailHtmlFn(priority, true, false, null);
  if (isFrozen)   return prioRailHtmlFn(priority, false, true, null);
  return prioPriorityBarHtml(priority);
}

function prioRailHtmlFn(priority, isArchived, isFrozen, clickTid) {
  if (isArchived) return '<div class="task-prio-pill task-prio-pill--archived" title="已归档"><span class="task-prio-pill-txt">归档</span></div>';
  if (isFrozen)   return '<div class="task-prio-pill task-prio-pill--frozen" title="冷冻"><span class="task-prio-pill-txt">冻</span></div>';
  const p    = priority || 'medium';
  const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
  const tl   = prioPillLabel(p);
  const oc   = clickTid != null
    ? ' onclick="event.stopPropagation();cyclePriority(' + clickTid + ')" style="cursor:pointer" title="点击切换优先级（' + tl + '）"'
    : ' title="' + tl + '"';
  return '<div class="task-prio-pill prio-' + p + '" data-mode="' + mode + '"' + oc + '><span class="task-prio-pill-txt">' + prioShortLabel(p) + '</span></div>';
}

function prioListRail(t, isArchive) {
  if (isArchive) return prioRailHtmlFn(t.priority, true, false, null);
  if (t.frozen)  return prioRailHtmlFn(t.priority, false, true, null);
  return prioPriorityBarHtml(t.priority);
}

function syncPriorityColorsFromTemplates() {
  ['high'].forEach(k => {
    const id = priorityTemplateIds[k];
    const t  = PRIO_COLOR_TEMPLATES.find(x => x.id === id);
    if (t) priorityColors[k] = t.hi;
  });
}

function inferPrioTemplatesFromColors() {
  function nearestId(hex, key) {
    const fb = priorityTemplateIds[key] || 3;
    const h  = String(hex || '');
    if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return fb;
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return fb;
    let best = fb, bestD = 1e9;
    PRIO_COLOR_TEMPLATES.forEach(t => {
      const th = parseInt(t.hi.slice(1, 3), 16);
      const tg = parseInt(t.hi.slice(3, 5), 16);
      const tb = parseInt(t.hi.slice(5, 7), 16);
      const d  = (r - th) * (r - th) + (g - tg) * (g - tg) + (b - tb) * (b - tb);
      if (d < bestD) { bestD = d; best = t.id; }
    });
    return best;
  }
  ['high'].forEach(k => { priorityTemplateIds[k] = nearestId(priorityColors[k] || priorityColors.high, k); });
}

function getPrioStopsForPriority(key) {
  const id = priorityTemplateIds[key];
  const t  = PRIO_COLOR_TEMPLATES.find(x => x.id === id);
  if (t) return { edge: t.dark, hi: t.hi };
  return prioArcMetallicStops(priorityColors[key] || '#94a3b8');
}

function prioArcMetallicStops(hex) {
  const h = String(hex || '');
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return { edge: '#64748b', hi: '#e2e8f0' };
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return { edge: '#64748b', hi: '#e2e8f0' };
  const L = (a, c, t) => {
    const x = Math.round(a + (c - a) * t);
    const s = x.toString(16);
    return s.length === 1 ? '0' + s : s;
  };
  const edge = '#' + L(r, 0, .36) + L(g, 0, .36) + L(b, 0, .36);
  const hi   = '#' + L(r, 255, .52) + L(g, 255, .52) + L(b, 255, .52);
  return { edge, hi };
}

function prioArcSvgHtmlStops(edge, hi) {
  if (!window._prioArcGid) window._prioArcGid = 0;
  const gid = 'prioArcMG' + (++window._prioArcGid);
  return '<svg width="15" height="48" viewBox="-2 0 19 48" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + edge + '"/><stop offset="27.5%" stop-color="' + hi + '"/><stop offset="72.5%" stop-color="' + hi + '"/><stop offset="100%" stop-color="' + edge + '"/></linearGradient></defs><path d="M13,3 Q1,24 13,45" stroke="url(#' + gid + ')" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
}

function prioArcSvgHtmlSolid(hex) {
  const h = /^#[0-9A-Fa-f]{6}$/.test(String(hex || '')) ? String(hex) : '#F59E0B';
  return '<svg width="15" height="48" viewBox="-2 0 19 48" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false"><path d="M13,3 Q1,24 13,45" stroke="' + h + '" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
}

function prioArcSvgHtml(strokeHex) {
  const base = /^#[0-9A-Fa-f]{6}$/.test(String(strokeHex || '')) ? String(strokeHex) : '#94a3b8';
  const { edge, hi } = prioArcMetallicStops(base);
  return prioArcSvgHtmlStops(edge, hi);
}

function prioArcSvgHtmlForPriorityKey(key) {
  const { edge, hi } = getPrioStopsForPriority(key);
  return prioArcSvgHtmlStops(edge, hi);
}

function taskPrioArcHtml(borderColor, priority, useCustomStroke, done) {
  const inner = useCustomStroke ? prioArcSvgHtml(borderColor) : prioArcSvgHtmlForPriorityKey(priority);
  return '<div class="task-prio-arc' + (done ? ' task-prio-arc--done' : '') + '" aria-hidden="true">' + inner + '</div>';
}

function updatePrioVars() {
  document.documentElement.style.setProperty('--prio-high', priorityColors.high || '#ef4444');
  refreshAddEmbedPrioArc();
}

function syncGhostLabelsFromForm() {
  var tt  = document.getElementById('tTime');
  var ps  = document.getElementById('pSel');
  var tl  = document.getElementById('tgTimeLabel');
  var pl  = document.getElementById('tgPrioLabel');
  var prioBtn = document.getElementById('tgPrioBtn');
  if (tl) tl.textContent = tt && tt.value ? '执行时间 ' + tt.value : '执行时间 --:--';
  if (pl) {
    var map = { high: '高', medium: '正常' };
    pl.textContent = '优先级 ' + (map[(ps && ps.value) || 'medium'] || '正常');
  }
  if (prioBtn) prioBtn.classList.toggle('task-ghost-prio-high', (ps && ps.value) === 'high');
  var suf = document.querySelector('.task-ghost-dur-suf');
  if (suf) suf.style.display = '';
}

function openGhostTimePicker() {
  var btn = document.getElementById('tgTimeBtn');
  var tl  = document.getElementById('tgTimeLabel');
  var tt  = document.getElementById('tTime');
  if (!btn || !tl || !tt) return;
  btn.style.display = 'none';
  var inp = document.createElement('input');
  inp.type = 'time';
  inp.value = tt.value || '';
  inp.style.cssText = 'border:1.5px solid var(--acc2,#818cf8);border-radius:8px;padding:4px 8px;font-size:.85rem;background:var(--card);color:var(--text);outline:none;font-family:inherit;cursor:pointer;';
  inp.addEventListener('change', function () { tt.value = inp.value; syncGhostLabelsFromForm(); });
  inp.addEventListener('blur', function () { inp.remove(); btn.style.display = ''; syncGhostLabelsFromForm(); });
  btn.parentNode.insertBefore(inp, btn.nextSibling);
  inp.focus();
  try { inp.showPicker(); } catch (e) {}
}

function cycleGhostPriority() {
  var ps = document.getElementById('pSel');
  if (!ps) return;
  ps.value = (ps && ps.value) === 'high' ? 'medium' : 'high';
  refreshAddEmbedPrioArc();
  syncGhostLabelsFromForm();
}

function refreshAddEmbedPrioArc() {
  const slot = document.querySelector('.add-embed-ck-slot');
  if (!slot) return;
  const col = document.body.classList.contains('dark') ? '#64748b' : '#cbd5e1';
  slot.style.setProperty('--ae-chk-ring', col);
  slot.style.color = '';
}

// ─────────────────────────────────────────────
// ② 自动归档检查
// ─────────────────────────────────────────────

function checkAutoArchive() {
  if (!autoArchive) return;
  const today = fd(now);
  for (const ds in T) {
    if (ds >= today) continue;
    (T[ds] || []).forEach(t => {
      if (!t.done || t.archived) return;
      t.archived = true;
    });
  }
  save();
}

// ─────────────────────────────────────────────
// ③ 日历渲染
// ─────────────────────────────────────────────

function rCal() {
  const g = document.getElementById('cGrid');
  const mn = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  document.getElementById('mTitle').textContent = cY + '年' + mn[cM];
  let h = ['日', '一', '二', '三', '四', '五', '六'].map(d => '<div class="cal-head">' + d + '</div>').join('');
  const f1 = new Date(cY, cM, 1).getDay();
  const dm  = new Date(cY, cM + 1, 0).getDate();
  const pm  = new Date(cY, cM, 0).getDate();
  const ts  = fd(now);

  // 上月补齐
  for (let i = f1 - 1; i >= 0; i--) {
    const d    = pm - i;
    const pmo  = cM === 0 ? 11 : cM - 1;
    const py   = cM === 0 ? cY - 1 : cY;
    const ds   = py + '-' + String(pmo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const dw   = new Date(py, pmo, d).getDay();
    h += '<div class="cal-day other' + (dw === 0 || dw === 6 ? ' weekend' : '') + '" onclick="pick(\'' + ds + '\')">' + d + cntDot(ds) + '</div>';
  }

  // 当月
  for (let d = 1; d <= dm; d++) {
    const ds  = cY + '-' + String(cM + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const dw  = new Date(cY, cM, d).getDay();
    let c = 'cal-day';
    if (ds === ts)  c += ' today';
    if (ds === sel) c += ' selected';
    if (dw === 0 || dw === 6) c += ' weekend';
    h += '<div class="' + c + '" onclick="pick(\'' + ds + '\')">' + d + cntDot(ds) + '</div>';
  }

  // 下月补齐
  const totalCells = f1 + dm;
  const remaining  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    const nmo  = cM === 11 ? 0 : cM + 1;
    const ny   = cM === 11 ? cY + 1 : cY;
    const ds   = ny + '-' + String(nmo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const dw   = new Date(ny, nmo, d).getDay();
    h += '<div class="cal-day other' + (dw === 0 || dw === 6 ? ' weekend' : '') + '" onclick="pick(\'' + ds + '\')">' + d + cntDot(ds) + '</div>';
  }

  g.innerHTML = h;
  renderOverdue();
}

function cntDot(ds) {
  const tasks = (T[ds] || []).filter(t => !t.archived);
  const pending = tasks.filter(t => !t.done).length;
  if (!pending) return '';
  return '<span class="cal-cnt">' + pending + '</span>';
}

function pick(ds) {
  const p = ds.split('-');
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  sel = ds;
  cY  = d.getFullYear();
  cM  = d.getMonth();
  rCal();
  rT();
  const path = getCurrentPath().replace(/\/[\d\-]+$/, '') || '/';
  history.pushState({ path }, '', path + ds);
  syncNavHighlight(getCurrentPath());
}

function quickGo(n) {
  const d = new Date(cY, cM, 1);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = d.getMonth();
  const dayOfMonth = Math.min(d.getDate(), new Date(y, m + 1, 0).getDate());
  const nd = new Date(y, m, dayOfMonth);
  sel = fd(nd);
  cY  = nd.getFullYear();
  cM  = nd.getMonth();
  rCal();
  rT();
  const path = getCurrentPath().replace(/\/[\d\-]+$/, '') || '/';
  history.pushState({ path }, '', path + sel);
  syncNavHighlight(getCurrentPath());
}

function getNextMonday() {
  const d = new Date(cY, cM, 1);
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return fd(d);
}

function openSidebar() {
  document.getElementById('sidebarMask').classList.add('open');
  document.getElementById('sidebar').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebarMask').classList.remove('open');
  document.getElementById('sidebar').classList.remove('open');
}

// ─────────────────────────────────────────────
// ④ 逾期渲染
// ─────────────────────────────────────────────

function renderOverdue() {
  const el = document.getElementById('overdueSection');
  if (!el) return;
  const od = getOverdue();
  if (!od.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="overdue-hd"><span class="overdue-hd-lbl">📅 逾期任务</span><button class="overdue-mig-btn" onclick="migrateAllOd()">全部迁移</button></div>' +
    od.map(g => '<div class="overdue-group">' +
      '<div class="overdue-date">' + disp(g.date) + '</div>' +
      g.tasks.map(t => '<div class="overdue-task">' +
        '<span class="ot-text">' + esc(t.text) + '</span>' +
        '<div class="ot-actions">' +
          '<button onclick="migrateTask(\'' + g.date + '\',' + t.id + ')">迁移</button>' +
          '<button onclick="abandonTask(\'' + g.date + '\',' + t.id + ')">放弃</button>' +
        '</div></div>').join('') + '</div>'
    ).join('');
}

// ─────────────────────────────────────────────
// ⑤ 专注计时器
// ─────────────────────────────────────────────

var _ftInited = false;
var _ftIv     = null;
var _ftO      = null;

function focusTimerYesterday() {
  var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return fd(d);
}

function focusTimerDefaults() {
  return { F: 25, S: 5, L: 15, mode: 'focus', run: 0, p: 0, rem: 1500, end: 0, round: 1, streak: 0, lastDay: '', byDay: {}, task: null };
}

function focusTimerLoad() {
  var o = focusTimerDefaults();
  try {
    var j = JSON.parse(localStorage.getItem('tuole_focus_v2') || '{}');
    if (+j.F > 0)  o.F = +j.F;
    if (+j.S > 0)  o.S = +j.S;
    if (+j.L > 0)  o.L = +j.L;
    if (['focus', 'short', 'long'].indexOf(j.mode) >= 0) o.mode = j.mode;
    if (j.run)     o.run = 1;
    if (j.p)       o.p = 1;
    if (+j.rem >= 0)  o.rem = +j.rem;
    if (+j.end > 0)    o.end = +j.end;
    if (+j.round >= 1 && +j.round <= 4) o.round = +j.round;
    if (+j.streak >= 0) o.streak = +j.streak;
    if (j.lastDay)   o.lastDay = j.lastDay;
    if (j.byDay && typeof j.byDay === 'object') o.byDay = j.byDay;
    if (j.task && j.task.d) o.task = j.task;
  } catch (e) {}
  _ftO = o;
  if (_ftO.run && !_ftO.p && _ftO.end) _ftO.rem = Math.max(0, Math.ceil((_ftO.end - Date.now()) / 1000));
  if (!_ftO.rem) _ftO.rem = focusTimerTotalSec();
}

function focusTimerSave() {
  try { localStorage.setItem('tuole_focus_v2', JSON.stringify(_ftO)); } catch (e) {}
}

function focusTimerTotalSec() {
  var o = _ftO;
  return o.mode === 'focus' ? o.F * 60 : o.mode === 'short' ? o.S * 60 : o.L * 60;
}

function focusTimerSyncEnd() {
  if (!_ftO.run || _ftO.p || !_ftO.end) return;
  var x = Math.ceil((_ftO.end - Date.now()) / 1000);
  if (x < 0) x = 0;
  _ftO.rem = x;
}

function focusTimerTick() {
  if (!document.getElementById('ftRingProg') || !_ftO) return;
  if (_ftO.run && !_ftO.p && _ftO.end) {
    focusTimerSyncEnd();
    if (_ftO.rem <= 0) {
      _ftO.rem = 0;
      focusTimerSave();
      focusTimerOnPhaseEnd();
    } else {
      focusTimerPaint();
    }
  }
}

function focusTimerVis() {
  if (document.visibilityState === 'visible' && _ftO && _ftO.run && !_ftO.p) focusTimerSyncEnd();
  focusTimerPaint();
}

function focusTimerAfterRender() {
  if (!document.getElementById('ftRingProg')) return;
  if (!_ftInited) {
    _ftInited = true;
    focusTimerLoad();
    _ftIv = setInterval(focusTimerTick, 1000);
    document.addEventListener('visibilitychange', focusTimerVis);
  }
  focusTimerSyncTaskLabel();
  focusTimerPaint();
}

function focusTimerSyncTaskLabel() {
  var el = document.getElementById('ftTaskLabel');
  if (!el) return;
  var tk = _ftO && _ftO.task;
  if (!tk) { el.textContent = '+ 关联任务（可选）'; return; }
  var arr = (typeof T !== 'undefined' && T[tk.d]) || [];
  var x = arr.find(function (q) { return q.id === tk.id; });
  el.textContent = x && x.text ? x.text : '+ 关联任务（可选）';
}

function focusTimerUpdateTabLabels() {
  var f = document.getElementById('ftLabF');
  var s = document.getElementById('ftLabS');
  var l = document.getElementById('ftLabL');
  if (f) f.textContent = String(_ftO.F);
  if (s) s.textContent = String(_ftO.S);
  if (l) l.textContent = String(_ftO.L);
}

function focusTimerUpdateTabs() {
  var m = _ftO.mode;
  var f = document.getElementById('ftTabFocus');
  var a = document.getElementById('ftTabShort');
  var b = document.getElementById('ftTabLong');
  if (f) f.classList.toggle('active', m === 'focus');
  if (a) a.classList.toggle('active', m === 'short');
  if (b) b.classList.toggle('active', m === 'long');
}

function focusTimerPaintDots() {
  var el = document.getElementById('ftDots');
  var dm = document.getElementById('ftDotsMeta');
  if (!el) return;
  var h = '';
  var o = _ftO;
  for (var i = 1; i <= 4; i++) {
    var c = 'ft-dot';
    if (i < o.round)     c += ' on';
    else if (i === o.round) c += ' on cur';
    h += '<div class="' + c + '"></div>';
  }
  el.innerHTML = h;
  if (dm) dm.textContent = o.mode === 'focus' ? ('第 ' + o.round + ' 个') : (o.mode === 'short' ? '短休息' : '长休息');
}

function focusTimerPaint() {
  if (!_ftO) return;
  focusTimerUpdateTabLabels();
  focusTimerUpdateTabs();
  var o = _ftO;
  var te  = document.getElementById('ftTimeDisp');
  var st  = document.getElementById('ftStatusDisp');
  var pb  = document.getElementById('ftPlayBtn');
  var ring = document.getElementById('ftRingProg');
  if (!te || !ring) return;
  var mx = Math.floor(o.rem / 60);
  var sx = o.rem % 60;
  te.textContent = (mx < 10 ? '0' : '') + mx + ':' + (sx < 10 ? '0' : '') + sx;
  var lab = o.mode === 'focus' ? '专注中' : o.mode === 'short' ? '短休中' : '长休中';
  if (!o.run)       st.textContent = '就绪';
  else if (o.p)     st.textContent = '已暂停';
  else              st.textContent = lab;
  var pip = pb && pb.querySelector('.ft-ico-play');
  var pau = pb && pb.querySelector('.ft-ico-pause');
  if (pip && pau) {
    if (o.run && !o.p) { pip.classList.add('hidden'); pau.classList.remove('hidden'); }
    else { pau.classList.add('hidden'); pip.classList.remove('hidden'); }
  }
  if (pb) pb.classList.toggle('ft-running', !!(o.run && !o.p));
  var tot = Math.max(1, focusTimerTotalSec());
  var C   = 2 * Math.PI * 52;
  ring.style.strokeDasharray = String(C);
  ring.style.strokeDashoffset = String(C * (1 - Math.min(1, o.rem / tot)));
  var td   = fd(now);
  var rec  = o.byDay[td] || { p: 0, m: 0 };
  var sp   = document.getElementById('ftStatPomo');
  var sm   = document.getElementById('ftStatMin');
  var ss   = document.getElementById('ftStatStreak');
  if (sp) sp.textContent = String(rec.p || 0);
  if (sm) sm.textContent = String(rec.m || 0);
  if (ss) ss.textContent = String(o.streak || 0);
  focusTimerPaintDots();
}

function focusTimerRecordPomo() {
  var o = _ftO;
  var td = fd(now);
  var n  = Math.round(o.F);
  if (!o.byDay[td]) o.byDay[td] = { p: 0, m: 0 };
  o.byDay[td].p = (o.byDay[td].p || 0) + 1;
  o.byDay[td].m = (o.byDay[td].m || 0) + n;
  var yd = focusTimerYesterday();
  if (o.lastDay !== td) {
    if (o.lastDay === yd) o.streak = (o.streak || 0) + 1;
    else o.streak = 1;
    o.lastDay = td;
  }
}

function focusTimerAdvance(donePomo) {
  var o = _ftO;
  if (o.mode === 'focus') {
    if (donePomo) focusTimerRecordPomo();
    if (o.round === 4) { o.mode = 'long'; o.round = 1; }
    else { o.mode = 'short'; o.round = o.round + 1; }
  } else {
    o.mode = 'focus';
  }
  o.rem = focusTimerTotalSec();
}

function focusTimerOnPhaseEnd() {
  if (!_ftO) return;
  _ftO.run = 0;
  _ftO.p   = 0;
  _ftO.end = 0;
  focusTimerAdvance(true);
  focusTimerSave();
  toast('⏱ 时间到');
  focusTimerPaint();
}

function focusTimerSetMode(m) {
  if (!_ftO) focusTimerLoad();
  if (m === _ftO.mode) return;
  _ftO.mode = m;
  _ftO.run  = 0;
  _ftO.p    = 0;
  _ftO.end  = 0;
  _ftO.rem  = focusTimerTotalSec();
  focusTimerSave();
  focusTimerPaint();
}

function focusTimerTogglePlay() {
  if (!_ftO) focusTimerLoad();
  if (_ftO.run && !_ftO.p) {
    _ftO.p = 1;
    focusTimerSyncEnd();
    _ftO.end = 0;
    focusTimerSave();
    focusTimerPaint();
  } else {
    _ftO.run = 1;
    _ftO.p   = 0;
    if (_ftO.rem <= 0) _ftO.rem = focusTimerTotalSec();
    _ftO.end = Date.now() + _ftO.rem * 1000;
    focusTimerSave();
    focusTimerPaint();
  }
}

function focusTimerReset() {
  if (!_ftO) return;
  _ftO.run = 0;
  _ftO.p   = 0;
  _ftO.end = 0;
  _ftO.rem = focusTimerTotalSec();
  focusTimerSave();
  focusTimerPaint();
}

function focusTimerSkip() {
  if (!_ftO) return;
  _ftO.run = 0;
  _ftO.p   = 0;
  _ftO.end = 0;
  focusTimerAdvance(false);
  focusTimerSave();
  focusTimerPaint();
}

function focusTimerToggleSettings() {
  var sv = document.getElementById('ftSettingsView');
  var tv = document.getElementById('ftTimerView');
  if (!sv || !tv || !_ftO) return;
  var show = sv.classList.contains('hidden');
  if (show) {
    sv.classList.remove('hidden');
    tv.classList.add('hidden');
    var f = document.getElementById('ftInF');
    var s = document.getElementById('ftInS');
    var l = document.getElementById('ftInL');
    if (f) f.value = _ftO.F;
    if (s) s.value = _ftO.S;
    if (l) l.value = _ftO.L;
    var tx = document.querySelector('#dashFocusCard .dash-focus-set-txt');
    if (tx) tx.textContent = '返回';
    var b = document.querySelector('#dashFocusCard .dash-focus-set');
    if (b) b.title = '返回';
  } else {
    sv.classList.add('hidden');
    tv.classList.remove('hidden');
    var tx = document.querySelector('#dashFocusCard .dash-focus-set-txt');
    if (tx) tx.textContent = '设置';
    var b = document.querySelector('#dashFocusCard .dash-focus-set');
    if (b) b.title = '设置';
  }
}

function focusTimerSaveSettings() {
  if (!_ftO) return;
  var a = +document.getElementById('ftInF').value;
  var b = +document.getElementById('ftInS').value;
  var c = +document.getElementById('ftInL').value;
  if (a >= 1 && a <= 180) _ftO.F = Math.round(a);
  if (b >= 1 && b <= 60)  _ftO.S = Math.round(b);
  if (c >= 1 && c <= 90)  _ftO.L = Math.round(c);
  _ftO.run = 0;
  _ftO.p   = 0;
  _ftO.end = 0;
  _ftO.rem = focusTimerTotalSec();
  var sv = document.getElementById('ftSettingsView');
  var tv = document.getElementById('ftTimerView');
  if (sv) sv.classList.add('hidden');
  if (tv) tv.classList.remove('hidden');
  var txt = document.querySelector('#dashFocusCard .dash-focus-set-txt');
  if (txt) txt.textContent = '设置';
  var btn = document.querySelector('#dashFocusCard .dash-focus-set');
  if (btn) btn.title = '设置';
  focusTimerSave();
  focusTimerPaint();
  toast('⚙ 已保存');
}

function focusTimerOpenTaskPick() {
  var day   = fd(now);
  var tasks = (T[day] || []).filter(function (t) { return !t.done && !t.archived && !t.frozen; });
  var body  = document.getElementById('mBody');
  var bg    = document.getElementById('mBg');
  if (!body || !bg) return;
  var h;
  if (!tasks.length) {
    h = '<div class="m-sheet-wrap"><p class="m-sheet-title">今日无可用任务</p><button type="button" class="m-sheet-btn m-sheet-btn--accent" onclick="clM()">关闭</button></div>';
  } else {
    h = '<div class="m-sheet-wrap"><p class="m-sheet-title">选择专注任务</p><div class="ft-pick-list">' +
         tasks.map(function (t) {
           return '<button type="button" class="ft-pick-item" onclick="focusTimerPickTask(\'' + day + '\',' + t.id + ')">' + esc(t.text) + '</button>';
         }).join('') +
         '</div><div class="ft-pick-actions"><button type="button" class="m-sheet-btn m-sheet-btn--ghost" onclick="clM()">取消</button><button type="button" class="m-sheet-btn ft-pick-deselect" onclick="focusTimerClearPick()">取消选择</button></div></div>';
  }
  body.innerHTML = h;
  bg.classList.add('show');
}

function focusTimerPickTask(d, id) {
  if (!_ftO) focusTimerLoad();
  _ftO.task = { d: d, id: +id };
  focusTimerSave();
  clM();
  rT();
}

function focusTimerClearPick() {
  if (!_ftO) focusTimerLoad();
  _ftO.task = null;
  focusTimerSave();
  clM();
  rT();
}

// ─────────────────────────────────────────────
// ⑥ 任务时间颜色accent
// ─────────────────────────────────────────────

function taskTimeAccent(planTime, dateStr) {
  const dk = document.body.classList.contains('dark');
  const L  = (a, b, c) => ({ text: dk ? b : a, rail: dk ? c[1] : c[0], bg: dk ? c[3] : c[2] });
  const none = L('#8e9bab', '#94a3b8', ['#e5e7eb', '#475569', 'linear-gradient(180deg,#f4f7fa 0%,#eef1f5 100%)', 'linear-gradient(180deg,rgba(30,41,59,.55) 0%,rgba(15,23,42,.2) 100%)']);
  if (!planTime) return none;
  const m = String(planTime).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return none;
  const base    = parseDS(dateStr);
  const taskAt  = new Date(base.getFullYear(), base.getMonth(), base.getDate(), +m[1], +m[2], 0, 0);
  const deltaMin = (taskAt - Date.now()) / 60000;
  if (deltaMin <= 0) return L('#c73e3e', '#fca5a5', ['#f0b0b0', '#991b1b', 'linear-gradient(180deg,#fff0f1 0%,#fff7f7 100%)', 'linear-gradient(180deg,rgba(153,27,27,.28) 0%,rgba(30,41,59,.4) 100%)']);
  if (deltaMin <= 35) return L('#d45545', '#fb923c', ['#f0b8a8', '#c2410c', 'linear-gradient(180deg,#fff5f0 0%,#fffdfb 100%)', 'linear-gradient(180deg,rgba(234,88,12,.2) 0%,rgba(30,41,59,.35) 100%)']);
  if (deltaMin <= 120) return L('#e07030', '#fdba74', ['#f0c8a8', '#ea580c', 'linear-gradient(180deg,#fff8f2 0%,#fffcfa 100%)', 'linear-gradient(180deg,rgba(234,88,12,.12) 0%,rgba(30,41,59,.28) 100%)']);
  if (deltaMin <= 360) return L('#c9922e', '#fbbf24', ['#e8d8b8', '#b45309', 'linear-gradient(180deg,#fffbf5 0%,#fdfcfa 100%)', 'linear-gradient(180deg,rgba(180,83,9,.14) 0%,rgba(30,41,59,.25) 100%)']);
  if (deltaMin <= 1440) return L('#4f6fa8', '#93c5fd', ['#b8ccea', '#1d4ed8', 'linear-gradient(180deg,#f3f6fc 0%,#f7f9fd 100%)', 'linear-gradient(180deg,rgba(37,99,235,.16) 0%,rgba(30,41,59,.32) 100%)']);
  return L('#6c7d95', '#94a3b8', ['#c5cedd', '#64748b', 'linear-gradient(180deg,#f1f4f8 0%,#f6f8fb 100%)', 'linear-gradient(180deg,rgba(71,85,105,.22) 0%,rgba(30,41,59,.28) 100%)']);
}

// ─────────────────────────────────────────────
// ⑦ 任务复选框环形 SVG
// ─────────────────────────────────────────────

function taskListCkRing(id, done, priority, archived, prioStrokeHex) {
  let hex;
  if (archived) {
    hex = /^#[0-9A-Fa-f]{6}$/.test(String(prioStrokeHex || '')) ? String(prioStrokeHex) : prioColor(priority) || '#8b5cf6';
  } else if ((priority || 'normal') === 'high') {
    hex = prioColor(priority) || '#ef4444';
  } else {
    hex = '#94a3b8';
  }
  const chk = '<svg class="chk-ring-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.15 12.35 10.95 16.05 17.1 8.2" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if (archived) {
    return '<div class="task-ck-ring task-ck-ring--archived" style="--ck-prio:' + hex + '"><div class="tc-check"><div class="chk-ring chk-ring--archived">' + chk + '</div></div></div>';
  }
  const prioHighCls = (priority || 'normal') === 'high' ? ' task-ck-ring--prio-high' : '';
  const ringCls     = 'task-ck-ring' + (done ? ' task-ck-ring--done' : '') + prioHighCls;
  const rip         = done && window._chkRippleTaskId == id ? ' chk-ring--ripple' : '';
  return '<div class="' + ringCls + '" style="--ck-prio:' + hex + '"><div class="tc-check"><div class="chk-ring' + (done ? ' checked' : '') + rip + '" onmousedown="event.stopPropagation()" onclick="event.stopPropagation();tog(' + id + ')">' + chk + '</div></div></div>';
}

// ─────────────────────────────────────────────
// ⑧ 核心列表渲染 - rT()
// ─────────────────────────────────────────────

/** 刷新任务列表（主渲染入口）。 */
function rT() {
  if (_togPendingDoneId != null) { flushPendingTogIfAny(); return; }
  hydrateSortModes();
  generateRecurring(sel);
  checkUnfreeze();
  const list = document.getElementById('tList');
  document.getElementById('dTitle').textContent = disp(sel);
  const dt            = T[sel] || [];
  const nonArchived   = dt.filter(t => !t.archived);
  const archivedTasks = dt.filter(t => t.archived);
  const pn   = nonArchived.filter(t => !t.done && !t.frozen).length;
  const dn   = nonArchived.filter(t => t.done).length;
  const archDn = archivedTasks.length;
  const tot  = nonArchived.length;
  document.getElementById('batchBar').style.display = 'flex';
  updateSortUI();
  renderOverdue();

  let fl = nonArchived.filter(t => passesFMulti(t));
  if (FTag) fl = fl.filter(t => (t.tags || []).includes(FTag));

  let archVisible = [];
  if (showArchivedInList && archivedTasks.length > 0) {
    let af = archivedTasks;
    if (FTag) af = af.filter(t => (t.tags || []).includes(FTag));
    archVisible = af;
  }

  const totalForProg = tot + archDn;
  const doneForProg  = dn + archDn;
  const pct          = totalForProg > 0 ? Math.round(doneForProg / totalForProg * 100) : 0;

  let displayList = fl;
  if (autoSortEnabled && displayList.length > 1 && !sortStates[sel]) {
    displayList = sortDisplayList([...displayList], defaultSortMode);
  }

  if (!displayList.length && !archVisible.length) {
    const isZero = tot === 0 && archDn === 0;
    list.innerHTML = '<div class="empty"><div class="em">🎉</div><p class="empty-main">' +
      (isZero ? '今天任务已全部完成' : '没有匹配的任务') +
      '</p><p class="empty-sub">' +
      (isZero ? '休息一下，或添加新任务' : '试试其他筛选条件') + '</p></div>';
    renderTaskDash(pct, totalForProg, doneForProg, nonArchived, fl, sel);
    focusTimerAfterRender();
    return;
  }

  if (viewMode === 'timeblock') {
    renderTimeBlocks(displayList, archVisible, list);
    renderTaskDash(pct, totalForProg, doneForProg, nonArchived, fl, sel);
    focusTimerAfterRender();
    return;
  }

  let h = displayList.map(t => taskHTML(t, false)).join('');
  if (archVisible.length > 0) h += archVisible.map(t => taskHTML(t, true)).join('');
  list.innerHTML = h;
  renderTaskDash(pct, totalForProg, doneForProg, nonArchived, fl, sel);
  focusTimerAfterRender();
}

function renderTimeBlocks(fl, archVisible, list) {
  const blocks = TIME_BLOCKS.map(b => ({ ...b, tasks: [] }));
  fl.forEach(t => {
    const pt = t.planTime || '';
    if (!pt) { blocks[4].tasks.push(t); return; }
    if (pt < '09:00')      blocks[0].tasks.push(t);
    else if (pt < '12:00') blocks[1].tasks.push(t);
    else if (pt < '18:00') blocks[2].tasks.push(t);
    else                   blocks[3].tasks.push(t);
  });
  let h = '';
  blocks.forEach(b => {
    if (!b.tasks.length) return;
    const coll      = collapsedBlocks[b.id];
    const timeRange = b.from && b.to ? ' ' + b.from + ' - ' + b.to : '';
    h += '<div class="tb-section' + (coll ? ' collapsed' : '') + '">' +
          '<div class="tb-header" onclick="collapsedBlocks[\'' + b.id + '\']=!collapsedBlocks[\'' + b.id + '\'];rT()">' +
            '<span class="tb-icon">' + b.name.split(' ')[0] + '</span>' +
            '<span class="tb-name">' + (b.name.split(' ').slice(1).join(' ') || b.name) + '</span>' +
            '<span class="tb-time-range">' + timeRange + '</span>' +
            '<span class="tb-cnt">' + b.tasks.length + ' 条</span>' +
            '<span class="tb-arrow">▼</span></div>' +
          '<div class="tb-tasks">' + b.tasks.map(t => taskHTML(t, false)).join('') + '</div></div>';
  });
  if (archVisible.length > 0) {
    h += '<div class="tb-section"><div class="tb-header" style="opacity:.5">' +
          '<span class="tb-icon">📦</span><span class="tb-name">归档</span>' +
          '<span class="tb-cnt">' + archVisible.length + ' 条</span></div>' +
         '<div class="tb-tasks">' + archVisible.map(t => taskHTML(t, true)).join('') + '</div></div>';
  }
  list.innerHTML = h || '<div class="empty"><div class="em">📝</div><p>暂无任务</p></div>';
}

// 冻结任务自动解冻
function checkUnfreeze() {
  const today = fd(now);
  for (const ds in T) {
    (T[ds] || []).forEach(t => {
      if (!t.frozen || !t.frozenUntil || ds >= today) return;
      if (ds < today) {
        t.frozen      = false;
        t.frozenUntil = '';
      }
    });
  }
}

// ─────────────────────────────────────────────
// ⑨ 任务项 HTML（核心内联渲染函数，体积较大）
// ─────────────────────────────────────────────

function taskHTML(t, isArchived) {
  const pt   = t.planTime || '';
  const subs = t.subtasks || [];
  const subD = subs.filter(s => s.done).length;
  const subT = subs.length;
  const subAllDone = subT === 0 || subD === subT;
  const hasNote  = t.note && t.note.trim();
  const hasDur   = t.duration > 0;
  const hasRecur = t.recurRuleId;
  const isExp    = expandedId === t.id;
  const taskMoreOpen = taskMoreMenuId === t.id;

  const SVG_TM_ELL =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';

  const borderColor = t.frozen ? '#38bdf8' : isArchived ? '#94a3b8' : t.color || prioColor(t.priority);
  const frozenCls   = t.frozen ? ' frozen-item' : '';
  const prioHighRowCls = !t.frozen && !isArchived && (t.priority || 'normal') === 'high' ? ' task-prio-high' : '';
  const ftFocusCls  = typeof _ftO !== 'undefined' && _ftO && _ftO.task && _ftO.task.d === sel && +_ftO.task.id === +t.id ? ' ft-focus-task' : '';
  const ftAria      = ftFocusCls ? ' aria-label="当前专注关联任务"' : '';

  const subTitleSuffix = subT > 0
    ? '<button type="button" class="sub-task-pill-btn sub-task-pill' + (subAllDone ? ' sub-task-pill--done' : '') + (isExp ? ' sub-task-pill--open' : '') +
      ' title="子任务 ' + subD + '/' + subT + '" aria-expanded="' + (isExp ? 'true' : 'false') + '" aria-label="子任务 ' + subD + '/' + subT + '"' +
      ' onclick="event.stopPropagation();toggleExpand(' + t.id + ')">' +
      '<span class="stp-icon">' + (subAllDone
        ? '<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
      ) + '</span><span class="stp-n">' + subD + ' / ' + subT + '</span></button>'
    : '';

  const subTimeSep = subT > 0 ? '<span class="task-time-sep" aria-hidden="true">·</span>' : '';

  let rightIconsH = '';
  if (hasDur) rightIconsH += '<span class="task-ri" title="耗时 ' + fmtDs(t.duration) + '">⏱</span>';
  if (showDeadline && pt && t.duration) {
    const dl = calcDeadline(pt, t.duration);
    if (dl) rightIconsH += '<span class="task-ri" title="截止 ' + dl + '" style="color:#f97316;opacity:.6">⏰</span>';
  }
  if (hasNote) rightIconsH += '<span class="task-ri" title="有备注"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>';
  if (t.frozen) rightIconsH += '<span class="task-ri" title="已冷冻" style="color:#38bdf8;opacity:.7">❄️</span>';

  let tagsFootH = '';
  (t.tags || []).filter(tagId => getTag(tagId)).forEach(tagId => {
    const tg = getTag(tagId);
    if (tg) tagsFootH += '<span class="task-tag task-tag-soft" style="--tg:' + tg.color + '">' + tg.name + '</span>';
  });

  let subPeekInline = '';

  // ── 归档任务行 ──
  if (isArchived) {
    const accA    = pt ? taskTimeAccent(pt, sel) : taskTimeAccent('', sel);
    const archTimeInner = hasRecur ? taskRowRecurTimeInnerHtml(t, pt) : pt
      ? '<span class="time-plain time-disp" style="opacity:.88">' + pt + '</span>'
      : '<span class="time-plain time-disp" style="opacity:.88">全天</span>';
    const archTc   = hasRecur ? 'var(--task-time-recur-fg)' : accA.text;
    const timeColArch = '<div class="task-time-col" style="color:' + archTc + ';--task-time-rail:' + accA.rail + '">' + archTimeInner + subTimeSep + subTitleSuffix + '</div>';
    return '<div class="task-item archived-item" data-id="' + t.id + '" onclick="onTaskItemMultiBackdrop(event,' + t.id + ')" style="--task-prio:' + borderColor + '">' +
      '<div class="task-row">' + prioListRail(t, true) +
      '<div class="task-rail" onclick="event.stopPropagation()"></div>' +
      '<div class="task-ck-slot" onclick="event.stopPropagation()">' + taskListCkRing(t.id, true, t.priority, true, borderColor) + '</div>' +
      '<div class="task-row-center" onclick="onTaskRowCenterClick(event,' + t.id + ')"><div class="txt-line"><span class="txt">' + esc(t.text) + '</span></div>' + timeColArch + '</div>' +
      '<div class="task-inline-meta" onclick="event.stopPropagation()">' + subPeekInline + tagsFootH + rightIconsH + '</div>' +
      '<div class="task-actions" onclick="event.stopPropagation()"><button class="act-btn" onclick="event.stopPropagation();restoreArchived(\'' + sel + '\',' + t.id + ')" title="恢复">↩</button></div>' +
      '</div></div>';
  }

  // ── 时间编辑输入框 ──
  let timeH = '';
  let acc   = taskTimeAccent('', sel);
  if (editingTimeId === t.id) {
    const _teInp =
      '<input type="time" class="te-input te-input--pill" id="te_' + t.id + '" value="' + pt + '"' +
      ' onclick="event.stopPropagation()"' +
      ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();saveTimeEdit(' + t.id + ')}else if(event.key===\'Escape\'){event.preventDefault();cancelTimeEdit()}"' +
      ' title="Enter 保存 · 失焦保存 · Esc 取消"' +
      ' onblur="setTimeout(function(){if(editingTimeId===' + t.id + ')saveTimeEdit(' + t.id + ')},100)">';
    const _tePfx = hasRecur ? '<span class="time-edit-pill-prefix">' + esc(getRecurDesc(t.recurRuleId) || '重复') + (pt ? '\u2009' : '') + '</span>' : '';
    const _teMid = hasRecur ? '<span class="te-pill-time-core">' + _tePfx + _teInp + '</span>' : _teInp;
    timeH = '<div class="time-edit time-edit--inline time-edit--pill" onclick="event.stopPropagation()">' +
      (hasRecur ? taskRecurRowBadgeSvg() : '') +
      _teMid +
      '<button type="button" class="te-pill-clock-btn" aria-label="选择时间" title="选择时间" onmousedown="event.preventDefault()" onclick="event.stopPropagation();openTimePillPicker(' + t.id + ')">' +
      '<svg class="te-pill-clock-ico" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button></div>';
    acc = pt ? taskTimeAccent(pt, sel) : taskTimeAccent('', sel);
  } else if (hasRecur) {
    timeH = taskRowRecurTimeInnerHtml(t, pt);
    acc    = pt ? taskTimeAccent(pt, sel) : taskTimeAccent('', sel);
  } else if (pt) {
    timeH = '<span class="time-plain time-disp" onclick="event.stopPropagation();startTimeEdit(' + t.id + ')">' + pt + '</span>';
    acc   = taskTimeAccent(pt, sel);
  } else {
    timeH = '<span class="time-plain time-disp" onclick="event.stopPropagation();startTimeEdit(' + t.id + ')" title="计划时间（点击设置）">全天</span>';
    acc   = taskTimeAccent('', sel);
  }
  const tcColor = editingTimeId === t.id ? acc.text : (t.frozen ? acc.text : (hasRecur ? 'var(--task-time-recur-fg)' : 'var(--text3)'));
  const tcRail  = editingTimeId === t.id ? acc.rail : (!t.frozen ? 'var(--task-bd)' : acc.rail);
  const timeColH = '<div class="task-time-col' + (editingTimeId === t.id ? ' task-time-col--editing task-time-col--pill-edit' : '') + '"' +
    ' style="color:' + tcColor + ';--task-time-rail:' + tcRail + '">' + timeH + subTimeSep + subTitleSuffix + '</div>';

  // ── 展开区域 ──
  let expandH = '';
  if (isExp) {
    const tom   = new Date(parseDS(sel)); tom.setDate(tom.getDate() + 1);
    const tomS  = fd(tom);
    const tom2  = new Date(parseDS(sel)); tom2.setDate(tom2.getDate() + 2);
    const tom2S = fd(tom2);
    const nmon  = getNextMonday();
    let ppDropExp = '';
    if (ppOpenId === t.id) {
      ppDropExp =
        '<div class="pp-drop pp-drop-exp">' +
          '<div class="pp-item" onclick="event.stopPropagation();postponeTask(' + t.id + ',\'' + tomS + '\')">📅 推迟到明天</div>' +
          '<div class="pp-item" onclick="event.stopPropagation();postponeTask(' + t.id + ',\'' + tom2S + '\')">📅 推迟到后天</div>' +
          '<div class="pp-item" onclick="event.stopPropagation();postponeTask(' + t.id + ',\'' + nmon + '\')">📅 推迟到下周一</div>' +
          '<div class="pp-item" onclick="event.stopPropagation();postponeCustom(' + t.id + ')">📅 选择日期…</div>' +
          '<div class="pp-divider"></div>' +
          '<div class="pp-item" onclick="event.stopPropagation();copyTaskTo(' + t.id + ')">📋 复制到…</div>' +
        '</div>';
    }
    const icSub      = '<svg class="exp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
    const icNote     = '<svg class="exp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    const icTag      = '<svg class="exp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>';
    const icClock    = '<svg class="exp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    const icPalette  = '<svg class="exp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/></svg>';
    const icCal      = '<svg class="exp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    const icRecur    = '<svg class="exp-ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
    const icShield   = '<svg class="exp-ico-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    const icPrio     = '<svg class="exp-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
    const icSliders  = '<svg class="task-exp-tab-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/></svg>';

    let subRows = '';
    subs.forEach(s => {
      if (editingSubId === s.id) {
        subRows += '<div class="subtask-item"><div class="sub-ck ' + (s.done ? 'checked' : '') + '" onclick="toggleSubtask(' + t.id + ',' + s.id + ')">' + (s.done ? '✓' : '') + '</div>' +
          '<input class="sub-text-edit" id="subEdit_' + s.id + '" value="' + esc(s.text) + '"' +
          ' onkeydown="if(event.key==\'Enter\')saveEditSub(' + t.id + ',' + s.id + ')"' +
          ' onblur="setTimeout(()=>saveEditSub(' + t.id + ',' + s.id + '),120)">' +
          '<button type="button" class="sub-del" onclick="deleteSubtask(' + t.id + ',' + s.id + ')">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
      } else {
        subRows += '<div class="subtask-item"><div class="sub-ck ' + (s.done ? 'checked' : '') + '" onclick="toggleSubtask(' + t.id + ',' + s.id + ')">' + (s.done ? '✓' : '') + '</div>' +
          '<span class="sub-text ' + (s.done ? 'sub-done' : '') + '" ondblclick="startEditSub(' + t.id + ',' + s.id + ')">' + esc(s.text) + '</span>' +
          '<button type="button" class="sub-del" onclick="deleteSubtask(' + t.id + ',' + s.id + ')">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
      }
    });

    const subAddOpen = subAddComposingId === t.id;
    const subAddPlusSvg = '<svg class="sub-add-plus" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    let subAddRow = '<div class="sub-add-wrap' + (subT > 0 ? ' sub-add-wrap--tabbed' : '') + '">' +
      '<button type="button" class="sub-add-trigger' + (subAddOpen ? ' sub-add-trigger--hidden' : '') + '" aria-label="添加子任务" onclick="event.stopPropagation();openSubAddCompose(' + t.id + ')">' +
      subAddPlusSvg + '添加子任务…</button>' +
      '<div class="sub-add-form' + (subAddOpen ? '' : ' sub-add-form--hidden') + '" role="group" aria-label="新建子任务" onclick="event.stopPropagation()">' +
      '<div class="sub-ck sub-add-ck-ph" aria-hidden="true"></div>' +
      '<input type="text" class="sub-add-input" id="subAdd_' + t.id + '" placeholder="输入子任务内容，按回车保存" autocomplete="off" onclick="event.stopPropagation()"' +
      ' onkeydown="if(event.key==\'Enter\'){event.preventDefault();addSubtask(' + t.id + ')}else if(event.key==\'Escape\'){event.preventDefault();cancelSubAddCompose(' + t.id + ')}">' +
      '<div class="sub-add-actions"><button type="button" class="sub-add-cancel" title="取消 (Esc)" onclick="event.stopPropagation();cancelSubAddCompose(' + t.id + ')">取消</button><button type="button" class="sub-add-save" title="保存 (Enter)" onclick="event.stopPropagation();addSubtask(' + t.id + ')">保存</button></div></div></div>';

    let subH = '<div class="exp-block exp-block--sub"><div class="exp-block-hd">' + icSub + '<span class="exp-block-tit">子任务</span>' + (subT ? '<span class="exp-count-badge">' + subD + ' / ' + subT + '</span>' : '') + '</div>' +
      '<div class="subtask-list">' + subRows + '</div>' + subAddRow + '</div>';

    // 详细属性表单
    const _tp = t.priority || 'normal';
    const _prioHi  = _tp === 'high';
    const _prioMid = _tp === 'medium' || _tp === 'normal';
    const _prioLo  = _tp === 'low';

    const detailsFormS =
      '<div class="task-detail-card" onclick="event.stopPropagation()">' +
        '<div class="task-detail-sect task-detail-sect--note">' +
          '<div class="task-detail-hd">' + icNote + '<span>备注</span></div>' +
          '<textarea class="task-detail-textarea" id="note_' + t.id + '" placeholder="添加任务备注…" onblur="saveNote(' + t.id + ')">' + esc(t.note || '') + '</textarea>' +
        '</div>' +
        '<div class="task-detail-split">' +
          '<div class="task-detail-col">' +
            '<div class="task-detail-hd">' + icTag + '<span>标签</span></div>' +
            '<div class="task-detail-tags">' +
              customTags.map(tg => {
                const on = (t.tags || []).includes(tg.id);
                return '<button type="button" class="task-detail-tag' + (on ? ' task-detail-tag--on' : '') + '"' +
                  (on ? ' style="background:color-mix(in srgb,' + tg.color + ' 22%,var(--card));color:var(--text);border-color:color-mix(in srgb,' + tg.color + ' 48%,var(--inp-bd))"' : '') +
                  ' onclick="event.stopPropagation();toggleTaskTag(' + t.id + ',\'' + tg.id + '\')">' + tg.name + '</button>';
              }).join('') +
              '<button type="button" class="task-detail-tag-add" onclick="event.stopPropagation();navigate(\'/settings\')" title="管理标签">+ 添加</button>' +
            '</div>' +
          '</div>' +
          '<div class="task-detail-col">' +
            '<div class="task-detail-hd">' + icPrio + '<span>优先级</span></div>' +
            '<div class="task-detail-prio-row">' +
              '<button type="button" class="task-detail-prio-btn' + (_prioHi ? ' task-detail-prio-btn--on task-detail-prio-btn--hi' : '') + '" onclick="event.stopPropagation();setTaskPriorityFromPanel(' + t.id + ',\'high\')">高</button>' +
              '<button type="button" class="task-detail-prio-btn' + (_prioMid ? ' task-detail-prio-btn--on task-detail-prio-btn--mid' : '') + '" onclick="event.stopPropagation();setTaskPriorityFromPanel(' + t.id + ',\'medium\')">中</button>' +
              '<button type="button" class="task-detail-prio-btn' + (_prioLo ? ' task-detail-prio-btn--on task-detail-prio-btn--lo' : '') + '" onclick="event.stopPropagation();setTaskPriorityFromPanel(' + t.id + ',\'low\')">低</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="task-detail-sect task-detail-sect--color">' +
          '<div class="task-detail-hd">' + icPalette + '<span>颜色标记</span></div>' +
          '<div class="task-detail-swatches">' +
            '<button type="button" class="task-detail-swatch task-detail-swatch--clear' + (!t.color ? ' task-detail-swatch--on' : '') + '" title="无标记" aria-label="清除颜色" onclick="event.stopPropagation();setTaskColor(' + t.id + ',\'\')"></button>' +
            COLORS.slice(1, 8).map(c =>
              '<button type="button" class="task-detail-swatch' + (t.color === c ? ' task-detail-swatch--on' : '') + '" style="--td-sw:' + c + '" onclick="event.stopPropagation();setTaskColor(' + t.id + ',\'' + c + '\')" aria-label="颜色"></button>'
            ).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    let durS = '<div class="task-detail-extras"><div class="exp-meta-row task-detail-dur-row">' +
      '<div class="exp-meta-lbl">' + icClock + '<span>耗时</span></div>' +
      '<div class="exp-meta-val exp-meta-val--dur"><input type="number" id="dur_' + t.id + '" value="' + (t.duration || '') + '" min="0" max="480" placeholder="0" onchange="saveDuration(' + t.id + ')"><span class="exp-unit">分钟</span></div></div></div>';

    let postponeS = '<div class="exp-meta-row exp-meta-row--pp"><div class="exp-meta-lbl">' + icCal + '<span>推迟</span></div>' +
      '<div class="exp-meta-val"><div class="exp-pp-inner"><button type="button" class="exp-pp-btn" onclick="event.stopPropagation();ppOpenId=ppOpenId===' + t.id + '?null:' + t.id + ';rT()">' + (ppOpenId === t.id ? '收起选项' : '推迟 / 复制到其他日期…') + '</button>' + ppDropExp + '</div></div></div>';

    const rule = t.recurRuleId ? recurRules.find(r => r.id === t.recurRuleId) : null;
    let recurSub = '未设置循环规则';
    if (rule) {
      const rn = { daily: '每天', weekly: '每周', monthly: '每月' }[rule.type] || '重复';
      recurSub = rn + (rule.active ? ' · 已开启' : ' · 已暂停');
    }

    let recurInner = '';
    if (rule) {
      let typeH = '<select onchange="updateRecurRule(\'' + rule.id + '\',\'type\',this.value)"><option value="daily"' + (rule.type === 'daily' ? ' selected' : '') + '>每天</option><option value="weekly"' + (rule.type === 'weekly' ? ' selected' : '') + '>每周</option><option value="monthly"' + (rule.type === 'monthly' ? ' selected' : '') + '>每月</option></select>';
      let extraH = '';
      if (rule.type === 'weekly') {
        extraH = '<div class="recur-weekdays">' + [0, 1, 2, 3, 4, 5, 6].map(d =>
          '<button class="wd-btn' + ((rule.weekdays || []).includes(d) ? ' wd-on' : '') + '" onclick="toggleRecurWeekday(\'' + rule.id + '\',' + d + ')">' + WD[d] + '</button>'
        ).join('') + '</div>';
      }
      if (rule.type === 'monthly') {
        extraH = '<div class="exp-row exp-row--nest"><span class="exp-unit">每月</span><input type="number" value="' + rule.monthDay + '" min="1" max="31" onchange="updateRecurRule(\'' + rule.id + '\',\'monthDay\',+this.value)" style="width:55px"><span class="exp-unit">号</span></div>';
      }
      recurInner = '<div class="exp-adv-panel-inner"><div class="exp-row">' + typeH +
        '<button type="button" class="rr-toggle ' + (rule.active ? 'rr-on' : '') + '" onclick="updateRecurRule(\'' + rule.id + '\',\'active\',' + (!rule.active) + ')">' + (rule.active ? '✅' : '⏸') + '</button>' +
        '<button type="button" class="exp-del-btn" onclick="deleteRecurRule(\'' + rule.id + '\')">删除</button></div>' + extraH + '</div>';
    } else {
      recurInner = '<div class="exp-adv-panel-inner"><button type="button" class="exp-save-btn exp-save-btn--block" onclick="addRecurRule(' + t.id + ')">＋ 设为重复任务</button></div>';
    }
    let recurS = '<details class="exp-adv-details" id="expRecurDetails_' + t.id + '" onclick="event.stopPropagation()"><summary class="exp-adv-sum" onclick="event.stopPropagation()"><span class="exp-adv-ico exp-adv-ico--recur">' + icRecur + '</span><span class="exp-adv-mid"><span class="exp-adv-title">设为重复任务</span><span class="exp-adv-sub">' + recurSub + '</span></span><span class="exp-adv-chev" aria-hidden="true"></span></summary><div class="exp-adv-panel">' + recurInner + '</div></details>';

    const freezeSub = t.frozen ? '任务已冻结' : '暂停任务，不计入待办';
    let freezeInner = '<div class="exp-adv-panel-inner"><button type="button" class="exp-save-btn exp-save-btn--block ' + (t.frozen ? 'exp-save-btn--ice' : '') + '" style="' + (t.frozen ? 'background:#38bdf8' : '') + '" onclick="toggleFreeze(' + t.id + ')">' + (t.frozen ? '🔥 解冻此任务' : '❄️ 冷冻此任务') + '</button></div>';
    let freezeS = '<details class="exp-adv-details" onclick="event.stopPropagation()"><summary class="exp-adv-sum" onclick="event.stopPropagation()"><span class="exp-adv-ico exp-adv-ico--freeze">' + icShield + '</span><span class="exp-adv-mid"><span class="exp-adv-title">冻结此任务</span><span class="exp-adv-sub">' + freezeSub + '</span></span><span class="exp-adv-chev" aria-hidden="true"></span></summary><div class="exp-adv-panel">' + freezeInner + '</div></details>';

    const detailsBundle = detailsFormS + durS;
    const tabSubOn = expandedPanelTab !== 'details';

    if (subT > 0) {
      expandH = '<div class="task-expand-area task-expand-area--tabbed task-expand-area--open"><div class="task-expand-drop"><div class="task-exp-tabs" role="tablist" aria-label="任务详情">' +
        '<button type="button" role="tab" class="task-exp-tab' + (tabSubOn ? ' task-exp-tab--active' : '') + '" aria-selected="' + (tabSubOn ? 'true' : 'false') + '" onclick="event.stopPropagation();setTaskExpandTab(\'subtasks\')">' + icSub + '<span>子任务</span></button>' +
        '<button type="button" role="tab" class="task-exp-tab' + (tabSubOn ? '' : ' task-exp-tab--active') + '" aria-selected="' + (tabSubOn ? 'false' : 'true') + '" onclick="event.stopPropagation();setTaskExpandTab(\'details\')">' + icSliders + '<span>详细属性</span></button>' +
        '</div><div class="task-exp-tab-panels">' +
          '<div class="task-exp-panel task-exp-panel--subtasks' + (tabSubOn ? ' task-exp-panel--visible' : '') + '"><div class="task-exp-sub-bg"><div class="subtask-list">' + subRows + '</div>' + subAddRow + '</div></div>' +
          '<div class="task-exp-panel task-exp-panel--details' + (tabSubOn ? '' : ' task-exp-panel--visible') + '"><div class="task-exp-details-stack">' + detailsBundle + '</div></div>' +
        '</div></div></div></div>';
    } else {
      expandH = '<div class="task-expand-area task-expand-area--open"><div class="exp-bg-wrap">' + subH + detailsBundle + '</div></div>';
    }
  }

  // ── 组装最终行 ──
  return '<div class="task-item' + (t.done && subAllDone ? ' done' : '') + (t.done ? ' task-main-checked task-row-done' : '') + frozenCls + prioHighRowCls + ftFocusCls + (taskMoreOpen ? ' task-item--menu-open' : '') + '"' + ftAria + ' data-id="' + t.id + '" onclick="onTaskItemMultiBackdrop(event,' + t.id + ')" style="--task-prio:' + borderColor + '">' +
    '<div class="task-row' + prioListRowTierClass(t) + '">' +
      prioListRail(t, false) +
      '<div class="task-rail" onclick="event.stopPropagation()"><div class="drag-handle dh-head" onmousedown="sDrag(event,' + t.id + ')" ontouchstart="sDrag(event,' + t.id + ')" title="拖动排序" onclick="event.stopPropagation()"></div>' +
        (multiSelect ? '<div class="ms-ck' + (selectedIds.has(t.id) ? ' checked' : '') + '" onclick="event.stopPropagation();toggleMSel(' + t.id + ')">' + (selectedIds.has(t.id) ? '✓' : '') + '</div>' : '') +
      '</div>' +
      '<div class="task-ck-slot" onclick="event.stopPropagation()">' + taskListCkRing(t.id, taskRingAppearsDone(t), t.priority, false, borderColor) + '</div>' +
      '<div class="task-strike-wrap" onclick="onTaskStrikeWrapPaddingClick(event,' + t.id + ')"><div class="task-strike-content">' +
        '<div class="task-row-center" onclick="' + (editingId === t.id ? 'event.stopPropagation()' : 'onTaskRowCenterClick(event,' + t.id + ')') + '">' +
          '<div class="txt-line' + (editingId === t.id ? ' txt-line--edit' : '') + '">' +
            (editingId === t.id
              ? '<input class="txt-edit txt-edit--inline" value="' + esc(t.text) + '" onclick="event.stopPropagation()" onkeydown="if(event.key===\'Enter\'){event.preventDefault();saveEdit(' + t.id + ')}if(event.key===\'Escape\')cancelEdit()" onblur="setTimeout(()=>saveEdit(' + t.id + '),120)">'
              : '<span class="txt" ondblclick="event.stopPropagation();startEdit(' + t.id + ')">' + esc(t.text) + '</span>'
            ) +
          '</div>' + timeColH +
        '</div>' +
      '</div></div>' +
      '<div class="task-inline-meta" onclick="event.stopPropagation()">' + subPeekInline + tagsFootH + rightIconsH + '</div>' +
      '<div class="task-actions" style="position:relative" onclick="event.stopPropagation()"><div class="task-more-wrap">' +
        '<button type="button" class="act-btn task-more-btn' + (taskMoreOpen ? ' is-open' : '') + '" title="更多操作" aria-label="更多操作" aria-expanded="' + (taskMoreOpen ? 'true' : 'false') + '" aria-haspopup="true" onclick="event.stopPropagation();toggleTaskMoreMenu(' + t.id + ')">' + SVG_TM_ELL + '</button>' +
      '</div>' +
      '<button type="button" class="act-btn del" title="删除" aria-label="删除" onclick="event.stopPropagation();del(' + t.id + ')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
      '</div>' +
    '</div>' +
    (subT > 0 ? '<div class="exp-bg-wrap">' + expandH + '</div>' : expandH) +
    '</div>';
}

// 辅助：获取重复描述文字
function getRecurDesc(rid) {
  const r = (recurRules || []).find(x => x.id === rid);
  if (!r) return '';
  const m = { daily: '每天', weekly: '每周', monthly: '每月' };
  return (m[r.type] || '重复') + (r.active ? ' · 已开启' : '');
}

// 辅助：重复任务行内时间 HTML
function taskRowRecurTimeInnerHtml(t, pt) {
  return '<span class="time-plain time-disp time-disp--recur">' + (pt || '全天') + '</span>';
}

// 辅助：重复行徽章
function taskRecurRowBadgeSvg() {
  return '<svg class="recur-row-badge" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/></svg>';
}

// 辅助：获取标签
function getTag(id) {
  return (customTags || []).find(t => t.id === id);
}

// ─────────────────────────────────────────────
// ⑩ 标签相关
// ─────────────────────────────────────────────

function rTagDropdownContent() {
  var el = document.getElementById('tagDropdownContent');
  if (!el) return;
  if (!customTags.length) { el.innerHTML = '<div style="padding:10px 14px;font-size:.82rem;color:var(--text3)">暂无标签</div>'; return; }
  el.innerHTML = customTags.map(tg =>
    '<button type="button" class="filter-dd-row" onclick="setFTag(\'' + tg.id + '\')">' +
      '<span class="fdd-chk' + (FTag === tg.id ? ' on' : '') + '">' + (FTag === tg.id ? '✓' : '') + '</span>' +
      '<span class="fdd-lbl"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + tg.color + ';margin-right:4px;flex-shrink:0"></span>' + esc(tg.name) + '</span>' +
      '<span class="filter-cnt filter-cnt--zero">' + ((T[sel] || []).filter(function(x) { return (x.tags || []).indexOf(tg.id) >= 0 && !x.archived; }).length) + '</span>' +
    '</button>'
  ).join('');
}

function setFTag(id) {
  FTag = FTag === id ? '' : id;
  document.getElementById('tagDropdown').classList.remove('show');
  rT();
}

function updateSortUI() {}

// ─────────────────────────────────────────────
// ⑪ 看板渲染
// ─────────────────────────────────────────────

let kbTouchState = null;
let kbDragId     = null;

function kbGetTimePeriod(pt) {
  if (!pt) return 'unset';
  if (pt < '09:00') return 'morning';
  if (pt < '12:00') return 'forenoon';
  if (pt < '18:00') return 'afternoon';
  return 'evening';
}

function rKanban() {
  document.getElementById('kbDate').textContent = disp(sel);
  generateRecurring(sel);
  checkUnfreeze();
  const dt   = T[sel] || [];
  let all    = dt.filter(t => !t.archived);
  if (FTag) all = all.filter(t => (t.tags || []).includes(FTag));
  const allForCount = all;

  function cntPeriod(pid) {
    return allForCount.filter(t => {
      const p = kbGetTimePeriod(t.planTime || '');
      return pid === 'all' || p === pid;
    }).length;
  }

  const periods = [
    { id: 'all',       name: '全部',                          cnt: allForCount.length },
    { id: 'morning',   name: '🌅 早晨 00:00-09:00',           cnt: cntPeriod('morning')   },
    { id: 'forenoon',  name: '☀️ 上午 09:00-12:00',           cnt: cntPeriod('forenoon')  },
    { id: 'afternoon', name: '🌤 下午 12:00-18:00',           cnt: cntPeriod('afternoon') },
    { id: 'evening',   name: '🌙 晚上 18:00-24:00',           cnt: cntPeriod('evening')   },
    { id: 'unset',     name: '📌 未安排',                     cnt: cntPeriod('unset')     },
  ];

  document.getElementById('kbFilterBar').innerHTML = periods.map(p =>
    '<button class="kb-filter-btn' + (kbTimeFilter === p.id ? ' on' : '') + '" onclick="kbTimeFilter=\'' + p.id + '\';rKanban()">' + p.name + ' <span class="kbf-cnt">' + p.cnt + '</span></button>'
  ).join('');

  if (kbTimeFilter !== 'all') all = all.filter(t => kbGetTimePeriod(t.planTime || '') === kbTimeFilter);
  const doneTasks = all.filter(t => t.done);
  const cols = [
    { id: 'high',   name: '<span style="background:' + priorityColors.high + ';color:#fff;padding:2px 10px;border-radius:10px;font-size:.82rem;font-weight:600">高优先</span>',
      tasks: all.filter(t => !t.done && !t.frozen && t.priority === 'high') },
    { id: 'medium', name: '<span style="background:' + priorityColors.medium + ';color:#422006;padding:2px 10px;border-radius:10px;font-size:.82rem;font-weight:600">中优先</span>',
      tasks: all.filter(t => !t.done && !t.frozen && t.priority === 'medium') },
    { id: 'low',    name: '<span style="background:' + priorityColors.low + ';color:#fff;padding:2px 10px;border-radius:10px;font-size:.82rem;font-weight:600">低优先</span>',
      tasks: all.filter(t => !t.done && !t.frozen && t.priority === 'low') },
  ];
  const frozen = all.filter(t => t.frozen && !t.done);
  if (frozen.length) cols.push({ id: 'frozen', name: '<span style="background:#3b82f6;color:#fff;padding:2px 10px;border-radius:10px;font-size:.82rem;font-weight:600">冷冻</span>', tasks: frozen });
  if (!kbHideDone) cols.push({ id: 'done', name: '<span style="background:#6366f1;color:#fff;padding:2px 10px;border-radius:10px;font-size:.82rem;font-weight:600">已完成</span>', tasks: doneTasks });

  const toggleBtn = document.getElementById('kbDoneToggle');
  const cntEl     = document.getElementById('kbDoneCnt');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', !kbHideDone);
    toggleBtn.firstChild.innerHTML = kbHideDone
      ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> 显示已完成列 '
      : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> 隐藏已完成列 ';
    if (cntEl) cntEl.textContent = doneTasks.length;
  }

  document.getElementById('kanbanWrap').innerHTML = cols.map(col =>
    '<div class="kb-col" data-col="' + col.id + '"><div class="kb-col-head"><span class="kb-col-title">' + col.name + '</span><span class="kb-cnt">' + col.tasks.length + '</span></div>' +
    '<div class="kb-cards" data-col="' + col.id + '">' +
      (col.tasks.length
        ? col.tasks.map(t => {
          const cardColor = t.color || prioColor(t.priority);
          const subs      = t.subtasks || [];
          const subD      = subs.filter(s => s.done).length;
          const subT      = subs.length;
          let subH = '';
          if (subT > 0) {
            const pct = Math.round(subD / subT * 100);
            subH = '<div class="kc-sub-row" onclick="event.stopPropagation()"><div class="kc-sub-preview" style="' + prioSubProgressVars(t.priority) + '">📋 ' + subD + '/' + subT + ' <span class="kc-sub-track"><span class="kc-sub-fill" style="width:' + pct + '%"></span></span></div></div>';
          }
          return '<div class="kb-card' + (t.frozen ? ' frozen-card' : '') + (t.done ? ' kb-done-card' : '') + '" data-id="' + t.id + '" style="border-left-color:' + cardColor + '" onclick="showKbDetail(' + t.id + ')">' +
            '<div class="kc-text">' + esc(t.text) + '</div>' +
            '<div class="kc-meta">' +
              (subT > 0 ? '' : prioBadge(t.priority)) +
              (t.planTime ? '<span class="time-badge" style="font-size:.72rem;padding:1px 6px">🕐' + t.planTime + '</span>' : '') +
              (t.duration ? '<span class="meta-badge mb-dur">⏱' + fmtDs(t.duration) + '</span>' : '') +
              (t.tags || []).map(tid => { const tg = getTag(tid); return tg ? '<span class="task-tag" style="background:' + tg.color + ';font-size:.6rem">' + tg.name + '</span>' : ''; }).join('') +
            '</div>' + subH + '</div>';
        }).join('')
        : '<div class="kb-empty-hint">拖拽任务到此列</div>'
      ) +
      '<div class="kb-drop-zone"></div></div></div>'
  ).join('');

  document.querySelectorAll('.kb-card').forEach(card => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', e => { kbDragId = +card.dataset.id; e.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('touchstart', kbTouchStart, { passive: false });
  });
  document.querySelectorAll('.kb-cards').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.querySelector('.kb-drop-zone')?.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.querySelector('.kb-drop-zone')?.classList.remove('drag-over'));
    col.addEventListener('drop', e => { e.preventDefault(); col.querySelector('.kb-drop-zone')?.classList.remove('drag-over'); kbDrop(col.dataset.col); });
  });
}

function showKbDetail(id) {
  const t    = (T[sel] || []).find(x => x.id === id);
  if (!t) return;
  const subs = t.subtasks || [];
  const subD = subs.filter(s => s.done).length;
  const subT = subs.length;
  let h = '<p style="font-weight:600;font-size:1.1rem;margin-bottom:12px;text-align:left">' + esc(t.text) + '</p>';
  h += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">' + prioBadge(t.priority) +
    (t.planTime ? '<span class="time-badge">🕐' + t.planTime + '</span>' : '') +
    (t.duration ? '<span class="meta-badge mb-dur" style="font-size:.76rem;padding:2px 8px">⏱' + fmtDs(t.duration) + '</span>' : '') +
    (t.tags || []).map(tid => { const tg = getTag(tid); return tg ? '<span class="task-tag" style="background:' + tg.color + ';font-size:.66rem;padding:2px 6px">' + tg.name + '</span>' : ''; }).join('') +
    '</div>';
  if (t.note) h += '<div style="background:var(--hov);padding:10px 12px;border-radius:8px;font-size:.88rem;margin-bottom:12px;text-align:left;white-space:pre-wrap">' + esc(t.note) + '</div>';
  if (subT > 0) {
    h += '<div class="exp-label" style="margin-bottom:6px;text-align:left">📋 子任务 (' + subD + '/' + subT + ')</div><div class="subtask-list" style="margin-bottom:12px">';
    subs.forEach(s => { h += '<div class="subtask-item"><div class="sub-ck ' + (s.done ? 'checked' : '') + '" onclick="kbToggleSub(' + t.id + ',' + s.id + ')">' + (s.done ? '✓' : '') + '</div><span class="sub-text ' + (s.done ? 'sub-done' : '') + '">' + esc(s.text) + '</span></div>'; });
    h += '</div>';
  }
  h += '<div class="modal-actions" style="margin-top:14px"><button class="mbtn-c" onclick="clM()">关闭</button><button class="mbtn-a" onclick="clM();navigate(\'/\');expandedId=' + t.id + ';rT()">📝 编辑详情</button></div>';
  document.getElementById('mBody').innerHTML = h;
  document.getElementById('mBg').classList.add('show');
}

function kbToggleSub(tid, sid) {
  const t = (T[sel] || []).find(x => x.id === tid);
  if (!t) return;
  const s = (t.subtasks || []).find(x => x.id === sid);
  if (s) s.done = !s.done;
  showKbDetail(tid);
  rKanban();
  save();
}

function kbDrop(col) {
  if (kbDragId === null) return;
  const t = (T[sel] || []).find(x => x.id === kbDragId);
  if (!t) return;
  if (col === 'high')   { t.priority = 'high';   t.done = false; t.status = 'todo';   t.frozen = false; t.archived = false; }
  else if (col === 'medium') { t.priority = 'medium'; t.done = false; t.status = 'todo'; t.frozen = false; t.archived = false; }
  else if (col === 'low')   { t.priority = 'low';    t.done = false; t.status = 'todo'; t.frozen = false; t.archived = false; }
  else if (col === 'done')   { t.status = 'done';     t.done = true;  t.frozen = false; }
  else if (col === 'frozen') { t.frozen = true; }
  kbDragId = null;
  rKanban();
  rCal();
  save();
}

function kbTouchStart(e) {
  const card = e.currentTarget;
  const touch = e.touches[0];
  const ghost = document.createElement('div');
  ghost.className = 'kb-ghost';
  ghost.textContent = card.querySelector('.kc-text').textContent;
  ghost.style.left = touch.clientX - 60 + 'px';
  ghost.style.top  = touch.clientY - 20 + 'px';
  document.body.appendChild(ghost);
  card.classList.add('kb-dragging');
  kbTouchState = { id: +card.dataset.id, ghost, card };
  document.addEventListener('touchmove', kbTouchMove, { passive: false });
  document.addEventListener('touchend', kbTouchEnd);
  e.preventDefault();
}

function kbTouchMove(e) {
  if (!kbTouchState) return;
  e.preventDefault();
  const touch = e.touches[0];
  kbTouchState.ghost.style.left = touch.clientX - 60 + 'px';
  kbTouchState.ghost.style.top  = touch.clientY - 20 + 'px';
  document.querySelectorAll('.kb-drop-zone').forEach(dz => dz.classList.remove('drag-over'));
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (el) {
    const col = el.closest('.kb-col');
    if (col) col.querySelector('.kb-drop-zone')?.classList.add('drag-over');
  }
}

function kbTouchEnd(e) {
  if (!kbTouchState) return;
  document.removeEventListener('touchmove', kbTouchMove);
  document.removeEventListener('touchend', kbTouchEnd);
  const touch = e.changedTouches[0];
  kbTouchState.ghost.remove();
  kbTouchState.card.classList.remove('kb-dragging');
  document.querySelectorAll('.kb-drop-zone').forEach(dz => dz.classList.remove('drag-over'));
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (el) {
    const col = el.closest('.kb-col');
    if (col) { kbDragId = kbTouchState.id; kbDrop(col.dataset.col); }
  }
  kbTouchState = null;
}

// ─────────────────────────────────────────────
// ⑫ 模板管理
// ─────────────────────────────────────────────

function addTpl() {
  const inp = document.getElementById('tplIn');
  const txt = inp.value.trim();
  if (!txt) return;
  templates.push({
    id:       Date.now(),
    text:     txt,
    priority: document.getElementById('tplPSel').value,
    checked:  true,
    planTime: document.getElementById('tplTime').value || '',
  });
  inp.value = '';
  document.getElementById('tplTime').value = '';
  rTpl();
  save();
  toast('📦 已添加');
}

function togTpl(id) {
  const t = templates.find(x => x.id === id);
  if (t) { t.checked = !t.checked; rTpl(); save(); }
}

function delTpl(id) { templates = templates.filter(x => x.id !== id); rTpl(); save(); }

function rTpl() {
  const list = document.getElementById('tplList');
  if (!templates.length) {
    list.innerHTML = '<div style="text-align:center;padding:28px;color:var(--text3)"><div style="font-size:2rem;margin-bottom:6px">📦</div><p>暂无模板</p></div>';
    return;
  }
  list.innerHTML = templates.map(t =>
    '<div class="tpl-item">' +
      '<div class="tpl-ck ' + (t.checked ? 'checked' : '') + '" onclick="togTpl(' + t.id + ')">' + (t.checked ? '✓' : '') + '</div>' +
      '<div class="tpl-txt">' + esc(t.text) + '</div>' +
      (t.planTime ? '<span class="time-badge" style="font-size:.76rem;padding:1px 7px">🕐' + t.planTime + '</span>' : '') +
      ' ' + prioBadge(t.priority) +
      '<button class="tpl-del" onclick="delTpl(' + t.id + ')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
    '</div>'
  ).join('');
}

function applyTpl() {
  const ck = templates.filter(t => t.checked);
  if (!ck.length) { toast('⚠️ 请勾选模板'); return; }
  const days = parseInt(document.getElementById('applyDays').value) || 7;
  let c = 0;
  for (let i = 0; i < days; i++) {
    const d  = new Date(now);
    d.setDate(d.getDate() + i);
    const ds = fd(d);
    if (!T[ds]) T[ds] = [];
    ck.forEach(tpl => {
      if (!T[ds].some(x => x.text === tpl.text && !x.done && !x.archived)) {
        T[ds].push(mkTask(tpl.text, tpl.priority, tpl.planTime, 0, { fromTpl: true }));
        c++;
      }
    });
  }
  rCal();
  rT();
  save();
  const el = document.getElementById('applyMsg');
  el.textContent = '✅ 已添加 ' + c + ' 条';
  setTimeout(() => el.textContent = '', 3000);
  toast('🚀 已添加 ' + c + ' 条');
}

function batchDelTpl() {
  const ck = templates.filter(t => t.checked);
  if (!ck.length) { toast('⚠️ 请勾选模板'); return; }
  const days   = parseInt(document.getElementById('delDays').value) || 7;
  const names   = new Set(ck.map(t => t.text));
  let c = 0;
  for (let i = 0; i < days; i++) {
    const d  = new Date(now);
    d.setDate(d.getDate() + i);
    const ds = fd(d);
    if (!T[ds]) continue;
    const b  = T[ds].length;
    T[ds] = T[ds].filter(t => !names.has(t.text) || t.archived);
    c += b - T[ds].length;
    if (!T[ds].length) delete T[ds];
  }
  rCal();
  rT();
  save();
  const el = document.getElementById('delMsg');
  el.textContent = c ? '🗑️ 已删除 ' + c + ' 条' : 'ℹ️ 未找到匹配';
  setTimeout(() => el.textContent = '', 3000);
}

// ─────────────────────────────────────────────
// ⑬ 统计页面
// ─────────────────────────────────────────────

function setStatP(p, btn) {
  statP = p;
  document.querySelectorAll('.stats-period button').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  rStats();
}

function rStats() {
  const days    = statP === 'week' ? 7 : statP === 'two' ? 14 : 30;
  const today   = fd(now);
  const stEl    = document.getElementById('statsTagFilter');
  stEl.innerHTML =
    '<span class="stf-btn' + (!statTag ? ' on' : '') + '" style="' + (!statTag ? 'background:var(--acc);color:#fff;border-color:var(--acc)' : '') + '" onclick="statTag=\'\';rStats()">全部</span>' +
    customTags.map(t =>
      '<span class="stf-btn' + (statTag === t.id ? ' on' : '') + '" style="' + (statTag === t.id ? 'background:' + t.color + ';color:#fff;border-color:' + t.color : '') + '" onclick="statTag=\'' + t.id + '\';rStats()">' + t.name + '</span>'
    ).join('');

  let allDatesWithTasks = new Set();
  for (const ds in T) { if (T[ds] && T[ds].length > 0) allDatesWithTasks.add(ds); }
  let dateEntries = [];
  let dateSet     = new Set();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const ds = fd(d); dateSet.add(ds); dateEntries.push(ds);
  }
  for (let i = 1; i <= days; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    const ds = fd(d);
    if (allDatesWithTasks.has(ds) && !dateSet.has(ds)) { dateSet.add(ds); dateEntries.push(ds); }
  }
  dateEntries.sort();

  let totalT = 0, totalD = 0, perfectDays = 0;
  let dates  = [];
  dateEntries.forEach(ds => {
    let dt = (T[ds] || []).filter(t => !t.frozen);
    if (statTag) dt = dt.filter(t => (t.tags || []).includes(statTag));
    const done  = dt.filter(t => t.done || t.archived).length;
    const total = dt.length;
    totalT += total;
    totalD += done;
    if (total > 0 && done === total) perfectDays++;
    dates.push({ ds, label: dispS(ds), total, done, isToday: ds === today, isFuture: ds > today });
  });

  const rate = totalT > 0 ? Math.round(totalD / totalT * 100) : 0;
  document.getElementById('statsSummary').innerHTML =
    '<div class="stat-box"><div class="num">' + totalT + '</div><div class="lbl">总任务</div></div>' +
    '<div class="stat-box"><div class="num">' + totalD + '</div><div class="lbl">已完成</div></div>' +
    '<div class="stat-box"><div class="num">' + rate + '%</div><div class="lbl">完成率</div></div>' +
    '<div class="stat-box"><div class="num">' + perfectDays + '</div><div class="lbl">满分天</div></div>';

  let chartH   = '';
  let dividerInserted = false;
  dates.forEach(d => {
    if (d.isFuture && !dividerInserted) {
      chartH += '<div class="chart-divider"><span class="chart-divider-line"></span><span class="chart-divider-label">📅 未来计划</span><span class="chart-divider-line"></span></div>';
      dividerInserted = true;
    }
    const pct     = d.total > 0 ? Math.round(d.done / d.total * 100) : 0;
    const barW    = d.total > 0 ? Math.max(pct, 3) : 0;
    const isPerfect = pct === 100 && d.total > 0;
    let c;
    if (d.total === 0)    c = '#e2e8f0,#e2e8f0';
    else if (isPerfect)   c = '#22c55e,#4ade80';
    else if (pct > 0)    c = '#818cf8,#a5b4fc';
    else                 c = '#cbd5e1,#e2e8f0';
    const valTxt = d.total > 0 ? d.done + '/' + d.total + (isPerfect ? ' ✓' : '') : '-';
    const labelCls = d.isToday ? ' cl-today' : d.isFuture ? ' cl-future' : '';
    const rowCls   = d.isToday ? ' cr-today' : d.isFuture ? ' cr-future' : '';
    const todayMark = d.isToday ? ' ←今天' : '';
    chartH += '<div class="chart-row' + rowCls + '"><div class="chart-label' + labelCls + '">' + d.label + todayMark + '</div>' +
      '<div class="chart-bar-bg"><div class="chart-bar-fill" style="width:' + barW + '%;background:linear-gradient(90deg,' + c + ')"></div>' +
      '<span class="chart-val">' + valTxt + '</span></div></div>';
  });
  document.getElementById('chartArea').innerHTML = chartH;
}

// ─────────────────────────────────────────────
// ⑭ 仪表盘（任务概览 + 周视图）
// ─────────────────────────────────────────────

function initTaskDashReorder() {
  var root = document.getElementById('taskDashCol');
  if (!root || root._dashReorderInit) return;
  root._dashReorderInit = 1;

  function saveOrd() {
    var ids = [];
    root.querySelectorAll('.dash-card[data-dash-id]').forEach(function (c) { ids.push(c.getAttribute('data-dash-id')); });
    try { localStorage.setItem('tuole_dash_order', JSON.stringify(ids)); } catch (e) {}
  }

  function applyOrd() {
    var cards = [].slice.call(root.querySelectorAll('.dash-card[data-dash-id]'));
    if (!cards.length) return;
    var map = {};
    cards.forEach(function (c) { map[c.getAttribute('data-dash-id')] = c; });
    var def = cards.map(function (c) { return c.getAttribute('data-dash-id'); });
    var order;
    try { order = JSON.parse(localStorage.getItem('tuole_dash_order') || 'null'); } catch (e) { order = null; }
    if (!Array.isArray(order) || !order.length) return;
    var seen = new Set(), merged = [];
    order.forEach(function (id) { if (map[id] && !seen.has(id)) { seen.add(id); merged.push(id); } });
    def.forEach(function (id) { if (!seen.has(id)) { seen.add(id); merged.push(id); } });
    merged.forEach(function (id) { var el = map[id]; if (el) root.appendChild(el); });
  }

  applyOrd();

  var allowD = 0, dragId = null;
  root.addEventListener('mousedown', function (e) { allowD = e.target.closest('.dash-drag-handle') ? 1 : 0; });
  root.addEventListener('mouseup', function () { allowD = 0; });

  [].forEach.call(root.querySelectorAll('.dash-card[data-dash-id]'), function (card) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', function (e) {
      if (!allowD) { e.preventDefault(); return; }
      allowD = 0;
      dragId = card.getAttribute('data-dash-id');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragId);
      card.classList.add('dash-dragging');
    });
    card.addEventListener('dragend', function () {
      card.classList.remove('dash-dragging');
      [].forEach.call(root.querySelectorAll('.dash-card.drag-dash-over'), function (c) { c.classList.remove('drag-dash-over'); });
      dragId = null;
    });
    card.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (!dragId || dragId === card.getAttribute('data-dash-id')) return;
      e.dataTransfer.dropEffect = 'move';
      [].forEach.call(root.querySelectorAll('.dash-card.drag-dash-over'), function (c) { c.classList.remove('drag-dash-over'); });
      card.classList.add('drag-dash-over');
    });
    card.addEventListener('dragleave', function (e) { if (!card.contains(e.relatedTarget)) card.classList.remove('drag-dash-over'); });
    card.addEventListener('drop', function (e) {
      e.preventDefault();
      card.classList.remove('drag-dash-over');
      var fromId = e.dataTransfer.getData('text/plain');
      var toId   = card.getAttribute('data-dash-id');
      if (!fromId || fromId === toId) return;
      var fromEl = root.querySelector('.dash-card[data-dash-id="' + fromId + '"]');
      if (!fromEl) return;
      var rect   = card.getBoundingClientRect();
      var before = e.clientY < rect.top + rect.height / 2;
      if (before) root.insertBefore(fromEl, card);
      else root.insertBefore(fromEl, card.nextSibling);
      saveOrd();
    });
  });
}

function renderTaskDash(pct, totalForProg, doneForProg, nonArchived, fl, selStr) {
  const root = document.getElementById('taskDashCol');
  if (!root) return;
  const p  = selStr.split('-');
  const shortDate = (+p[1]) + '月' + (+p[2]) + '日';
  const sdEl = document.getElementById('dashShortDate');
  if (sdEl) sdEl.textContent = shortDate;

  const pctEl = document.getElementById('dashProgPct');
  if (pctEl) pctEl.textContent = pct + '%';

  const C    = 2 * Math.PI * 52;
  const ring  = document.getElementById('dashRingProg');
  if (ring) { ring.style.strokeDasharray = String(C); ring.style.strokeDashoffset = String(C * (1 - pct / 100)); }

  const dEl = document.getElementById('dashDone');
  const tEl = document.getElementById('dashTotal');
  if (dEl) dEl.textContent = String(doneForProg);
  if (tEl) tEl.textContent = String(totalForProg);

  const hiP    = nonArchived.filter(t => t.priority === 'high');
  const hiCol  = (typeof priorityColors !== 'undefined' && priorityColors.high) || '#ef4444';
  const hiN    = hiP.length;
  const hiDone = hiP.filter(t => t.done).length;
  const elHi    = document.getElementById('dashOvHiCnt');
  if (elHi) elHi.textContent = String(hiN);

  const bMain = document.getElementById('dashMainBar');
  const bHi   = document.getElementById('dashOvHiBar');
  const mainW = totalForProg ? Math.round(doneForProg / totalForProg * 100) : 0;
  if (bMain) bMain.style.width = mainW + '%';
  const hiW = hiN ? Math.round(hiDone / hiN * 100) : 0;
  if (bHi) bHi.style.width = hiW + '%';

  const cardH = document.querySelector('.dash-ov-prio-card--high');
  if (cardH) {
    cardH.style.setProperty('--ov-prio', hiCol);
    if (bHi) bHi.style.background = hiCol;
  }

  // 周视图条
  const wdBase   = parseDS(selStr);
  const mondayOff = wdBase.getDay() === 0 ? -6 : 1 - wdBase.getDay();
  const start     = new Date(wdBase);
  start.setDate(wdBase.getDate() + mondayOff);
  const labels = ['一', '二', '三', '四', '五', '六', '日'];
  const strip  = document.getElementById('dashWeekStrip');
  const wtitle = document.getElementById('dashWeekTitle');
  if (wtitle) wtitle.textContent = wdBase.getFullYear() + '年' + (wdBase.getMonth() + 1) + '月';
  if (strip) {
    const todayStr = fd(now);
    let h = '';
    let wkTot = 0, wkDone = 0;
    for (let i = 0; i < 7; i++) {
      const dd = new Date(start);
      dd.setDate(start.getDate() + i);
      const ds = fd(dd);
      const isWkSel = ds === selStr;
      const isToday = ds === todayStr;
      let wcls = 'dash-wd' + (isWkSel ? ' dash-wd-sel' : '') + (isToday ? ' dash-wd-today' : '');
      const arr = T[ds] ? T[ds].filter(function (x) { return !x.archived; }) : [];
      const n   = arr.length;
      if (n) { wkTot += n; wkDone += arr.filter(function (x) { return x.done; }).length; }
      let taskDot = '';
      if (n) {
        const allD = arr.every(function (x) { return x.done; });
        taskDot = '<span class="dash-wd-dot dash-wd-dot--task' + (allD ? ' dash-wd-dot--done' : '') + '" aria-hidden="true"></span>';
      }
      h += '<button type="button" class="' + wcls + '" onclick="pick(\'' + ds + '\')">' +
        '<span class="dash-wd-lab">' + labels[i] + '</span>' +
        '<span class="dash-wd-num">' + dd.getDate() + '</span>' +
        '<div class="dash-wd-dots" aria-hidden="true">' +
          '<span class="dash-wd-dot dash-wd-dot--today"></span>' + taskDot +
        '</div></button>';
    }
    strip.innerHTML = h;

    const foot = document.getElementById('dashWeekFoot');
    if (foot) {
      if (!wkTot) foot.innerHTML = '<div class="dash-week-foot-inner dash-week-foot--empty">本周暂无任务</div>';
      else foot.innerHTML = '<div class="dash-week-foot-inner"><div class="dwf-line"><span class="dwf-k">本周</span> <strong class="dwf-num">' + wkTot + '</strong><span class="dwf-u">项</span><span class="dwf-dotsep">·</span><span class="dwf-k">已完成</span> <strong class="dwf-num dwf-done">' + wkDone + '</strong><span class="dwf-dotsep">·</span><span class="dwf-k">待办</span> <strong class="dwf-num dwf-pend">' + (wkTot - wkDone) + '</strong></div></div>';
    }
  }
}

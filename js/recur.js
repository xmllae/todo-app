/**
 * =================================================================
 * recur.js - 重复任务规则 & 逾期任务处理
 * =================================================================
 * 负责重复任务的生成、更新、删除，以及逾期任务的迁移/放弃功能。
 * =================================================================
 */

// ─────────────────────────────────────────────
// ① 重复规则同步（当任务属性变化时同步到关联规则）
// ─────────────────────────────────────────────

/**
 * 将任务属性同步到其关联的重复规则。
 * 被 cyclePriority / setTaskPriority / setTaskPriorityFromPanel 等调用，
 * 保证重复任务内容与模板规则保持一致。
 */
function syncToRule(task) {
  if (!task || !task.recurRuleId) return;
  const r = recurRules.find(x => x.id === task.recurRuleId);
  if (!r) return;
  r.text      = task.text;
  r.priority  = task.priority;
  r.planTime  = task.planTime || '';
  r.duration  = task.duration || 0;
  r.tags      = [...(task.tags || [])];
  r.color     = task.color || '';
  r.note      = task.note || '';
}

// ─────────────────────────────────────────────
// ② 生成指定日期的重复任务（由 rT 调用）
// ─────────────────────────────────────────────

/**
 * 根据 recurRules，为指定日期生成应出现的重复任务实例。
 * @param {string} ds - 'YYYY-MM-DD' 日期字符串
 */
function generateRecurring(ds) {
  if (!recurRules || !recurRules.length) return;

  const d         = parseDS(ds);
  const dow      = d.getDay();           // 0=周日
  const dom      = d.getDate();          // 1~31
  const lastDom  = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  recurRules.forEach(r => {
    if (!r.active || ds < r.startDate) return;

    let match = false;
    if (r.type === 'daily') {
      match = true;
    } else if (r.type === 'weekly') {
      match = (r.weekdays || []).includes(dow);
    } else if (r.type === 'monthly') {
      match = false;
      if (r.monthDays && r.monthDays.length) {
        match = r.monthDays.indexOf(dom) >= 0;
      } else if (r.monthDay != null) {
        match = dom === r.monthDay;
      }
      if (r.monthlyLastDay && dom === lastDom) match = true;
    }

    if (!match) return;

    const exc = r.exceptions || [];
    if (exc.indexOf('skip_weekends') >= 0 && (dow === 0 || dow === 6)) return;

    if (!T[ds]) T[ds] = [];
    if (T[ds].some(t => t.recurRuleId === r.id)) return;

    const bid    = Date.now();
    const newSubs = (r.subtasks || []).map((s, i) => ({
      id:    bid + i + Math.floor(Math.random() * 1e4),
      text:  s.text,
      done:  false,
    }));

    T[ds].push(mkTask(r.text, r.priority, r.planTime, r.duration, {
      recurRuleId: r.id,
      tags:        [...(r.tags || [])],
      color:       r.color || '',
      note:        r.note || '',
      subtasks:    newSubs,
    }));
  });
}

// ─────────────────────────────────────────────
// ③ 添加/更新/删除重复规则
// ─────────────────────────────────────────────

/**
 * 从任务创建新的重复规则。
 * @param {number} tid    - 任务 ID
 * @param {string} rType  - 'daily' | 'weekly' | 'monthly'
 */
function addRecurRule(tid, rType) {
  rType = rType || 'daily';
  const t = (T[sel] || []).find(x => x.id === tid);
  if (!t) return;

  // 先删除旧规则（若有）
  const oldRid = t.recurRuleId;
  if (oldRid) {
    recurRules = recurRules.filter(r => r.id !== oldRid);
    for (const ds in T) {
      if (ds <= sel) continue;
      T[ds] = T[ds].filter(x => !(x.recurRuleId === oldRid && !x.archived));
      if (!T[ds].length) delete T[ds];
    }
  }

  const rid = 'rr_' + Date.now();
  const dow = parseDS(sel).getDay();

  recurRules.push({
    id:          rid,
    text:        t.text,
    priority:    t.priority,
    planTime:    t.planTime || '',
    duration:    t.duration || 0,
    type:        rType,
    weekdays:    rType === 'weekly' ? [dow] : [],
    monthDay:    parseDS(sel).getDate(),
    startDate:   sel,
    active:      true,
    tags:        [...(t.tags || [])],
    color:       t.color || '',
    note:        t.note || '',
    subtasks:    (t.subtasks || []).map(s => ({ text: s.text })),
  });

  t.recurRuleId = rid;
  save();
  rT();
  rRecurList();
  toast(rType === 'weekly' ? '🔁 已设置每周重复' : '🔁 已设置每日重复');
}

/** 更新规则的某个字段。 */
function updateRecurRule(rid, f, v) {
  const r = recurRules.find(x => x.id === rid);
  if (!r) return;
  r[f] = v;
  save();
  rT();
  rRecurList();
}

/** 切换星期选中状态（用于每周重复规则）。 */
function toggleRecurWeekday(rid, d) {
  const r = recurRules.find(x => x.id === rid);
  if (!r) return;
  const i = (r.weekdays || []).indexOf(d);
  if (i >= 0) {
    r.weekdays.splice(i, 1);
  } else {
    if (!r.weekdays) r.weekdays = [];
    r.weekdays.push(d);
  }
  save();
  rRecurList();
}

/**
 * 删除重复规则，同时清理未来日期的关联任务。
 * @param {string} rid
 * @param {boolean} silent - 是否静默删除（不显示 toast）
 */
function deleteRecurRule(rid, silent) {
  const today = fd(now);
  for (const ds in T) {
    if (ds <= today) continue;
    T[ds] = (T[ds] || []).filter(
      x => !(x.recurRuleId === rid && !x.archived)
    );
    if (T[ds] && !T[ds].length) delete T[ds];
  }
  recurRules = recurRules.filter(r => r.id !== rid);
  for (const ds in T) {
    T[ds].forEach(t => {
      if (t.recurRuleId === rid) t.recurRuleId = '';
    });
  }
  save();
  rT();
  rRecurList();
  rCal();
  if (!silent) toast('🗑️ 规则已删除');
}

// ─────────────────────────────────────────────
// ④ 重复规则列表渲染
// ─────────────────────────────────────────────

/** 渲染设置页面中的重复规则列表。 */
function rRecurList() {
  const el = document.getElementById('recurList');
  if (!recurRules.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">暂无重复规则</div>';
    return;
  }
  el.innerHTML = recurRules.map(r => {
    const tl = r.type === 'daily' ? '每天' : r.type === 'weekly' ? '每周' : '每月';
    return `<div class="recur-rule-item">
      <div class="rr-info">
        <div class="rr-text">${esc(r.text)}</div>
        <div class="rr-meta">${tl}${r.active ? ' · 已开启' : ' · 已暂停'}</div>
      </div>
      <button class="rr-del" onclick="deleteRecurRule('${r.id}')">删除</button>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
// ⑤ 逾期任务处理
// ─────────────────────────────────────────────

/** 返回过去 7 天内的逾期任务（仅今日视图显示）。 */
function getOverdue() {
  const today = fd(now);
  if (sel !== today) return [];
  let r = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = fd(d);
    const tasks = (T[ds] || []).filter(
      t => !t.done && !t.frozen && !t.archived && !t.dismissed
    );
    if (tasks.length) r.push({ date: ds, tasks });
  }
  return r;
}

/** 将逾期任务迁移到今天。 */
function migrateTask(from, id) {
  pushUndo('迁移逾期');
  const a = T[from] || [];
  const i = a.findIndex(t => t.id === id);
  if (i < 0) return;
  const [t] = a.splice(i, 1);
  if (!a.length) delete T[from];
  t.created   = Date.now();
  t.dismissed = false;
  if (!T[sel]) T[sel] = [];
  T[sel].push(t);
  rCal();
  rT();
  save();
  toast('📥 已迁移');
}

/** 放弃某条逾期任务。 */
function abandonTask(from, id) {
  pushUndo('放弃逾期');
  const t = (T[from] || []).find(x => x.id === id);
  if (t) t.dismissed = true;
  rCal();
  rT();
  save();
  toast('🗑️ 已放弃');
}

/** 一次性迁移所有逾期任务到今天。 */
function migrateAllOd() {
  const od = getOverdue();
  if (!od.length) return;
  pushUndo('迁移所有逾期');
  let c = 0;
  od.forEach(g => {
    const toMigrate = (T[g.date] || []).filter(
      t => !t.done && !t.frozen && !t.archived && !t.dismissed
    );
    toMigrate.forEach(t => {
      T[g.date] = T[g.date].filter(x => x.id !== t.id);
      if (!T[g.date].length) delete T[g.date];
      t.created    = Date.now();
      t.dismissed  = false;
      if (!T[sel]) T[sel] = [];
      T[sel].push(t);
      c++;
    });
  });
  rCal();
  rT();
  save();
  toast('📥 已迁移 ' + c + ' 条逾期任务');
}

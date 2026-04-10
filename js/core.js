/**
 * =================================================================
 * core.js - 全局常量 & 全局状态变量
 * =================================================================
 * 所有其他模块共享的常量、全局变量、数据层函数（save/mkTask/getCurrentData），
 * 以及 undo 相关函数。
 * 必须在其他所有模块之前加载。
 * =================================================================
 */

// ─────────────────────────────────────────────
// ① 头像 & UI 常量
// ─────────────────────────────────────────────
const AVATARS = [
  '😊', '😎', '🤓', '🧑‍💻', '👩‍🎨', '👨‍🚀',
  '🦊', '🐱', '🐼', '🌸', '🔥', '💎',
];

const SVG_USER_AVATAR_H =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

const SVG_USER_AVATAR_U =
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

function setHeaderAvatar(av) {
  const h = document.getElementById('headerAvatar');
  if (!h) return;
  if (av === '👤') h.innerHTML = SVG_USER_AVATAR_H;
  else h.textContent = av;
}

function setUdAvatar(av) {
  const h = document.getElementById('udAvatar');
  if (!h) return;
  if (av === '👤') h.innerHTML = SVG_USER_AVATAR_U;
  else h.textContent = av;
}

// ─────────────────────────────────────────────
// ② 日期/显示常量
// ─────────────────────────────────────────────
const WD = ['日', '一', '二', '三', '四', '五', '六'];

const COLORS = [
  '',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

// 默认优先级颜色
const DEFAULT_PRIO_COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
  normal: '#94a3b8',
};

// 优先级模板 ID（用于颜色推荐算法）
const DEFAULT_PRIO_TEMPLATE_IDS = { high: 3 };

// 优先级配色模板库（用于智能推荐颜色）
const PRIO_COLOR_TEMPLATES = [
  { id: 1, hi: '#ef4444', edge: '#991b1b', dark: '#7f1d1d' },
  { id: 2, hi: '#f97316', edge: '#c2410c', dark: '#9a3412' },
  { id: 3, hi: '#eab308', edge: '#a16207', dark: '#854d0e' },
];

// 默认标签
const DEFAULT_TAGS = [
  { id: 'work',     name: '工作',     color: '#3b82f6' },
  { id: 'personal', name: '个人',     color: '#22c55e' },
  { id: 'study',    name: '学习',     color: '#a855f7' },
  { id: 'health',   name: '健康',     color: '#f97316' },
];

// 时间块定义（时间块视图）
const TIME_BLOCKS = [
  { id: 'tb-morning',   name: '🌅 早晨',     from: '00:00', to: '09:00' },
  { id: 'tb-forenoon',  name: '☀️ 上午',     from: '09:00', to: '12:00' },
  { id: 'tb-afternoon', name: '🌤 下午',     from: '12:00', to: '18:00' },
  { id: 'tb-evening',   name: '🌙 晚上',     from: '18:00', to: '24:00' },
  { id: 'tb-unset',     name: '📌 未安排',   from: '',      to: ''      },
];

// ─────────────────────────────────────────────
// ③ 全局状态变量（可写）
// ─────────────────────────────────────────────

// 认证 & 用户
let authToken     = null;
let isGuest       = false;
let currentUser    = null;
let selAvatar     = AVATARS[0];

// 日期/导航状态
let cY, cM, sel;    // 当前年、月、选中的日期字符串（YYYY-MM-DD）
const now = new Date();
cY  = now.getFullYear();
cM  = now.getMonth();
sel = fd(now);

// 任务数据
let T              = {};           // 所有任务数据，key = 日期字符串
let templates      = [];           // 任务模板列表
let sortStates     = {};           // 各日期的自定义排序状态
let recurRules     = [];           // 重复规则
let customTags     = [];           // 自定义标签
let autoArchive    = false;        // 自动归档开关
let showArchivedInList = false;    // 在列表中显示已归档任务

// 优先级
let priorityColors      = { ...DEFAULT_PRIO_COLORS };
let priorityTemplateIds = { ...DEFAULT_PRIO_TEMPLATE_IDS };

// 视图 & 筛选
let showDeadline        = false;   // 显示截止时间
let defaultSortMode     = 'created';
let autoSortEnabled     = false;
let lastSort            = 'created';
let viewMode            = 'list';  // 'list' | 'timeblock'
let FMulti              = new Set(['pending']); // 当前过滤器（多选，OR 逻辑）
let FTag                = '';      // 当前标签筛选
let statP               = 'week';  // 统计周期：week / two / month
let statTag             = '';      // 统计标签筛选

// UI 状态
let isDark              = false;
let multiSelect         = false;
let selectedIds         = new Set();
let editingId           = null;       // 正在编辑文本的任务 ID
let editingTimeId       = null;       // 正在编辑时间的任务 ID
let expandedId          = null;       // 当前展开的任务 ID
let editingSubId         = null;       // 正在编辑子任务文本的 ID
let expandedPanelTab    = 'subtasks'; // 展开面板当前标签页
let subAddComposingId   = null;       // 正在输入子任务的任务 ID
let ppOpenId            = null;       // 推迟面板打开的任务 ID
let taskMoreMenuId      = null;       // 更多菜单打开的任务 ID
let _taskMoreFloatEl    = null;       // 更多菜单浮动层 DOM 引用
let addSplitOpen        = false;      // 添加面板展开状态
let undoStack           = [];
let undoTimer            = null;

// 看板
let kbHideDone    = true;
let kbTimeFilter  = 'all';

// 归档
let archQYear   = '';
let archQMonth  = '';
let archQDay    = '';
let archSearch  = '';
let archYearMap = {};
let odCollapsed = false;   // 逾期区域折叠状态
let collapsedBlocks = {};  // 各时间块的折叠状态

// 导入模板
let customImportTemplates = [
  { id: 1, name: '模板1', content: '' },
  { id: 2, name: '模板2', content: '' },
  { id: 3, name: '模板3', content: '' },
];

// 保存状态
let saveTimer     = null;
let pendingSave   = false;

// 任务切换动画状态
let _togVisualPendingIds       = new Set();    // 视觉上已打勾但尚未提交的 ID 集合
let _togDoneTimer              = null;
let _togPendingDoneId          = null;
let _togCollapseFallbackTimer  = null;
let _togCollapseGen             = 0;           // 递增计数器，用于废弃过期动画回调

// 归档展开状态（页面级持久化）
if (!window._archCollapsed) window._archCollapsed = {};
if (!window._archPages)     window._archPages     = {};

// ─────────────────────────────────────────────
// ④ 数据层函数
// ─────────────────────────────────────────────

/**
 * 创建一条新任务对象。
 * @param {string} text       - 任务文本
 * @param {string} priority   - 优先级：high / medium / low / normal
 * @param {string} planTime   - 计划时间，格式 HH:MM
 * @param {number} duration   - 预计耗时（分钟）
 * @param {object} extra     - 额外字段（recurRuleId / tags / color 等）
 */
function mkTask(text, priority, planTime, duration, extra) {
  return {
    id:          Date.now() + Math.floor(Math.random() * 1e6),
    text,
    done:        false,
    priority:    priority || 'normal',
    created:     Date.now(),
    star:        false,
    planTime:    planTime || '',
    fromTpl:     false,
    note:        '',
    subtasks:    [],
    duration:    parseInt(duration) || 0,
    recurRuleId: '',
    tags:        [],
    color:       '',
    frozen:      false,
    frozenUntil: '',
    status:      'todo',
    archived:    false,
    dismissed:   false,
    ...extra,
  };
}

/** 返回完整导出数据（含订阅列表） */
function getCurrentData() {
  return {
    tasks:               T,
    templates,
    sortStates,
    recurRules,
    customTags,
    autoArchive,
    showArchivedInList,
    priorityColors,
    priorityTemplateIds,
    showDeadline,
    defaultSortMode,
    autoSortEnabled,
    lastSort,
    customImportTemplates,
    subscriptions: JSON.parse(localStorage.getItem('tuole_subs') || '[]'),
  };
}

/** 触发云端或本地保存 */
function save() {
  if (!currentUser) return;
  if (isGuest) {
    try {
      localStorage.setItem('tuole_guest', JSON.stringify(getCurrentData()));
    } catch (e) {}
    return;
  }
  pendingSave = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doCloudSave, 800);
}

/** 异步云端保存 */
async function doCloudSave() {
  if (!pendingSave || !authToken) return;
  updateSyncStatus('saving');
  try {
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + authToken,
      },
      body: JSON.stringify({ data: getCurrentData() }),
    });
    if (r.ok) {
      pendingSave = false;
      updateSyncStatus('saved');
    } else {
      if (r.status === 401) {
        toast('⚠️ 登录已过期');
        doLogout();
        return;
      }
      updateSyncStatus('error');
    }
  } catch (e) {
    updateSyncStatus('error');
  }
}

/** 页面离开前保留一次保存 */
window.addEventListener('beforeunload', () => {
  if (pendingSave && authToken) {
    fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + authToken,
      },
      body: JSON.stringify({ data: getCurrentData() }),
      keepalive: true,
    }).catch(() => {});
  }
});

// ─────────────────────────────────────────────
// ⑤ Undo 相关
// ─────────────────────────────────────────────

/** 将当前 T 快照压入撤销栈 */
function pushUndo(desc) {
  undoStack.push({ desc, snapshot: JSON.parse(JSON.stringify(T)) });
  if (undoStack.length > 30) undoStack.shift();
  showUndo(desc);
}

function showUndo(desc) {
  document.getElementById('undoDesc').textContent = desc;
  document.getElementById('undoBar').classList.add('show');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndo, 6000);
}

function hideUndo() {
  document.getElementById('undoBar').classList.remove('show');
}

/** 从撤销栈弹出并恢复到上一个快照 */
function doUndo() {
  if (!undoStack.length) {
    toast('没有可撤销的操作');
    return;
  }
  flushPendingTogIfAny();
  const l = undoStack.pop();
  T = l.snapshot;
  hideUndo();
  rCal();
  rT();
  save();
  toast('↩️ 已撤销: ' + l.desc);
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    doUndo();
  }
});

// ─────────────────────────────────────────────
// ⑥ 同步状态 UI
// ─────────────────────────────────────────────

function updateSyncStatus(s) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.className = 'sync-ind';
  clearTimeout(window._syncFade);
  switch (s) {
    case 'saving':
      el.style.display = 'inline-flex';
      el.className += ' s-saving';
      el.textContent = '☁️ 同步中…';
      break;
    case 'saved':
      el.style.display = 'inline-flex';
      el.className += ' s-saved';
      el.textContent = '☁️ 已同步';
      window._syncFade = setTimeout(() => { el.style.display = 'none'; }, 3000);
      break;
    case 'error':
      el.style.display = 'inline-flex';
      el.className += ' s-error';
      el.textContent = '⚠️ 同步失败';
      break;
    case 'offline':
      el.style.display = 'inline-flex';
      el.className += ' s-offline';
      el.textContent = '离线';
      break;
    default:
      el.style.display = 'none';
  }
}

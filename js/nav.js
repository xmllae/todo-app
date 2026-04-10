/**
 * =================================================================
 * nav.js - 路由、导航切换、模式切换
 * =================================================================
 * 包含 navigate()、getCurrentPath()、getPathMode()、applyMode()、
 * syncNavHighlight()、滑动指示器 moveModeToggleIndicator() 等。
 * =================================================================
 */

// ─────────────────────────────────────────────
// ① 路由映射
// ─────────────────────────────────────────────

/** 路由路径 → 对应模式（供 applyMode 使用） */
const ROUTE_MAP = {
  '/':           'task',
  '/kanban':     'kanban',
  '/settings':   'settings',
  '/subscriptions': 'settings',
  '/statistics': 'stats',
};

/** 模式 → 路由路径（供 getCurrentPath 使用） */
const MODE_PATH = {
  task:     '/',
  kanban:   '/kanban',
  settings:  '/settings',
  stats:    '/statistics',
};

// ─────────────────────────────────────────────
// ② 路由工具函数
// ─────────────────────────────────────────────

/** 从当前 URL 提取路径（去除末尾日期片段）。 */
function getCurrentPath() {
  const path = location.pathname + location.hash;
  const m = path.match(/^(\/[^/]*)/);
  return m ? m[1] : '/';
}

/** 根据路径返回对应的模式字符串。 */
function getPathMode(path) {
  return ROUTE_MAP[path] || 'task';
}

// ─────────────────────────────────────────────
// ③ 模式切换（核心）
// ─────────────────────────────────────────────

/** 切换页面模式：隐藏所有容器 → 显示目标容器。 */
function applyMode(mode) {
  const modes = ['task', 'kanban', 'settings', 'stats'];
  modes.forEach(id => {
    const el = document.getElementById(id + 'Mode');
    if (el) el.classList.add('hidden');
  });

  if (mode === 'task') {
    const el = document.getElementById('taskMode');
    if (el) el.classList.remove('hidden');
  } else if (mode === 'kanban') {
    const el = document.getElementById('kanbanMode');
    if (el) el.classList.remove('hidden');
    if (typeof rKanban === 'function') rKanban();
  } else if (mode === 'settings') {
    const el = document.getElementById('settingsMode');
    if (el) el.classList.remove('hidden');
    if (typeof rSettings === 'function') rSettings();
    if (typeof rRecurList === 'function') rRecurList();
    if (typeof initSubAlertSettings === 'function') initSubAlertSettings();
    if (typeof rPrioColorSettings === 'function') rPrioColorSettings();
    if (typeof updateSortUI === 'function') updateSortUI();
  } else if (mode === 'stats') {
    const el = document.getElementById('statsMode');
    if (el) el.classList.remove('hidden');
    if (typeof rStats === 'function') rStats();
  }
}

// ─────────────────────────────────────────────
// ④ 导航切换
// ─────────────────────────────────────────────

/**
 * 路由跳转：更新 URL history → 同步高亮 → 切换模式。
 * @param {string} path
 */
function navigate(path) {
  if (!path || path === location.pathname) return;

  // 关闭侧边栏（移动端）
  closeSidebar();

  // 更新地址栏
  history.pushState({ path }, '', path);

  // 同步高亮 + 模式切换
  syncNavHighlight(path);
  applyMode(getPathMode(path));

  // 切换日期视图模式（列表 / 时间块）
  const viewSubBtns = document.querySelectorAll('.vs-btn');
  viewSubBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-view') === viewMode) btn.classList.add('active');
  });

  // 收起移动端更多菜单
  closeTaskMoreFloat();
}

/** 监听浏览器前进/后退。 */
window.addEventListener('popstate', function (e) {
  const path = e.state && e.state.path ? e.state.path : getCurrentPath();
  syncNavHighlight(path);
  applyMode(getPathMode(path));
});

// ─────────────────────────────────────────────
// ⑤ 导航高亮 & 滑动指示器
// ─────────────────────────────────────────────

/**
 * 同步导航栏高亮：路径匹配 → .active 类 + Phosphor 图标 ph/ph-fill 切换。
 * @param {string} path
 */
function syncNavHighlight(path) {
  const normalized = path.replace(/\/+$/, '');
  document.querySelectorAll('#modeToggle .mode-btn').forEach(b => {
    const btnPath = b.dataset.path.replace(/\/+$/, '');
    const isAct = btnPath === normalized;
    b.classList.toggle('active', isAct);
    const ico = b.querySelector('.nav-ph-ico');
    if (ico) {
      ico.classList.toggle('ph', !isAct);
      ico.classList.toggle('ph-fill', isAct);
    }
  });
  const activeBtn = document.querySelector('#modeToggle .mode-btn.active');
  requestAnimationFrame(() => moveModeToggleIndicator(activeBtn));
}

/** 将紫色滑块指示器动画移动到目标按钮位置。 */
function moveModeToggleIndicator(btn) {
  if (!btn) return;
  const wrap  = document.getElementById('modeToggle');
  const bg    = document.getElementById('modeToggleActiveBg');
  if (!wrap || !bg) return;

  const wrapRect  = wrap.getBoundingClientRect();
  const btnRect   = btn.getBoundingClientRect();

  const left  = btnRect.left - wrapRect.left;
  const width = btnRect.width;

  bg.style.left    = left + 'px';
  bg.style.width   = width + 'px';
  bg.style.opacity = '1';
}

// 初始化时若有 hash 路由则跳转
(function () {
  const hash = location.hash;
  if (hash && hash !== '#/') {
    const path = hash.replace(/^#/, '') || '/';
    if (path !== getCurrentPath()) {
      navigate(path);
    }
  }
})();

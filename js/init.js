/**
 * =================================================================
 * init.js - 应用启动 & 初始化
 * =================================================================
 * 包含 init() 入口函数、finishAppBoot() 启动动画，
 * 以及 IIFE 补丁（订阅提醒设置、启动护盾、applyMode 补丁）。
 * 必须在所有其他模块之后加载，最后执行。
 * =================================================================
 */

// ─────────────────────────────────────────────
// ① 订阅提醒设置
// ─────────────────────────────────────────────

function _subAlertGetSettings() {
  return JSON.parse(localStorage.getItem('tuole_subAlert') || '{"enabled":true,"delay":"always","dismissedAt":null}');
}

function _subAlertSave(s) {
  localStorage.setItem('tuole_subAlert', JSON.stringify(s));
}

function toggleSubAlert() {
  var s = _subAlertGetSettings();
  s.enabled = !s.enabled;
  _subAlertSave(s);
  var tog  = document.getElementById('subAlertToggle');
  var opts = document.getElementById('subAlertOptions');
  if (tog)  tog.classList.toggle('on', s.enabled);
  if (opts) opts.style.display = s.enabled ? 'block' : 'none';
  if (s.enabled) {
    window._subBannerDismissed = false;
    if (typeof rSubscriptions === 'function') rSubscriptions();
  }
}

function setSubAlertDelay(v) {
  var s = _subAlertGetSettings();
  s.delay = v;
  s.dismissedAt = null;
  _subAlertSave(s);
  window._subBannerDismissed = false;
  if (typeof rSubscriptions === 'function') rSubscriptions();
}

function _subAlertShouldShow() {
  var s = _subAlertGetSettings();
  if (!s.enabled) return false;
  if (s.delay === 'never') return false;
  if (s.delay === 'always') return true;
  if (!s.dismissedAt) return true;
  var days = +s.delay;
  var diff = (Date.now() - s.dismissedAt) / (1000 * 60 * 60 * 24);
  return diff >= days;
}

function _subAlertDismiss() {
  var s = _subAlertGetSettings();
  s.dismissedAt = Date.now();
  _subAlertSave(s);
  window._subBannerDismissed = true;
  var banner = document.getElementById('subBanner');
  if (banner) banner.innerHTML = '';
}

function initSubAlertSettings() {
  var s   = _subAlertGetSettings();
  var tog  = document.getElementById('subAlertToggle');
  var opts = document.getElementById('subAlertOptions');
  var sel  = document.getElementById('subAlertDelaySel');
  if (tog)  tog.classList.toggle('on', s.enabled);
  if (opts) opts.style.display = s.enabled ? 'block' : 'none';
  if (sel)  sel.value = s.delay || 'always';
}

// ─────────────────────────────────────────────
// ② 启动护盾（防止 JS 执行时序导致的闪屏）
// ─────────────────────────────────────────────

(function () {
  // 创建/获取启动护盾 DOM 节点（覆盖全屏的 loading 遮罩）
  function ensureBootShield() {
    var shield = document.getElementById('appBootShield');
    if (shield) return shield;
    shield = document.createElement('div');
    shield.id = 'appBootShield';
    shield.className = 'loading-screen';
    shield.style.position = 'fixed';
    shield.style.inset = '0';
    shield.style.zIndex = '9999';
    shield.innerHTML = (document.getElementById('loadingScreen') || {}).innerHTML || '';
    document.body.appendChild(shield);
    return shield;
  }

  function showBootShield() {
    ensureBootShield().style.display = 'flex';
  }

  function hideBootShield() {
    var shield = document.getElementById('appBootShield');
    if (shield) shield.style.display = 'none';
  }

  // 补丁：finishAppBoot
  if (typeof finishAppBoot === 'function') {
    finishAppBoot = function () {
      if (window._bootRevealStarted) return;
      window._bootRevealStarted = true;
      var appMain = document.getElementById('appMain');
      var loading = document.getElementById('loadingScreen');
      if (appMain) appMain.classList.add('show', 'app-wrap--booting');
      setTimeout(function () {
        var activeBtn = document.querySelector('#modeToggle .mode-btn.active');
        if (activeBtn && typeof moveModeToggleIndicator === 'function') {
          moveModeToggleIndicator(activeBtn);
        }
        setTimeout(function () {
          if (loading) loading.style.display = 'none';
          if (appMain) appMain.classList.remove('app-wrap--booting');
          hideBootShield();
          window._bootRevealStarted = false;
        }, 16);
      }, 0);
    };
  }

  // 补丁：loginAs
  if (typeof loginAs === 'function') {
    var originalLoginAs = loginAs;
    loginAs = function (user, userData) {
      var appMain = document.getElementById('appMain');
      if (appMain) appMain.classList.add('app-wrap--booting');
      showBootShield();
      var result = originalLoginAs.apply(this, arguments);
      if (typeof finishAppBoot === 'function') finishAppBoot();
      return result;
    };
  }

  // 补丁：doLogout
  if (typeof doLogout === 'function') {
    var originalDoLogout = doLogout;
    doLogout = async function () {
      hideBootShield();
      var appMain = document.getElementById('appMain');
      if (appMain) appMain.classList.remove('app-wrap--booting');
      return originalDoLogout.apply(this, arguments);
    };
  }

  // 安全兜底：若已显示但未 finish 则在下一帧补充
  setTimeout(function ensureBootFinish() {
    var appMain = document.getElementById('appMain');
    if (appMain && appMain.classList.contains('show') &&
        appMain.classList.contains('app-wrap--booting') &&
        typeof finishAppBoot === 'function') {
      finishAppBoot();
    }
  }, 0);
})();

// ─────────────────────────────────────────────
// ③ applyMode 补丁（任务模式布局类）
// ─────────────────────────────────────────────

(function () {
  if (typeof applyMode !== 'function') return;

  function syncAppLayoutMode(mode) {
    var appMain = document.getElementById('appMain');
    if (!appMain) return;
    appMain.classList.toggle('app-wrap--task-wide', mode === 'task');
  }

  var originalApplyMode = applyMode;
  applyMode = function (mode) {
    syncAppLayoutMode(mode);
    return originalApplyMode(mode);
  };

  try {
    if (typeof getPathMode === 'function' && typeof getCurrentPath === 'function') {
      syncAppLayoutMode(getPathMode(getCurrentPath()));
    }
  } catch (e) {}
})();

// ─────────────────────────────────────────────
// ④ 暗色模式初始化
// ─────────────────────────────────────────────

function finishAppBoot() {
  var appMain = document.getElementById('appMain');
  var loading = document.getElementById('loadingScreen');
  if (appMain) {
    appMain.classList.add('show', 'app-wrap--booting');
  }
  requestAnimationFrame(function () {
    var activeBtn = document.querySelector('#modeToggle .mode-btn.active');
    if (activeBtn) moveModeToggleIndicator(activeBtn);
    requestAnimationFrame(function () {
      if (loading) loading.style.display = 'none';
      if (appMain) appMain.classList.remove('app-wrap--booting');
    });
  });
}

// ─────────────────────────────────────────────
// ⑤ 应用主初始化入口
// ─────────────────────────────────────────────

async function init() {
  // 渲染头像选择器
  renderAvatarPicker();

  // 初始化仪表盘拖拽排序
  initTaskDashReorder();

  // 读取暗色模式偏好
  try {
    var dk = localStorage.getItem('tuole_dark');
    if (dk === '1') {
      isDark = true;
      document.body.classList.add('dark');
      setDarkBtnIcon();
    }
  } catch (e) {}

  // 检测是否为 file:// 协议（本地文件模式）
  var isLocal = location.protocol === 'file:';

  // 尝试读取 token
  var token = null;
  try {
    token = localStorage.getItem('tuole_token');
  } catch (e) {}

  // 有 token → 云端认证
  if (token && !isLocal) {
    authToken = token;
    try {
      var r = await fetch('/api/load', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      if (r.ok) {
        var j = await r.json();
        loginAs(j.user, j.data || {});
        return; // 登录成功，结束
      } else if (r.status === 401) {
        try {
          localStorage.removeItem('tuole_token');
        } catch (e) {}
        authToken = null;
      }
    } catch (e) {
      authToken = null;
    }
  }

  // 检查是否为访客模式
  var isGuestMode = false;
  try {
    isGuestMode = localStorage.getItem('tuole_guest_mode') === '1';
  } catch (e) {}

  if (isGuestMode) {
    guestLogin(true);
    return;
  }

  // 无 token 且非访客 → 显示认证界面
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
}

// ─────────────────────────────────────────────
// ⑥ 启动！
// ─────────────────────────────────────────────

init();

/**
 * =================================================================
 * auth.js - 认证、用户菜单、排序设置 & 过滤器 UI
 * =================================================================
 * 包含登录/注册/登出、头像选择、用户下拉菜单、排序设置、
 * 过滤器栏渲染以及暗色模式切换等功能。
 * =================================================================
 */

// ─────────────────────────────────────────────
// ① 头像 & 认证表单
// ─────────────────────────────────────────────

function renderAvatarPicker() {
  document.getElementById('avatarPick').innerHTML = AVATARS
    .map(a => `<div class="avatar-opt${a === selAvatar ? ' sel' : ''}" onclick="pickAvatar('${a}', this)">${a}</div>`)
    .join('');
}

function pickAvatar(a, el) {
  selAvatar = a;
  document.querySelectorAll('#avatarPick .avatar-opt').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
}

function switchAuth(m, btn) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('loginForm').style.display    = m === 'login'    ? 'flex' : 'none';
  document.getElementById('registerForm').style.display = m === 'register' ? 'flex' : 'none';
  document.getElementById('authError').textContent = '';
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  const eyeSvg =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOffSvg =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  btn.innerHTML = inp.type === 'password' ? eyeSvg : eyeOffSvg;
}

function showAuthError(m, isInfo) {
  const el = document.getElementById('authError');
  el.textContent = m;
  el.className   = 'auth-error' + (isInfo ? ' info' : '');
}

// ─────────────────────────────────────────────
// ② 登录 / 注册 / 访客
// ─────────────────────────────────────────────

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw    = document.getElementById('loginPw').value;
  if (!email) { showAuthError('⚠️ 请输入邮箱'); return; }
  if (!pw)    { showAuthError('⚠️ 请输入密码'); return; }
  showAuthError('⏳ 登录中…', true);
  document.getElementById('loginBtn').disabled = true;

  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw }),
    });
    const j = await r.json();
    if (!r.ok) {
      showAuthError('❌ ' + (j.error || '登录失败'));
      document.getElementById('loginBtn').disabled = false;
      return;
    }
    authToken = j.token;
    localStorage.setItem('tuole_token', authToken);
    try { localStorage.removeItem('tuole_guest_mode'); } catch (e) {}

    showAuthError('⏳ 加载数据…', true);
    const lr = await fetch('/api/load', { headers: { 'Authorization': 'Bearer ' + authToken } });
    const ld = await lr.json();
    loginAs(j.user, ld.data || {});
    toast('👋 欢迎回来，' + j.user.name);
  } catch (e) {
    showAuthError('❌ 网络错误');
  } finally {
    document.getElementById('loginBtn').disabled = false;
  }
}

async function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pw    = document.getElementById('regPw').value;
  if (!name) { showAuthError('⚠️ 请输入昵称'); return; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { showAuthError('⚠️ 请输入有效邮箱'); return; }
  if (pw.length < 4) { showAuthError('⚠️ 密码至少4位'); return; }
  showAuthError('⏳ 注册中…', true);
  document.getElementById('regBtn').disabled = true;

  try {
    const r = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw, name, avatar: selAvatar }),
    });
    const j = await r.json();
    if (!r.ok) {
      showAuthError('❌ ' + (j.error || '注册失败'));
      document.getElementById('regBtn').disabled = false;
      return;
    }
    authToken = j.token;
    localStorage.setItem('tuole_token', authToken);
    try { localStorage.removeItem('tuole_guest_mode'); } catch (e) {}
    loginAs(j.user, {});
    toast('🎉 注册成功！');
  } catch (e) {
    showAuthError('❌ 网络错误');
  } finally {
    document.getElementById('regBtn').disabled = false;
  }
}

function guestLogin(silent) {
  let gd = {};
  try {
    const d = localStorage.getItem('tuole_guest');
    if (d) gd = JSON.parse(d);
  } catch (e) {}
  isGuest = true;
  try { localStorage.setItem('tuole_guest_mode', '1'); } catch (e) {}
  loginAs({ id: 0, email: 'guest', name: '游客', avatar: '👤' }, gd);
  if (!silent) toast('📴 离线模式');
}

// ─────────────────────────────────────────────
// ③ 登录成功后初始化应用（loginAs）
// ─────────────────────────────────────────────

function loginAs(user, userData) {
  currentUser = user;
  if (!isGuest) isGuest = false;

  // 从用户数据恢复全局状态
  T               = userData.tasks || {};
  templates       = userData.templates || [];
  sortStates      = userData.sortStates || {};
  recurRules      = userData.recurRules || [];
  customTags      = userData.customTags && userData.customTags.length
                    ? userData.customTags : [...DEFAULT_TAGS];
  autoArchive               = userData.autoArchive || false;
  showArchivedInList        = userData.showArchivedInList || false;
  priorityColors            = userData.priorityColors
                               ? { ...DEFAULT_PRIO_COLORS, ...userData.priorityColors }
                               : { ...DEFAULT_PRIO_COLORS };
  priorityTemplateIds       = userData.priorityTemplateIds
                               ? { ...DEFAULT_PRIO_TEMPLATE_IDS, ...userData.priorityTemplateIds }
                               : { ...DEFAULT_PRIO_TEMPLATE_IDS };

  if (userData.priorityTemplateIds === undefined) inferPrioTemplatesFromColors();
  syncPriorityColorsFromTemplates();

  showDeadline      = userData.showDeadline || false;
  defaultSortMode   = userData.defaultSortMode || 'high-first';
  autoSortEnabled   = userData.autoSortEnabled || false;

  customImportTemplates = userData.customImportTemplates || [
    { id: 1, name: '模板1', content: '' },
    { id: 2, name: '模板2', content: '' },
    { id: 3, name: '模板3', content: '' },
  ];

  if (userData.subscriptions && Array.isArray(userData.subscriptions)) {
    localStorage.setItem('tuole_subs', JSON.stringify(userData.subscriptions));
  }

  lastSort = (userData.lastSort !== undefined && userData.lastSort !== null && userData.lastSort !== '')
             ? normalizeSortMode(userData.lastSort)
             : normalizeSortMode(userData.defaultSortMode || 'created');

  updatePrioVars();
  setHeaderAvatar(user.avatar);
  document.getElementById('headerName').textContent = user.name;
  setUdAvatar(user.avatar);
  document.getElementById('udName').textContent   = user.name;
  document.getElementById('udEmail').textContent  = isGuest ? '📴 离线模式' : user.email;

  document.getElementById('authScreen').style.display  = 'none';
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('appMain').classList.add('show');

  // 重置运行时状态
  cY  = now.getFullYear();
  cM  = now.getMonth();
  sel = fd(now);
  FMulti = new Set(['pending']);
  FTag = '';
  editingId           = null;
  expandedId          = null;
  multiSelect         = false;
  selectedIds.clear();
  undoStack           = [];
  archQYear           = '';
  archQMonth          = '';
  archQDay            = '';
  archSearch           = '';
  kbHideDone   = true;
  kbTimeFilter = 'all';
  window._archCollapsed = {};
  window._archPages     = {};

  checkAutoArchive();

  const _initPath = getCurrentPath();
  try {
    if (location.protocol !== 'file:') history.replaceState({ path: _initPath }, '', _initPath);
  } catch (e) {}

  syncNavHighlight(_initPath);
  applyMode(getPathMode(_initPath));
  setTimeout(() => {
    const b = document.querySelector('#modeToggle .mode-btn.active');
    if (b) moveModeToggleIndicator(b);
  }, 50);
  rCal();

  document.getElementById('archToggle').classList.toggle('on', autoArchive);
  document.getElementById('showArchToggle').classList.toggle('on', showArchivedInList);
  document.getElementById('deadlineToggle').classList.toggle('on', showDeadline);
  document.getElementById('defaultSortSel').value    = defaultSortMode;
  document.getElementById('autoSortToggle').classList.toggle('on', autoSortEnabled);
  rPrioColorSettings();
  updateSyncStatus(isGuest ? 'offline' : 'saved');
}

// ─────────────────────────────────────────────
// ④ 登出 & 账户切换
// ─────────────────────────────────────────────

async function doLogout() {
  if (authToken && !isGuest) {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + authToken },
      });
    } catch (e) {}
  }
  currentUser  = null;
  authToken    = null;
  isGuest      = false;
  pendingSave  = false;
  try {
    localStorage.removeItem('tuole_token');
    localStorage.removeItem('tuole_guest_mode');
  } catch (e) {}

  document.getElementById('appMain').classList.remove('show');
  document.getElementById('authScreen').style.display = 'flex';
  closeUserMenu();
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPw').value    = '';
  document.getElementById('authError').textContent = '';
  updateSyncStatus('');
}

function switchAccount() {
  closeUserMenu();
  doLogout();
}

// ─────────────────────────────────────────────
// ⑤ 用户下拉菜单
// ─────────────────────────────────────────────

function toggleUserMenu() {
  const d = document.getElementById('userDropdown');
  const m = document.getElementById('udMask');
  if (d.classList.contains('show')) {
    closeUserMenu();
  } else {
    d.classList.add('show');
    m.classList.add('show');
    updateUserStats();
    document.body.style.overflow = 'hidden';
  }
}

function closeUserMenu() {
  document.getElementById('userDropdown').classList.remove('show');
  document.getElementById('udMask').classList.remove('show');
  document.body.style.overflow = '';
}

/** 全局点击兜底：自动关闭菜单和下拉。 */
document.addEventListener('click', e => {
  // 用户菜单
  if (window.innerWidth > 640) {
    const m = document.getElementById('userMenu');
    if (m && !m.contains(e.target)) closeUserMenu();
  }
  // 排序下拉
  const sw = document.getElementById('sortWrap');
  if (sw && !sw.contains(e.target)) {
    document.getElementById('sortDropdown').classList.remove('show');
  }
  // 标签筛选下拉
  const tw = document.getElementById('tagFilterWrap');
  if (tw && !tw.contains(e.target)) {
    document.getElementById('tagDropdown').classList.remove('show');
  }
  // 推迟面板
  if (ppOpenId !== null &&
      !e.target.closest('.pp-drop') &&
      !e.target.closest('.act-btn-pp')) {
    ppOpenId = null;
    rT();
  }
  // 优先级选择器
  if (prioTplPickerOpen !== null &&
      !e.target.closest('.prio2-picker') &&
      !e.target.closest('.prio2-btn-pick')) {
    prioTplPickerOpen = null;
    rPrioColorSettings();
  }
});

function updateUserStats() {
  let t = 0, d = 0;
  for (const ds in T) {
    T[ds].forEach(x => {
      t++;
      if (x.done) d++;
    });
  }
  document.getElementById('udTotal').textContent = t;
  document.getElementById('udDone').textContent  = d;
}

// ─────────────────────────────────────────────
// ⑥ 个人资料修改
// ─────────────────────────────────────────────

function showProfile() {
  closeUserMenu();
  document.getElementById('mBody').innerHTML = `
    <p style="font-weight:600;font-size:1.05rem;margin-bottom:10px">✏️ 修改资料</p>
    <div class="copy-field">
      <label>昵称</label>
      <input type="text" id="editName" value="${esc(currentUser.name)}" maxlength="12">
    </div>
    <div class="copy-field">
      <label>头像</label>
      <div class="avatar-pick" id="editAP" style="margin-top:3px"></div>
    </div>
    <div class="copy-field">
      <label>新密码（留空不改）</label>
      <input type="password" id="editPw" placeholder="新密码">
    </div>
    <div class="modal-actions">
      <button class="mbtn-c" onclick="clM()">取消</button>
      <button class="mbtn-a" onclick="saveProfile()">保存</button>
    </div>
  `;
  document.getElementById('mBg').classList.add('show');
  document.getElementById('editAP').innerHTML = AVATARS
    .map(x => `<div class="avatar-opt${x === currentUser.avatar ? ' sel' : ''}"
                 onclick="window._eA='${x}';this.parentNode.querySelectorAll('.avatar-opt').forEach(e=>e.classList.remove('sel'));this.classList.add('sel')">${x}</div>`)
    .join('');
  window._eA = currentUser.avatar;
}

async function saveProfile() {
  const n  = document.getElementById('editName').value.trim();
  const pw = document.getElementById('editPw').value;
  const av = window._eA || currentUser.avatar;

  if (!n) { toast('⚠️ 昵称不能为空'); return; }
  if (pw && pw.length < 4) { toast('⚠️ 密码至少4位'); return; }

  // 访客模式直接本地更新
  if (isGuest) {
    currentUser.name   = n;
    currentUser.avatar = av;
    setHeaderAvatar(av);
    document.getElementById('headerName').textContent = n;
    setUdAvatar(av);
    document.getElementById('udName').textContent = n;
    clM();
    toast('✅ 已更新');
    return;
  }

  try {
    const r = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + authToken,
      },
      body: JSON.stringify({ name: n, avatar: av, newPassword: pw || undefined }),
    });
    const j = await r.json();
    if (!r.ok) { toast('❌ ' + (j.error || '更新失败')); return; }
    currentUser = j.user;
    if (j.newToken) {
      authToken = j.newToken;
      localStorage.setItem('tuole_token', authToken);
    }
    setHeaderAvatar(currentUser.avatar);
    document.getElementById('headerName').textContent = currentUser.name;
    setUdAvatar(currentUser.avatar);
    document.getElementById('udName').textContent = currentUser.name;
    clM();
    toast('✅ 已更新');
  } catch (e) {
    toast('❌ 网络错误');
  }
}

// ─────────────────────────────────────────────
// ⑦ 截止时间开关
// ─────────────────────────────────────────────

function toggleDeadline() {
  showDeadline = !showDeadline;
  document.getElementById('deadlineToggle').classList.toggle('on', showDeadline);
  rT();
  save();
  toast(showDeadline ? '⏰ 截止时间已开启' : '⏰ 截止时间已关闭');
}

// ─────────────────────────────────────────────
// ⑧ 排序相关
// ─────────────────────────────────────────────

function setDefaultSort(mode) {
  mode = normalizeSortMode(mode);
  defaultSortMode = mode;
  lastSort       = mode;
  save();
  const names = { created: '创建时间', deadline: '截止日期', priority: '优先级' };
  toast('🔀 默认排序: ' + (names[mode] || mode));
  var ds = document.getElementById('defaultSortSel');
  if (ds) ds.value = mode;
}

function toggleAutoSort() {
  autoSortEnabled = !autoSortEnabled;
  document.getElementById('autoSortToggle').classList.toggle('on', autoSortEnabled);
  rT();
  save();
  toast(autoSortEnabled ? '🔀 自动排序已开启' : '🔀 自动排序已关闭');
}

function sortDisplayList(arr, mode) {
  mode = normalizeSortMode(mode);
  return arr.sort((a, b) => {
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    if (mode === 'priority') {
      const PH2 = { high: 0, medium: 1, normal: 1, low: 2 };
      const pa = PH2[a.priority] ?? 1;
      const pb = PH2[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      return (b.created || 0) - (a.created || 0);
    }
    if (mode === 'created') return (b.created || 0) - (a.created || 0);
    if (mode === 'deadline') {
      const ka = deadlineSortKey(a);
      const kb = deadlineSortKey(b);
      if (ka == null && kb == null) return (b.created || 0) - (a.created || 0);
      if (ka == null) return 1;
      if (kb == null) return -1;
      if (ka !== kb) return ka - kb;
      return (b.created || 0) - (a.created || 0);
    }
    return (b.created || 0) - (a.created || 0);
  });
}

function hydrateSortModes() {
  defaultSortMode = normalizeSortMode(defaultSortMode);
  lastSort       = normalizeSortMode(lastSort);
  var o = {};
  Object.keys(sortStates || {}).forEach(function (k) { o[k] = normalizeSortMode(sortStates[k]); });
  sortStates = o;
  var ds = document.getElementById('defaultSortSel');
  if (ds) ds.value = defaultSortMode;
}

function normalizeSortMode(m) {
  if (!m) return 'created';
  const map = { reset: 'created', 'high-first': 'priority', 'low-first': 'priority', 'time-first': 'deadline' };
  if (map[m]) return map[m];
  if (m === 'created' || m === 'deadline' || m === 'priority') return m;
  return 'created';
}

// ─────────────────────────────────────────────
// ⑨ 过滤器栏渲染（待办/已完成 分段 + 高级筛选）
// ─────────────────────────────────────────────

function taskMatchesFilterKey(t, key) {
  if (key === 'all')     return !t.frozen;
  if (key === 'pending') return !t.done && !t.frozen;
  if (key === 'done')    return t.done;
  if (key === 'high')    return t.priority === 'high';
  if (key === 'frozen')  return t.frozen;
  return !t.frozen;
}

function passesFMulti(t) {
  for (var k of FMulti) if (taskMatchesFilterKey(t, k)) return true;
  if (FMulti.size === 1 && FMulti.has('done') && _togPendingDoneId != null && _togPendingDoneId === t.id) return true;
  return false;
}

function applyBatchBarPanelState() {
  var ap = document.getElementById('addSplitPanel');
  var ac = document.querySelector('.add-split-chev');
  if (ap) ap.classList.toggle('open', addSplitOpen);
  if (ac) {
    ac.classList.toggle('open', addSplitOpen);
    ac.setAttribute('aria-expanded', addSplitOpen ? 'true' : 'false');
  }
}

function toggleAddSplitMenu(e) {
  if (e) e.stopPropagation();
  addSplitOpen = !addSplitOpen;
  applyBatchBarPanelState();
}

function closeAddSplitMenu() {
  addSplitOpen = false;
  applyBatchBarPanelState();
}

function toggleFFilter(key) {
  var s = new Set(FMulti);
  if (key === 'all') {
    FMulti = new Set(['all']);
  } else {
    s.delete('all');
    if (s.has(key)) s.delete(key);
    else s.add(key);
    if (s.size === 0) s.add('all');
    FMulti = s;
  }
  if (_togPendingDoneId != null) {
    flushPendingTogIfAny();
    return;
  }
  rT();
}

function setF(val) {
  FMulti = new Set([val]);
  if (_togPendingDoneId != null) {
    flushPendingTogIfAny();
    return;
  }
  rT();
}

function rFilterBar() {
  var taskFilter = document.getElementById('filterBar');
  var advEl     = document.getElementById('batchMoreAdv');
  if (!taskFilter) return;

  var keepAdd = addSplitOpen;
  FMulti.delete('starred');
  FMulti.delete('star');
  if (FMulti.size === 0) FMulti = new Set(['pending']);

  var dt = T[sel] || [];
  var nonArchived = dt.filter(function (t) { return !t.archived; });

  function filterCount(fkey) {
    var fl;
    if (fkey === 'pending') fl = nonArchived.filter(function (t) { return !t.done && !t.frozen; });
    else if (fkey === 'done') fl = nonArchived.filter(function (t) { return t.done || (_togPendingDoneId != null && _togPendingDoneId === t.id); });
    else if (fkey === 'high') fl = nonArchived.filter(function (t) { return t.priority === 'high'; });
    else if (fkey === 'frozen') fl = dt.filter(function (t) { return t.frozen && !t.archived; });
    else fl = nonArchived.filter(function (t) { return !t.frozen; });
    if (FTag) fl = fl.filter(function (t) { return (t.tags || []).indexOf(FTag) >= 0; });
    return fl.length;
  }

  var freezeSvg = '<svg class="filter-ico-freeze" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>';
  var fcPen = filterCount('pending');
  var fcDon = filterCount('done');
  var pendOn = FMulti.size === 1 && FMulti.has('pending');
  var doneOn = FMulti.size === 1 && FMulti.has('done');

  var segEl     = taskFilter.querySelector('.filter-seg');
  var segBtnArr = [];
  if (segEl) {
    for (var _si = 0; _si < segEl.children.length; _si++) {
      var _ch = segEl.children[_si];
      if (_ch && _ch.tagName === 'BUTTON' && _ch.classList && _ch.classList.contains('filter-seg-btn')) {
        segBtnArr.push(_ch);
      }
    }
  }

  if (segEl && segBtnArr.length === 2) {
    function patchFilterSegBtn(btn, on, cnt) {
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      var bd = btn.querySelector('.filter-seg-badge');
      if (bd) {
        bd.textContent = String(cnt);
        bd.classList.toggle('filter-seg-badge--on', on);
      }
    }
    patchFilterSegBtn(segBtnArr[0], pendOn, fcPen);
    patchFilterSegBtn(segBtnArr[1], doneOn, fcDon);
  } else {
    taskFilter.innerHTML =
      '<div class="filter-seg" role="tablist" aria-label="任务筛选">' +
      '<button type="button" role="tab" class="filter-seg-btn' + (pendOn ? ' is-active' : '') + '" aria-selected="' + (pendOn ? 'true' : 'false') + '" onclick="setF(\'pending\')">' +
      '<span class="filter-seg-label">待办</span>' +
      '<span class="filter-seg-badge' + (pendOn ? ' filter-seg-badge--on' : '') + '">' + fcPen + '</span>' +
      '</button>' +
      '<button type="button" role="tab" class="filter-seg-btn' + (doneOn ? ' is-active' : '') + '" aria-selected="' + (doneOn ? 'true' : 'false') + '" onclick="setF(\'done\')">' +
      '<span class="filter-seg-label">已完成</span>' +
      '<span class="filter-seg-badge' + (doneOn ? ' filter-seg-badge--on' : '') + '">' + fcDon + '</span>' +
      '</button></div>';
  }

  var ADV = [
    { html: '全部',    value: 'all' },
    { html: '高优先',  value: 'high' },
    { html: freezeSvg + '冻结', value: 'frozen' },
  ];

  if (advEl) {
    advEl.innerHTML = ADV.map(function (f) {
      var on  = FMulti.has(f.value);
      var chk = '<span class="fdd-chk' + (on ? ' on' : '') + '">' + (on ? '✓' : '') + '</span>';
      var cls = 'filter-dd-row filter-adv-row';
      if (f.value === 'high') cls += ' fp-high';
      return '<button type="button" class="' + cls + '" onclick="event.stopPropagation();toggleFFilter(\'' + f.value + '\')">' + chk + '<span class="fdd-lbl">' + f.html + '</span></button>';
    }).join('');
  }

  addSplitOpen = keepAdd;
  applyBatchBarPanelState();
}

// 事件兜底：点击空白处关闭添加面板 & 任务更多菜单
if (!window._batchBarClickOutside) {
  window._batchBarClickOutside = true;
  document.addEventListener('click', function (e) {
    if (addSplitOpen) {
      if (e.target.closest && e.target.closest('.add-split')) return;
      addSplitOpen = false;
      applyBatchBarPanelState();
    }
  });
  document.addEventListener('click', function (e) {
    if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
    if (e.target.closest && (e.target.closest('.task-more-wrap') || e.target.closest('.task-more-float'))) return;
    if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
    taskMoreMenuId = null;
  }, true);
  if (!window._taskMoreScrollClose) {
    window._taskMoreScrollClose = true;
    document.addEventListener('scroll', function () {
      if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
      if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
      taskMoreMenuId = null;
    }, true);
  }
}

// 自动在 rT 后合并刷新过滤器栏（避免分段按钮的 mousedown→click 竞态导致 innerHTML 置换吞掉点击）
(function () {
  var _origRT = rT;
  var _fbSch  = null;
  rT = function () {
    _origRT.apply(this, arguments);
    if (typeof rFilterBar !== 'function') return;
    if (_fbSch != null) clearTimeout(_fbSch);
    _fbSch = setTimeout(function () { _fbSch = null; rFilterBar(); }, 0);
  };
})();

// ─────────────────────────────────────────────
// ⑩ 暗色模式
// ─────────────────────────────────────────────

const SVG_MOON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const SVG_SUN =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

function setDarkBtnIcon() {
  const w = document.querySelector('#darkBtn .dark-btn-ico');
  if (w) w.innerHTML = isDark ? SVG_SUN : SVG_MOON;
}

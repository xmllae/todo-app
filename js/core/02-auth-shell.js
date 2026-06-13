// Authentication flow, session bootstrap, and account shell helpers.

const AUTH_STORAGE_KEYS = window.TuoleApi.STORAGE_KEYS;
const AUTH_EVENTS = window.TuoleApi.EVENTS;
const readStoredValue = window.TuoleApi.storage.readValue;
const writeStoredValue = window.TuoleApi.storage.writeValue;
const removeStoredValue = window.TuoleApi.storage.removeValue;
const readStoredJson = window.TuoleApi.storage.readJson;
const writeStoredJson = window.TuoleApi.storage.writeJson;
const createAuthFlowError = window.TuoleApi.createError;
const requestApi = window.TuoleApi.request;
const getAuthHeader = window.TuoleApi.getAuthHeader;
const getUserFacingMessage = window.TuoleApi.getUserMessage;

const AUTH_EYE_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

const AUTH_EYE_OFF_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

function getAuthElement(id) {
  return document.getElementById(id);
}

function emitAuthEvent(name, detail) {
  document.dispatchEvent(
    new CustomEvent(name, {
      detail: detail || {}
    })
  );
}

function cloneDefaultImportTemplates() {
  return [
    { id: 1, name: "模板1", content: "" },
    { id: 2, name: "模板2", content: "" },
    { id: 3, name: "模板3", content: "" }
  ];
}

function normalizeSessionUser(user) {
  const source = user && typeof user === "object" ? user : {};
  return {
    id: source.id != null ? source.id : 0,
    email: typeof source.email === "string" ? source.email : "",
    name: typeof source.name === "string" && source.name.trim() ? source.name : "用户",
    avatar:
      typeof source.avatar === "string" && source.avatar.trim() ? source.avatar : "👤"
  };
}

function syncSupplementalUserStores(data) {
  if (Array.isArray(data.subscriptions)) {
    writeStoredJson(AUTH_STORAGE_KEYS.subscriptions, data.subscriptions);
  }

  if (typeof window.clearLongTermGoalsStorage === "function") {
    window.clearLongTermGoalsStorage();
  }

  if (
    Array.isArray(data.longTermGoals) &&
    typeof window.writeLongTermGoalsToStorage === "function"
  ) {
    window.writeLongTermGoalsToStorage(data.longTermGoals);
  }
}

function applySessionData(userData) {
  const data = userData && typeof userData === "object" ? userData : {};

  T = data.tasks || {};
  templates = Array.isArray(data.templates) ? data.templates : [];
  sortStates = data.sortStates || {};
  recurRules = Array.isArray(data.recurRules) ? data.recurRules : [];
  customTags =
    Array.isArray(data.customTags) && data.customTags.length
      ? data.customTags
      : [...DEFAULT_TAGS];
  autoArchive = !!data.autoArchive;
  showArchivedInList = !!data.showArchivedInList;
  priorityColors = data.priorityColors
    ? { ...DEFAULT_PRIO_COLORS, ...data.priorityColors }
    : { ...DEFAULT_PRIO_COLORS };
  priorityTemplateIds = data.priorityTemplateIds
    ? { ...DEFAULT_PRIO_TEMPLATE_IDS, ...data.priorityTemplateIds }
    : { ...DEFAULT_PRIO_TEMPLATE_IDS };

  if (data.priorityTemplateIds === undefined) {
    inferPrioTemplatesFromColors();
  }

  syncPriorityColorsFromTemplates();

  showDeadline = !!data.showDeadline;
  defaultSortMode = data.defaultSortMode || "high-first";
  autoSortEnabled = !!data.autoSortEnabled;
  customImportTemplates =
    Array.isArray(data.customImportTemplates) && data.customImportTemplates.length
      ? data.customImportTemplates
      : cloneDefaultImportTemplates();
  lastSort =
    data.lastSort !== undefined && data.lastSort !== null && data.lastSort !== ""
      ? normalizeSortMode(data.lastSort)
      : normalizeSortMode(data.defaultSortMode || "created");

  syncSupplementalUserStores(data);
  updatePrioVars();
}

function syncAccountShell(user) {
  setHeaderAvatar(user.avatar);
  setUdAvatar(user.avatar);

  const nameElement = getAuthElement("udName");
  const emailElement = getAuthElement("udEmail");

  if (nameElement) {
    nameElement.textContent = user.name;
  }

  if (emailElement) {
    emailElement.textContent = isGuest ? "📴 离线模式" : user.email;
  }
}

function syncSessionPreferenceUi() {
  if (typeof syncImportedSettingsUI === "function") {
    syncImportedSettingsUI();
  } else {
    const archToggle = getAuthElement("archToggle");
    const showArchToggle = getAuthElement("showArchToggle");
    const deadlineToggle = getAuthElement("deadlineToggle");
    const defaultSortSelect = getAuthElement("defaultSortSel");
    const autoSortToggle = getAuthElement("autoSortToggle");

    if (archToggle) {
      archToggle.classList.toggle("on", autoArchive);
    }

    if (showArchToggle) {
      showArchToggle.classList.toggle("on", showArchivedInList);
    }

    if (deadlineToggle) {
      deadlineToggle.classList.toggle("on", showDeadline);
    }

    if (defaultSortSelect) {
      defaultSortSelect.value = defaultSortMode;
    }

    if (autoSortToggle) {
      autoSortToggle.classList.toggle("on", autoSortEnabled);
    }
  }

  if (typeof rPrioColorSettings === "function") {
    rPrioColorSettings();
  }
}

function readStartupNavState() {
  const savedState = readStoredJson(AUTH_STORAGE_KEYS.sideNavState, null);
  const ds =
    savedState &&
    typeof savedState.ds === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(savedState.ds)
      ? savedState.ds
      : fd(now);
  const quick = savedState && typeof savedState.quick === "string" ? savedState.quick : "";
  return {
    ds: ds,
    quick: quick
  };
}

function resetTransientViewState(navState) {
  const startupNav = navState || readStartupNavState();
  const startupDate = parseDS(startupNav.ds);

  cY = startupDate.getFullYear();
  cM = startupDate.getMonth();
  sel = startupNav.ds;

  if (typeof setGlobalSideNavQuickMode === "function") {
    setGlobalSideNavQuickMode(startupNav.quick, true);
  }

  F = "all";
  FTag = "";
  editingId = null;
  expandedId = null;
  multiSelect = false;
  selectedIds.clear();
  undoStack = [];
  archQYear = "";
  archQMonth = "";
  archQDay = "";
  archSearch = "";
  kbHideDone = true;
  kbTimeFilter = "all";
  window._archCollapsed = {};
  window._archPages = {};

  checkAutoArchive();
}

function showAuthenticatedShell() {
  const authScreen = getAuthElement("authScreen");
  const loadingScreen = getAuthElement("loadingScreen");
  const appMain = getAuthElement("appMain");

  if (authScreen) {
    authScreen.style.display = "none";
  }

  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }

  if (appMain) {
    appMain.classList.add("show");
  }
}

function showUnauthenticatedShell() {
  const authScreen = getAuthElement("authScreen");
  const loadingScreen = getAuthElement("loadingScreen");
  const appMain = getAuthElement("appMain");

  if (appMain) {
    appMain.classList.remove("show");
  }

  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }

  if (authScreen) {
    authScreen.style.display = "flex";
  }

  clearAuthError();
}

function setSessionToken(token, persist) {
  authToken = token || null;

  if (persist && token) {
    writeStoredValue(AUTH_STORAGE_KEYS.token, token);
  }
}

function clearStoredSession() {
  removeStoredValue(AUTH_STORAGE_KEYS.token);
  removeStoredValue(AUTH_STORAGE_KEYS.guestMode);
}

function resolveLoadedSessionUser(payload, fallbackUser) {
  const candidate = payload && payload.user ? payload.user : fallbackUser;

  if (!candidate) {
    throw createAuthFlowError("加载数据成功，但缺少用户信息");
  }

  return normalizeSessionUser(candidate);
}

async function loadCloudSession(token, fallbackUser) {
  const payload = await requestApi(
    "load",
    {
      headers: getAuthHeader(token)
    },
    "加载数据"
  );

  return {
    user: resolveLoadedSessionUser(payload, fallbackUser),
    data: payload && payload.data ? payload.data : {}
  };
}

async function restoreCloudSession() {
  const token = readStoredValue(AUTH_STORAGE_KEYS.token);

  if (!token || location.protocol === "file:") {
    return false;
  }

  setSessionToken(token, false);

  try {
    const session = await loadCloudSession(token);
    loginAs(session.user, session.data);
    return true;
  } catch (error) {
    authToken = null;

    if (error && error.status === 401) {
      clearStoredSession();
    }

    return false;
  }
}

function restoreGuestSession() {
  const isGuestMode = readStoredValue(AUTH_STORAGE_KEYS.guestMode) === "1";

  if (!isGuestMode) {
    return false;
  }

  guestLogin(true);
  return true;
}

async function restoreSessionOnStartup() {
  if (await restoreCloudSession()) {
    return true;
  }

  if (restoreGuestSession()) {
    return true;
  }

  showUnauthenticatedShell();
  return false;
}

function renderAvatarPicker() {
  const avatarPick = getAuthElement("avatarPick");

  if (!avatarPick) {
    return;
  }

  avatarPick.innerHTML = AVATARS.map(function renderAvatarOption(avatar) {
    const isSelected = avatar === selAvatar ? " sel" : "";
    return `<div class="avatar-opt${isSelected}" onclick="pickAvatar('${avatar}',this)">${avatar}</div>`;
  }).join("");
}

function pickAvatar(avatar, element) {
  selAvatar = avatar;
  document.querySelectorAll("#avatarPick .avatar-opt").forEach(function clearAvatarState(node) {
    node.classList.remove("sel");
  });

  if (element) {
    element.classList.add("sel");
  }
}

function switchAuth(mode, button) {
  document.querySelectorAll(".auth-tab").forEach(function toggleAuthTab(tab) {
    tab.classList.remove("active");
  });

  if (button && button.classList) {
    button.classList.add("active");
  } else {
    const fallbackSelector = mode === "register" ? ".auth-tab:nth-child(2)" : ".auth-tab:nth-child(1)";
    const fallbackButton = document.querySelector(fallbackSelector);
    if (fallbackButton) {
      fallbackButton.classList.add("active");
    }
  }

  const loginForm = getAuthElement("loginForm");
  const registerForm = getAuthElement("registerForm");

  if (loginForm) {
    loginForm.style.display = mode === "login" ? "flex" : "none";
  }

  if (registerForm) {
    registerForm.style.display = mode === "register" ? "flex" : "none";
  }

  clearAuthError();
}

function togglePw(id, button) {
  const input = getAuthElement(id);

  if (!input) {
    return;
  }

  input.type = input.type === "password" ? "text" : "password";

  if (button) {
    button.innerHTML = input.type === "password" ? AUTH_EYE_SVG : AUTH_EYE_OFF_SVG;
  }
}

function showAuthError(message, isInfo) {
  const errorElement = getAuthElement("authError");

  if (!errorElement) {
    return;
  }

  errorElement.textContent = message || "";
  errorElement.className = `auth-error${isInfo ? " info" : ""}`;
}

function clearAuthError() {
  showAuthError("", false);
}

function setAuthButtonBusy(buttonId, isBusy) {
  const button = getAuthElement(buttonId);

  if (button) {
    button.disabled = !!isBusy;
  }
}

function readTrimmedInput(id) {
  const input = getAuthElement(id);
  return input ? input.value.trim() : "";
}

function readRawInput(id) {
  const input = getAuthElement(id);
  return input ? input.value : "";
}

function clearAuthForms() {
  const fields = ["loginEmail", "loginPw", "regName", "regEmail", "regPw"];

  fields.forEach(function resetAuthField(id) {
    const field = getAuthElement(id);
    if (field) {
      field.value = "";
    }
  });

  selAvatar = AVATARS[0];
  renderAvatarPicker();
  switchAuth("login", document.querySelector(".auth-tab"));
}

function createGuestUser() {
  return {
    id: 0,
    email: "guest",
    name: "游客",
    avatar: "👤"
  };
}

function loginAs(user, userData) {
  currentUser = normalizeSessionUser(user);
  isGuest = !!(isGuest && currentUser.id === 0);

  applySessionData(userData);
  syncAccountShell(currentUser);
  showAuthenticatedShell();
  resetTransientViewState();

  const initPath = getCurrentPath();

  try {
    if (location.protocol !== "file:") {
      history.replaceState({ path: initPath }, "", initPath);
    }
  } catch (error) {}

  syncNavHighlight(initPath);
  applyMode(getPathMode(initPath));

  const activeModeButton = document.querySelector("#modeToggle .mode-btn.active");
  if (activeModeButton) {
    moveModeToggleIndicator(activeModeButton, true);
  }

  rCal();
  syncSessionPreferenceUi();
  updateSyncStatus(isGuest ? "offline" : "saved");

  emitAuthEvent(AUTH_EVENTS.sessionReady, {
    user: currentUser,
    userData: userData || {},
    isGuest: isGuest
  });
}

async function doLogin() {
  const email = readTrimmedInput("loginEmail");
  const password = readRawInput("loginPw");

  if (!email) {
    showAuthError("⚠️ 请输入邮箱");
    return;
  }

  if (!password) {
    showAuthError("⚠️ 请输入密码");
    return;
  }

  showAuthError("⏳ 登录中…", true);
  setAuthButtonBusy("loginBtn", true);

  try {
    const loginPayload = await requestApi(
      "login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      },
      "登录"
    );

    const token =
      typeof loginPayload.token === "string" && loginPayload.token.trim()
        ? loginPayload.token.trim()
        : "";

    if (!token) {
      throw createAuthFlowError("登录成功，但服务器未返回 token");
    }

    const loginUser = normalizeSessionUser(loginPayload.user);

    setSessionToken(token, true);
    removeStoredValue(AUTH_STORAGE_KEYS.guestMode);

    showAuthError("⏳ 加载数据…", true);

    const loadedSession = await loadCloudSession(token, loginUser);
    loginAs(loadedSession.user, loadedSession.data);
    toast("👋 欢迎回来，" + loadedSession.user.name);
  } catch (error) {
    showAuthError("❌ " + getUserFacingMessage(error, "登录失败"));
  } finally {
    setAuthButtonBusy("loginBtn", false);
  }
}

async function doRegister() {
  const name = readTrimmedInput("regName");
  const email = readTrimmedInput("regEmail");
  const password = readRawInput("regPw");

  if (!name) {
    showAuthError("⚠️ 请输入昵称");
    return;
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showAuthError("⚠️ 请输入有效邮箱");
    return;
  }

  if (password.length < 4) {
    showAuthError("⚠️ 密码至少4位");
    return;
  }

  showAuthError("⏳ 注册中…", true);
  setAuthButtonBusy("regBtn", true);

  try {
    const registerPayload = await requestApi(
      "register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password,
          name: name,
          avatar: selAvatar
        })
      },
      "注册"
    );

    const token =
      typeof registerPayload.token === "string" && registerPayload.token.trim()
        ? registerPayload.token.trim()
        : "";

    if (!token) {
      throw createAuthFlowError("注册成功，但服务器未返回 token");
    }

    if (!registerPayload.user) {
      throw createAuthFlowError("注册成功，但服务器未返回用户信息");
    }

    setSessionToken(token, true);
    removeStoredValue(AUTH_STORAGE_KEYS.guestMode);

    loginAs(registerPayload.user, {});
    toast("🎉 注册成功！");
  } catch (error) {
    showAuthError("❌ " + getUserFacingMessage(error, "注册失败"));
  } finally {
    setAuthButtonBusy("regBtn", false);
  }
}

function guestLogin(silent) {
  const guestData = readStoredJson(AUTH_STORAGE_KEYS.guestData, {}) || {};

  isGuest = true;
  writeStoredValue(AUTH_STORAGE_KEYS.guestMode, "1");
  loginAs(createGuestUser(), guestData);

  if (!silent) {
    toast("📴 离线模式");
  }
}

async function doLogout() {
  if (authToken && !isGuest) {
    try {
      await requestApi(
        "logout",
        {
          method: "POST",
          headers: getAuthHeader(authToken)
        },
        "退出登录"
      );
    } catch (error) {}
  }

  currentUser = null;
  authToken = null;
  isGuest = false;
  pendingSave = false;

  clearStoredSession();

  if (typeof window.clearLongTermGoalsStorage === "function") {
    window.clearLongTermGoalsStorage();
  }

  closeUserMenu();
  clearAuthForms();
  showUnauthenticatedShell();
  updateSyncStatus("");

  emitAuthEvent(AUTH_EVENTS.sessionCleared, {});
}

function switchAccount() {
  closeUserMenu();
  doLogout();
}

function setUserMenuState(isOpen) {
  const dropdown = getAuthElement("userDropdown");
  const mask = getAuthElement("udMask");
  const triggerButton = document.querySelector("#userMenu .user-btn");

  if (!dropdown || !mask || !document.body) {
    return;
  }

  dropdown.classList.toggle("show", isOpen);
  mask.classList.toggle("show", isOpen);
  document.body.classList.toggle("user-menu-open", isOpen);

  if (triggerButton) {
    triggerButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  document.body.style.overflow = isOpen ? "hidden" : "";

  if (isOpen) {
    updateUserStats();
  }
}

function toggleUserMenu() {
  const dropdown = getAuthElement("userDropdown");

  if (!dropdown) {
    return;
  }

  setUserMenuState(!dropdown.classList.contains("show"));
}

function closeUserMenu() {
  setUserMenuState(false);
}

document.addEventListener("click", function handleGlobalUiClick(event) {
  if (window.innerWidth > 640) {
    const userMenu = getAuthElement("userMenu");
    if (userMenu && !userMenu.contains(event.target)) {
      closeUserMenu();
    }
  }

  const sortWrap = getAuthElement("sortWrap");
  if (sortWrap && !sortWrap.contains(event.target)) {
    const sortDropdown = getAuthElement("sortDropdown");
    if (sortDropdown) {
      sortDropdown.classList.remove("show");
    }
  }

  const tagFilterWrap = getAuthElement("tagFilterWrap");
  if (tagFilterWrap && !tagFilterWrap.contains(event.target)) {
    const tagDropdown = getAuthElement("tagDropdown");
    if (tagDropdown) {
      tagDropdown.classList.remove("show");
    }
  }

  if (ppOpenId !== null && !event.target.closest(".pp-drop") && !event.target.closest(".act-btn-pp")) {
    ppOpenId = null;
    rT();
  }

  if (
    prioTplPickerOpen !== null &&
    !event.target.closest(".prio2-picker") &&
    !event.target.closest(".prio2-btn-pick")
  ) {
    prioTplPickerOpen = null;
    rPrioColorSettings();
  }
});

document.addEventListener("keydown", function handleAuthEscape(event) {
  if (event.key === "Escape") {
    closeUserMenu();
  }
});

function updateUserStats() {
  let total = 0;
  let done = 0;

  for (const ds in T) {
    (T[ds] || []).forEach(function countTask(task) {
      total += 1;
      if (task.done) {
        done += 1;
      }
    });
  }

  const totalElement = getAuthElement("udTotal");
  const doneElement = getAuthElement("udDone");

  if (totalElement) {
    totalElement.textContent = total;
  }

  if (doneElement) {
    doneElement.textContent = done;
  }
}

function showProfile() {
  closeUserMenu();

  const modalBody = getAuthElement("mBody");
  const modalBackground = getAuthElement("mBg");

  if (!modalBody || !modalBackground || !currentUser) {
    return;
  }

  modalBody.innerHTML =
    `<p style="font-weight:600;font-size:1.05rem;margin-bottom:10px">✏️ 修改资料</p>` +
    `<div class="copy-field"><label>昵称</label><input type="text" id="editName" value="${esc(
      currentUser.name
    )}" maxlength="12"></div>` +
    `<div class="copy-field"><label>头像</label><div class="avatar-pick" id="editAP" style="margin-top:3px"></div></div>` +
    `<div class="copy-field"><label>新密码（留空不改）</label><input type="password" id="editPw" placeholder="新密码"></div>` +
    `<div class="modal-actions"><button class="mbtn-c" onclick="clM()">取消</button><button class="mbtn-a" onclick="saveProfile()">保存</button></div>`;

  modalBackground.classList.add("show");

  const avatarPicker = getAuthElement("editAP");
  if (avatarPicker) {
    avatarPicker.innerHTML = AVATARS.map(function renderProfileAvatar(avatar) {
      const selectedClass = avatar === currentUser.avatar ? " sel" : "";
      return `<div class="avatar-opt${selectedClass}" onclick="window._eA='${avatar}';this.parentNode.querySelectorAll('.avatar-opt').forEach(e=>e.classList.remove('sel'));this.classList.add('sel')">${avatar}</div>`;
    }).join("");
  }

  window._eA = currentUser.avatar;
}

async function saveProfile() {
  const name = readTrimmedInput("editName");
  const password = readRawInput("editPw");
  const avatar = window._eA || (currentUser && currentUser.avatar) || "👤";

  if (!name) {
    toast("⚠️ 昵称不能为空");
    return;
  }

  if (password && password.length < 4) {
    toast("⚠️ 密码至少4位");
    return;
  }

  if (isGuest) {
    currentUser.name = name;
    currentUser.avatar = avatar;
    setHeaderAvatar(avatar);
    setUdAvatar(avatar);

    const nameElement = getAuthElement("udName");
    if (nameElement) {
      nameElement.textContent = name;
    }

    clM();
    toast("✅ 已更新");
    return;
  }

  try {
    const profilePayload = await requestApi(
      "profile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(authToken)
        },
        body: JSON.stringify({
          name: name,
          avatar: avatar,
          newPassword: password || undefined
        })
      },
      "更新资料"
    );

    currentUser = normalizeSessionUser(profilePayload.user || currentUser);

    if (profilePayload.newToken) {
      setSessionToken(profilePayload.newToken, true);
    }

    setHeaderAvatar(currentUser.avatar);
    setUdAvatar(currentUser.avatar);

    const nameElement = getAuthElement("udName");
    if (nameElement) {
      nameElement.textContent = currentUser.name;
    }

    clM();
    toast("✅ 已更新");
  } catch (error) {
    toast("❌ " + getUserFacingMessage(error, "更新失败"));
  }
}

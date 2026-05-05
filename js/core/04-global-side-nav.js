(function () {
  var gsnRefreshTimer = null;
  var gsnActiveQuick = "";
  var gsnActiveProject = "";
  var missingProjectPrefix = "__gsn_missing_project__";
  var gsnStateKey = "tuole_gsn_state_v1";

  var projects = [
    { name: "工作", icon: "ph-briefcase", color: "#3b82f6", tags: ["工作", "work"] },
    { name: "学习", icon: "ph-graduation-cap", color: "#a855f7", tags: ["学习", "study"] },
    { name: "生活", icon: "ph-house-line", color: "#22c55e", tags: ["生活", "个人", "personal"] },
  ];

  function syncQuickModeState() {
    window.__gsnQuickMode = gsnActiveQuick || "";
  }

  function isValidDateKey(ds) {
    return typeof ds === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ds);
  }

  function readSavedState() {
    try {
      var raw = localStorage.getItem(gsnStateKey);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : null;
    } catch (e) {
      return null;
    }
  }

  function persistState() {
    try {
      var ds = typeof sel !== "undefined" && isValidDateKey(sel) ? sel : todayKey();
      localStorage.setItem(
        gsnStateKey,
        JSON.stringify({
          quick: gsnActiveQuick || "",
          ds: ds,
        })
      );
    } catch (e) {}
  }

  function applySavedState(saved) {
    if (!saved) return false;
    var prevQuick = gsnActiveQuick || "";
    var prevSel = typeof sel !== "undefined" ? String(sel || "") : "";
    var nextQuick = typeof saved.quick === "string" ? saved.quick : "";
    var nextSel = isValidDateKey(saved.ds) ? saved.ds : "";
    var changed = false;
    if (nextQuick !== prevQuick) {
      gsnActiveQuick = nextQuick;
      syncQuickModeState();
      changed = true;
    }
    if (nextSel && nextSel !== prevSel) {
      var d = parseDS(nextSel);
      if (d && !isNaN(d.getTime())) {
        sel = nextSel;
        cY = d.getFullYear();
        cM = d.getMonth();
        changed = true;
      }
    }
    return changed;
  }

  function restoreState() {
    return applySavedState(readSavedState());
  }

  window.restoreGlobalSideNavViewState = restoreState;

  window.getGlobalSideNavQuickMode = function () {
    return gsnActiveQuick || "";
  };

  window.setGlobalSideNavQuickMode = function (mode, keepRefresh) {
    gsnActiveQuick = mode || "";
    syncQuickModeState();
    persistState();
    if (!keepRefresh) scheduleRefresh();
  };

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function todayKey() {
    return fd(new Date());
  }

  function offsetKey(days) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return fd(d);
  }

  function rowsFor(ds) {
    if (typeof T === "undefined" || !T) return [];
    return (T[ds] || []).filter(function (task) {
      return !task.archived;
    });
  }

  function isPending(task) {
    return task && !task.done && !task.frozen && !task.archived;
  }

  function pendingFor(ds) {
    return rowsFor(ds).filter(isPending);
  }

  function allEntries() {
    var out = [];
    if (typeof T === "undefined" || !T) return out;
    Object.keys(T).forEach(function (ds) {
      (T[ds] || []).forEach(function (task) {
        if (!task.archived) out.push({ ds: ds, task: task });
      });
    });
    return out;
  }

  function countWeek() {
    var total = 0;
    for (var i = 0; i < 7; i++) total += pendingFor(offsetKey(i)).length;
    return total;
  }

  function countOverdue() {
    var today = todayKey();
    return allEntries().filter(function (entry) {
      return entry.ds < today && isPending(entry.task);
    }).length;
  }

  function countToday(predicate) {
    return rowsFor(todayKey()).filter(predicate).length;
  }

  function findProjectTag(project) {
    if (!project || !project.tags || typeof customTags === "undefined") return null;
    return (customTags || []).find(function (tag) {
      return project.tags.indexOf(tag.name) >= 0 || project.tags.indexOf(tag.id) >= 0;
    });
  }

  function countProject(project) {
    var todayRows = rowsFor(todayKey()).filter(isPending);
    if (project.isDefault) {
      return todayRows.filter(function (task) {
        return !(task.tags || []).length;
      }).length;
    }
    var tag = findProjectTag(project);
    if (!tag) return 0;
    return todayRows.filter(function (task) {
      return (task.tags || []).indexOf(tag.id) >= 0;
    }).length;
  }

  function hasSingleFilter(key) {
    return typeof FMulti !== "undefined" && FMulti.size === 1 && FMulti.has(key);
  }

  function dateActiveKey() {
    if (gsnActiveQuick === "overdue" || gsnActiveQuick === "week") return gsnActiveQuick;
    if (typeof sel !== "undefined" && sel === offsetKey(1)) {
      return "tomorrow";
    }
    if (typeof sel !== "undefined" && sel === todayKey()) {
      return "today";
    }
    return "";
  }

  function countBadge(value) {
    if (value == null) return "";
    if (!value) return '<span class="gsn-count gsn-count--empty" aria-hidden="true"></span>';
    return '<span class="gsn-count">' + String(value) + "</span>";
  }

  function todayCalendarIcon() {
    var dayText = String(new Date().getDate()).padStart(2, "0");
    return (
      '<span class="gsn-filter-icon gsn-today-calendar-ico gsn-nav-date-icon gsn-nav-date-icon--today" aria-hidden="true">' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
      '<rect x="2.5" y="1.5" width="19" height="21" rx="2.75" stroke="currentColor" stroke-width="1.8"></rect>' +
      '<path d="M2.5 6.8H21.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>' +
      '<text x="12" y="19.2" text-anchor="middle" font-size="10" font-weight="800" letter-spacing="0.1" fill="currentColor" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif">' +
      dayText +
      "</text>" +
      "</svg>" +
      "</span>"
    );
  }

  function navButton(kind, icon, label, count, action, arg, active) {
    var cls = "gsn-" + kind + (active ? " is-active" : "");
    var dataArg = arg == null ? "" : ' data-gsn-arg="' + escapeHtml(arg) + '"';
    var iconToneClass = icon ? " gsn-nav-date-icon--" + icon : "";
    var iconHtml =
      icon === "today-calendar"
        ? todayCalendarIcon()
        : '<i class="ph ' +
          icon +
          " gsn-nav-date-icon gsn-nav-date-icon--ph" +
          iconToneClass +
          '" aria-hidden="true"></i>';
    return (
      '<button type="button" class="' +
      cls +
      '" data-gsn-action="' +
      action +
      '"' +
      dataArg +
      ">" +
      '<span class="gsn-item-main">' +
      iconHtml +
      "<span>" +
      escapeHtml(label) +
      "</span></span>" +
      countBadge(count) +
      "</button>"
    );
  }

  function projectButton(project, index, active) {
    return (
      '<button type="button" class="gsn-project' +
      (active ? " is-active" : "") +
      '" data-gsn-action="project" data-gsn-arg="' +
      index +
      '" style="--gsn-project-color:' +
      project.color +
      '">' +
      '<span class="gsn-project-color" aria-hidden="true"></span>' +
      '<span class="gsn-project-name">' +
      escapeHtml(project.name) +
      "</span>" +
      countBadge(null) +
      "</button>"
    );
  }

  function filterIconMarkup(iconKey) {
    if (iconKey === "high") {
      return (
        '<svg class="gsn-filter-ico gsn-filter-ico--high" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
        '<path fill-rule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l9.78-2.932a1.5 1.5 0 0 1 1.04-.018l3.652 1.536a.75.75 0 0 0 .556.018l4.41-1.764a.75.75 0 0 1 1.052.686v9.273a.75.75 0 0 1-.536.719l-4.41 1.764a.75.75 0 0 0-.556-.018l-3.652-1.536a1.5 1.5 0 0 0-1.04-.018L3.75 14.216V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clip-rule="evenodd"></path>' +
        "</svg>"
      );
    }
    if (iconKey === "repeating") {
      return (
        '<svg class="gsn-filter-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M23 4v6h-6"></path>' +
        '<path d="M1 20v-6h6"></path>' +
        '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>' +
        '<path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>' +
        "</svg>"
      );
    }
    if (iconKey === "frozen") {
      return '<i class="ph ph-snowflake gsn-filter-ico-ph gsn-filter-ico--frozen" aria-hidden="true"></i>';
    }
    return '<span class="gsn-filter-ico-fallback"></span>';
  }

  function filterButton(label, iconKey, count, key, active) {
    return (
      '<button type="button" class="gsn-filter' +
      (active ? " is-active" : "") +
      '" data-gsn-action="filter" data-gsn-arg="' +
      key +
      '">' +
      '<span class="gsn-filter-icon" aria-hidden="true">' +
      filterIconMarkup(iconKey) +
      "</span>" +
      '<span class="gsn-project-name">' +
      escapeHtml(label) +
      "</span>" +
      countBadge(count) +
      "</button>"
    );
  }

  function isProjectActive(project) {
    if (project.isDefault) return hasSingleFilter("default-list");
    var tag = findProjectTag(project);
    if (tag) return typeof FTag !== "undefined" && FTag === tag.id;
    return (
      gsnActiveProject === project.name &&
      typeof FTag !== "undefined" &&
      FTag === missingProjectPrefix + project.name
    );
  }

  function renderSideNav() {
    var nav = ensureSideNav();
    if (!nav) return;
    var activeDate = dateActiveKey();

    nav.innerHTML =
      '<div class="gsn-head">' +
      '<div class="gsn-heading">快速入口</div>' +
      '<button type="button" class="gsn-head-action" data-gsn-action="today" title="回到今天" aria-label="回到今天"><i class="ph ph-arrow-clockwise" aria-hidden="true"></i></button>' +
      "</div>" +
      '<section class="gsn-section" aria-labelledby="gsnDateTitle">' +
      '<h4 class="gsn-section-title" id="gsnDateTitle">日期</h4>' +
      navButton("item", "today-calendar", "今天", pendingFor(todayKey()).length, "today", "", activeDate === "today") +
      navButton("item", "ph-arrow-fat-lines-right", "明天", null, "tomorrow", "", activeDate === "tomorrow") +
      navButton("item", "ph-calendar-dots", "本周", countWeek(), "week", "", activeDate === "week") +
      navButton("item", "ph-warning-circle", "逾期", null, "overdue", "", activeDate === "overdue") +
      "</section>" +
      '<section class="gsn-section" aria-labelledby="gsnFilterTitle">' +
      '<h4 class="gsn-section-title" id="gsnFilterTitle">筛选</h4>' +
      filterButton(
        "高优先级",
        "high",
        countToday(function (task) {
          return task.priority === "high" && isPending(task);
        }),
        "high",
        hasSingleFilter("high")
      ) +
      filterButton(
        "重复任务",
        "repeating",
        null,
        "repeating",
        hasSingleFilter("repeating")
      ) +
      filterButton(
        "已冻结任务",
        "frozen",
        countToday(function (task) {
          return !!task.frozen;
        }),
        "frozen",
        hasSingleFilter("frozen")
      ) +
      "</section>";
  }

  function getCurrentMode() {
    try {
      if (typeof getCurrentPath === "function" && typeof getPathMode === "function") {
        return getPathMode(getCurrentPath());
      }
      if (typeof getPathMode === "function") {
        var path = location.protocol === "file:" ? location.hash.replace(/^#/, "") || "/" : location.pathname;
        return getPathMode(path || "/");
      }
    } catch (e) {}
    var taskMode = document.getElementById("taskMode");
    if (taskMode && !taskMode.classList.contains("hidden")) return "task";
    return "";
  }

  function shouldShowSideNav() {
    return getCurrentMode() === "task";
  }

  function detachSideNav() {
    var app = document.querySelector(".app");
    if (app) app.classList.remove("app--with-global-nav");
    var nav = document.getElementById("globalSideNav");
    if (nav && nav.parentNode) nav.parentNode.removeChild(nav);
  }

  function ensureSideNav() {
    if (!shouldShowSideNav()) {
      detachSideNav();
      return null;
    }
    var app = document.querySelector(".app");
    if (!app) return null;
    app.classList.add("app--with-global-nav");
    var nav = document.getElementById("globalSideNav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "globalSideNav";
      nav.className = "global-side-nav";
      nav.setAttribute("aria-label", "任务导航");
      app.insertBefore(nav, app.firstChild);
    }
    if (!nav._gsnBound) {
      nav._gsnBound = true;
      nav.addEventListener("click", handleNavClick);
    }
    return nav;
  }

  function resetTaskOverlays() {
    gsnActiveProject = "";
    if (typeof FTag !== "undefined") FTag = "";
    if (typeof expandedId !== "undefined") expandedId = null;
    if (typeof closeTaskMoreFloat === "function") closeTaskMoreFloat();
    if (typeof taskMoreMenuId !== "undefined") taskMoreMenuId = null;
  }

  function selectDate(ds, quickName) {
    if (typeof flushPendingTogIfAny === "function") flushPendingTogIfAny();
    var d = parseDS(ds);
    sel = ds;
    cY = d.getFullYear();
    cM = d.getMonth();
    FMulti = new Set(["pending"]);
    resetTaskOverlays();
    gsnActiveQuick = quickName || "";
    syncQuickModeState();
    persistState();
    if (typeof navigate === "function") navigate("/");
    if (typeof rCal === "function") rCal();
    if (typeof rAll === "function") rAll();
    else if (typeof rT === "function") rT();
    scheduleRefresh();
  }

  function applyFilter(key) {
    gsnActiveQuick = "";
    syncQuickModeState();
    persistState();
    gsnActiveProject = "";
    if (typeof FTag !== "undefined") FTag = "";
    if (typeof navigate === "function") navigate("/");
    if (typeof setF === "function") setF(key);
    else {
      FMulti = new Set([key]);
      if (typeof rT === "function") rT();
    }
    scheduleRefresh();
  }

  function applyProject(index) {
    var project = projects[Number(index)];
    if (!project) return;
    gsnActiveQuick = "";
    syncQuickModeState();
    persistState();
    gsnActiveProject = project.name;
    if (typeof navigate === "function") navigate("/");
    if (project.isDefault) {
      FTag = "";
      FMulti = new Set(["default-list"]);
    } else {
      var tag = findProjectTag(project);
      FTag = tag ? tag.id : missingProjectPrefix + project.name;
      FMulti = new Set(["pending"]);
    }
    if (typeof rFilterBar === "function") rFilterBar();
    if (typeof rT === "function") rT();
    scheduleRefresh();
  }

  function handleNavClick(event) {
    var btn = event.target.closest("[data-gsn-action]");
    if (!btn) return;
    event.preventDefault();
    var action = btn.getAttribute("data-gsn-action");
    var arg = btn.getAttribute("data-gsn-arg") || "";
    if (action === "today") selectDate(todayKey(), "today");
    else if (action === "tomorrow") selectDate(offsetKey(1), "tomorrow");
    else if (action === "week") selectDate(todayKey(), "week");
    else if (action === "overdue") selectDate(todayKey(), "overdue");
    else if (action === "filter") applyFilter(arg);
    else if (action === "project") applyProject(arg);
    else if (action === "settings" && typeof navigate === "function") navigate("/settings");
  }

  function scheduleRefresh() {
    if (gsnRefreshTimer) clearTimeout(gsnRefreshTimer);
    gsnRefreshTimer = setTimeout(function () {
      gsnRefreshTimer = null;
      renderSideNav();
      renderTaskListSupport();
    }, 0);
  }

  function renderTaskListSummary(list, currentDs, rows, pending, high) {
    var done = rows.filter(function (task) {
      return task.done && !task.archived;
    }).length;
    var minutes = pending.reduce(function (sum, task) {
      var n = parseInt(task.duration, 10);
      return sum + (Number.isFinite(n) && n > 0 ? n : 0);
    }, 0);
    var dayLabel = currentDs === todayKey() ? "今日" : "当前日";
    var lead = pending.length ? "还剩 " + pending.length + " 项待办" : "任务已清空";
    var hint = high ? "建议先完成高优先级任务" : "保持现在的节奏";
    var timeText = minutes ? minutes + " 分钟" : "未估时";
    var summary = document.createElement("div");
    summary.className = "task-list-summary";
    summary.innerHTML =
      '<div class="tls-copy">' +
      '<span class="tls-kicker">' +
      escapeHtml(dayLabel) +
      "摘要</span>" +
      "<strong>" +
      escapeHtml(lead) +
      "</strong>" +
      "<span>" +
      escapeHtml(hint) +
      "</span>" +
      "</div>" +
      '<div class="tls-stats">' +
      '<span><b>' +
      pending.length +
      "</b>待办</span>" +
      '<span><b>' +
      done +
      "</b>完成</span>" +
      '<span><b>' +
      high +
      "</b>高优先</span>" +
      '<span><b>' +
      escapeHtml(timeText) +
      "</b>预计</span>" +
      "</div>";
    var firstTask = list.querySelector(".task-item");
    list.insertBefore(summary, firstTask || list.firstChild);
  }

  function renderTaskListSupport() {
    var list = document.getElementById("tList");
    if (!list || !document.body.contains(list)) return;
    var old = list.querySelector(".task-list-footer-note");
    if (old) old.remove();
    var oldSummary = list.querySelector(".task-list-summary");
    if (oldSummary) oldSummary.remove();
    return;
    var hasRows = !!list.querySelector(".task-item:not(.archived-item)");
    if (!hasRows) return;
    var currentDs = typeof sel === "undefined" ? todayKey() : sel;
    var dayLabel = currentDs === todayKey() ? "今天" : "这一天";
    var rows = rowsFor(currentDs);
    var pending = rows.filter(isPending);
    var high = pending.filter(function (task) {
      return task.priority === "high";
    }).length;
    renderTaskListSummary(list, currentDs, rows, pending, high);
    var text = "";
    if (pending.length) {
      text =
        dayLabel +
        "还剩 " +
        pending.length +
        " 项待办，" +
        (high ? "建议先完成高优先级任务。" : "保持现在的节奏就好。");
    } else {
      text = dayLabel + "节奏不错，可以添加下一件小事，或开始一次 25 分钟专注。";
    }
    var note = document.createElement("div");
    note.className = "task-list-footer-note";
    note.innerHTML =
      '<span class="task-list-footer-dot" aria-hidden="true"></span><span>' +
      escapeHtml(text) +
      "</span>";
    list.appendChild(note);
  }

  function patchRender() {
    if (typeof rT === "function" && !window._globalSideNavRT) {
      window._globalSideNavRT = true;
      var originalRT = rT;
      rT = function () {
        var result = originalRT.apply(this, arguments);
        persistState();
        renderTaskListSupport();
        scheduleRefresh();
        return result;
      };
    }
  }

  function patchLoginRestore() {
    if (typeof loginAs === "function" && !window._globalSideNavLoginRestore) {
      window._globalSideNavLoginRestore = true;
      var originalLoginAs = loginAs;
      loginAs = function () {
        var savedBefore = readSavedState();
        var result = originalLoginAs.apply(this, arguments);
        if (applySavedState(savedBefore)) {
          if (typeof rCal === "function") rCal();
          if (typeof rAll === "function") rAll();
          else if (typeof rT === "function") rT();
        } else {
          persistState();
        }
        scheduleRefresh();
        return result;
      };
    }
  }

  function patchModeSync() {
    if (typeof applyMode === "function" && !window._globalSideNavApplyMode) {
      window._globalSideNavApplyMode = true;
      var originalApplyMode = applyMode;
      applyMode = function () {
        // Ensure task layout class/nav are ready before page mode render,
        // avoiding first-frame style swap on route switch.
        ensureSideNav();
        var result = originalApplyMode.apply(this, arguments);
        ensureSideNav();
        scheduleRefresh();
        return result;
      };
    }
  }

  window.refreshGlobalSideNav = scheduleRefresh;
  syncQuickModeState();
  ensureSideNav();
  patchLoginRestore();
  patchRender();
  patchModeSync();
  scheduleRefresh();
  document.addEventListener("DOMContentLoaded", function () {
    ensureSideNav();
    patchLoginRestore();
    patchRender();
    patchModeSync();
    scheduleRefresh();
  });
  window.addEventListener("popstate", scheduleRefresh);
  window.addEventListener("hashchange", scheduleRefresh);
})();

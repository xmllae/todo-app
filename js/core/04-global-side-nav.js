(function () {
  var gsnRefreshTimer = null;
  var gsnActiveQuick = "";
  var gsnActiveProject = "";
  var missingProjectPrefix = "__gsn_missing_project__";

  var projects = [
    { name: "工作", icon: "ph-briefcase", color: "#3b82f6", tags: ["工作", "work"] },
    { name: "学习", icon: "ph-graduation-cap", color: "#a855f7", tags: ["学习", "study"] },
    { name: "生活", icon: "ph-house-line", color: "#22c55e", tags: ["生活", "个人", "personal"] },
  ];

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
    if (hasSingleFilter("scheduled")) return "scheduled";
    if (typeof sel !== "undefined" && sel === offsetKey(1) && hasSingleFilter("pending") && !FTag) {
      return "tomorrow";
    }
    if (typeof sel !== "undefined" && sel === todayKey() && hasSingleFilter("pending") && !FTag) {
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
    return (
      '<span class="gsn-today-cal" aria-hidden="true">' +
      '<span class="gsn-today-cal-top"></span>' +
      '<span class="gsn-today-cal-day">' +
      String(new Date().getDate()) +
      "</span>" +
      "</span>"
    );
  }

  function navButton(kind, icon, label, count, action, arg, active) {
    var cls = "gsn-" + kind + (active ? " is-active" : "");
    var dataArg = arg == null ? "" : ' data-gsn-arg="' + escapeHtml(arg) + '"';
    var iconHtml =
      icon === "today-calendar"
        ? todayCalendarIcon()
        : '<i class="ph ' + icon + '" aria-hidden="true"></i>';
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

  function filterButton(label, dotClass, count, key, active) {
    return (
      '<button type="button" class="gsn-filter' +
      (active ? " is-active" : "") +
      '" data-gsn-action="filter" data-gsn-arg="' +
      key +
      '">' +
      '<span class="gsn-filter-dot ' +
      dotClass +
      '" aria-hidden="true"></span>' +
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
      "<div>" +
      '<div class="gsn-kicker">导航</div>' +
      '<div class="gsn-heading">快速入口</div>' +
      "</div>" +
      '<button type="button" class="gsn-head-action" data-gsn-action="today" title="回到今天" aria-label="回到今天"><i class="ph ph-arrow-clockwise" aria-hidden="true"></i></button>' +
      "</div>" +
      '<section class="gsn-section" aria-labelledby="gsnDateTitle">' +
      '<h4 class="gsn-section-title" id="gsnDateTitle">日期快捷</h4>' +
      navButton("item", "today-calendar", "今天", pendingFor(todayKey()).length, "today", "", activeDate === "today") +
      navButton("item", "ph-arrow-fat-lines-right", "明天", null, "tomorrow", "", activeDate === "tomorrow") +
      navButton("item", "ph-calendar-dots", "本周", countWeek(), "week", "", activeDate === "week") +
      navButton("item", "ph-warning-circle", "逾期", null, "overdue", "", activeDate === "overdue") +
      "</section>" +
      '<section class="gsn-section" aria-labelledby="gsnFilterTitle">' +
      '<h4 class="gsn-section-title" id="gsnFilterTitle">筛选器</h4>' +
      filterButton(
        "高优先级",
        "gsn-filter-dot--high",
        countToday(function (task) {
          return task.priority === "high" && isPending(task);
        }),
        "high",
        hasSingleFilter("high")
      ) +
      filterButton(
        "重复任务",
        "gsn-filter-dot--repeat",
        null,
        "repeating",
        hasSingleFilter("repeating")
      ) +
      "</section>" +
      '<div class="gsn-footnote"><span class="gsn-footnote-dot" aria-hidden="true"></span><span>本周节奏稳定，先抓住今天最重要的一件事。</span></div>';
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
    if (typeof navigate === "function") navigate("/");
    if (typeof rCal === "function") rCal();
    if (typeof rAll === "function") rAll();
    else if (typeof rT === "function") rT();
    scheduleRefresh();
  }

  function applyFilter(key) {
    gsnActiveQuick = "";
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
        renderTaskListSupport();
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
        var result = originalApplyMode.apply(this, arguments);
        ensureSideNav();
        scheduleRefresh();
        return result;
      };
    }
  }

  window.refreshGlobalSideNav = scheduleRefresh;
  ensureSideNav();
  patchRender();
  patchModeSync();
  scheduleRefresh();
  document.addEventListener("DOMContentLoaded", function () {
    ensureSideNav();
    patchRender();
    patchModeSync();
    scheduleRefresh();
  });
  window.addEventListener("popstate", scheduleRefresh);
  window.addEventListener("hashchange", scheduleRefresh);
})();

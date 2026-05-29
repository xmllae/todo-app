(function () {
  if (window.__priorityViewBound) return;
  window.__priorityViewBound = true;

  var PRIORITY_MODE = "priority-high";
  var PRIORITY_CLASS = "task-mode--priority-view";
  var PRIORITY_NAV_CLASS = "date-nav--priority";
  var PRIORITY_SHELL_CLASS = "priority-action-shell";
  var PRIORITY_TAB_STORAGE_KEY = "todo_priority_view_tab_v1";
  var PRIORITY_SORT_STORAGE_KEY = "todo_priority_view_sort_v1";
  var PRIORITY_TABS = ["all", "week", "overdue", "today"];
  var PRIORITY_SORT_MODES = ["title", "time"];
  var PRIORITY_LATER_WINDOW_DAYS = 7;
  var PRIORITY_LATER_TITLE = "\u4e4b\u540e 7 \u5929\u5185";
  var priorityViewTab = readSavedPriorityTab();
  var priorityViewSortMode = readSavedPrioritySortMode();

  function isPriorityMode() {
    return typeof getTaskQuickMode === "function" && getTaskQuickMode() === PRIORITY_MODE;
  }

  function getTaskMode() {
    return document.getElementById("taskMode");
  }

  function getDateNav() {
    return document.querySelector("#taskMode .task-main-col > .task-card > .date-nav");
  }

  function getTitleHost() {
    return document.getElementById("dTitle");
  }

  function clearTitleMotion(title) {
    if (!title) return;
    title.classList.remove("is-animating", "is-animating-prev", "is-animating-next");
  }

  function todayKey() {
    return typeof fd === "function" ? fd(now) : "";
  }

  function normalizePriorityTab(tab) {
    return PRIORITY_TABS.indexOf(tab) >= 0 ? tab : "all";
  }

  function readSavedPriorityTab() {
    try {
      return normalizePriorityTab(localStorage.getItem(PRIORITY_TAB_STORAGE_KEY));
    } catch (e) {
      return "all";
    }
  }

  function persistPriorityTab(tab) {
    try {
      localStorage.setItem(PRIORITY_TAB_STORAGE_KEY, normalizePriorityTab(tab));
    } catch (e) {}
  }

  function normalizePrioritySortMode(mode) {
    return PRIORITY_SORT_MODES.indexOf(mode) >= 0 ? mode : "time";
  }

  function readSavedPrioritySortMode() {
    try {
      return normalizePrioritySortMode(localStorage.getItem(PRIORITY_SORT_STORAGE_KEY));
    } catch (e) {
      return "time";
    }
  }

  function persistPrioritySortMode(mode) {
    try {
      localStorage.setItem(PRIORITY_SORT_STORAGE_KEY, normalizePrioritySortMode(mode));
    } catch (e) {}
  }

  function getPrioritySortLabel(mode) {
    if (mode === "time") return "按时间排序";
    if (mode === "title") return "按名称排序";
    return "按名称排序";
  }

  function getPriorityHeaderToolsHost() {
    var dateNav = getDateNav();
    if (!dateNav) return null;
    var host = dateNav.querySelector(".priority-header-tools");
    if (!host) {
      host = document.createElement("div");
      host.className = "priority-header-tools";
      dateNav.appendChild(host);
    }
    return host;
  }

  function clearPriorityHeaderToolsHost() {
    var dateNav = getDateNav();
    if (!dateNav) return;
    var host = dateNav.querySelector(".priority-header-tools");
    if (host && host.parentNode) host.parentNode.removeChild(host);
  }

  function shouldKeepPriorityGroup(grouped, groupKey, tab) {
    if (tab !== "all") return !!grouped[groupKey].length;
    if (groupKey === "today") return true;
    return !!grouped[groupKey].length;
  }

  function getPriorityGroupEmptyText(groupKey) {
    if (groupKey === "today") return "今天暂无高优先级任务";
    return "";
  }

  function setArrowAvailability(dateNav, disabled) {
    if (!dateNav) return;
    dateNav.querySelectorAll(".nav-arrow").forEach(function (btn) {
      if (disabled) {
        if (!btn.dataset.priorityPrevTabIndex) {
          btn.dataset.priorityPrevTabIndex = btn.getAttribute("tabindex") || "";
        }
        if (!btn.dataset.priorityPrevVisibility) {
          btn.dataset.priorityPrevVisibility = btn.style.visibility || "";
        }
        if (!btn.dataset.priorityPrevPointerEvents) {
          btn.dataset.priorityPrevPointerEvents = btn.style.pointerEvents || "";
        }
        btn.setAttribute("aria-hidden", "true");
        btn.tabIndex = -1;
        btn.style.visibility = "hidden";
        btn.style.pointerEvents = "none";
        return;
      }

      btn.removeAttribute("aria-hidden");
      if (btn.dataset.priorityPrevTabIndex) {
        btn.setAttribute("tabindex", btn.dataset.priorityPrevTabIndex);
      } else {
        btn.removeAttribute("tabindex");
      }
      btn.style.visibility = btn.dataset.priorityPrevVisibility || "";
      btn.style.pointerEvents = btn.dataset.priorityPrevPointerEvents || "";
      delete btn.dataset.priorityPrevTabIndex;
      delete btn.dataset.priorityPrevVisibility;
      delete btn.dataset.priorityPrevPointerEvents;
    });
  }

  function syncReturnTodayButton(dateNav, hidden) {
    if (!dateNav) return;

    var btn = dateNav.querySelector(".date-nav-return-today");
    if (hidden) {
      if (!btn) return;
      if (typeof hideTaskBackTodayBtn === "function") hideTaskBackTodayBtn(btn, true);
      else {
        btn.classList.remove("is-visible", "has-range");
        btn.setAttribute("aria-hidden", "true");
        btn.tabIndex = -1;
      }
      return;
    }

    if (typeof setTaskBackTodayBtn === "function" && typeof sel === "string" && sel) {
      setTaskBackTodayBtn(sel);
    }
  }

  function bindPriorityTitleClickGuard(dateNav) {
    if (!dateNav || dateNav.dataset.priorityClickGuardBound) return;
    var titleWrap = dateNav.querySelector("h3");
    if (!titleWrap) return;
    dateNav.dataset.priorityClickGuardBound = "1";
    titleWrap.addEventListener(
      "click",
      function (event) {
        if (!isPriorityMode()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  function priorityFlagMarkup() {
    return typeof priorityFlagIconHtml === "function"
      ? priorityFlagIconHtml("priority-title__flag-icon")
      : '<i class="ph-fill ph-flag priority-title__flag-icon" aria-hidden="true"></i>';
  }

  function sortIconMarkup() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"></path><path d="M7 12h10"></path><path d="M10 17h4"></path></svg>';
  }

  function priorityGroupHeaderDecorationHtml() {
    return (
      '<div class="priority-group__header-decoration" aria-hidden="true">' +
      '<span class="priority-group__header-line"></span>' +
      "</div>"
    );
  }

  function priorityGroupCountHtml(count) {
    if (!(count > 0)) return "";
    return (
      '<span class="priority-group__count">' +
      '<span class="priority-group__count-bracket">\uFF08 </span>' +
      '<span class="priority-group__count-number">' +
      count +
      '</span><span class="priority-group__count-bracket"> \uFF09</span>' +
      "</span>"
    );
  }

  function priorityGroupHeaderHtml(group) {
    return (
      '<div class="priority-group__header">' +
      '<h4 class="priority-group__title">' +
      '<span class="priority-group__title-label">' +
      esc(group.title) +
      "</span>" +
      priorityGroupCountHtml(group.count) +
      "</h4>" +
      priorityGroupHeaderDecorationHtml(group.key) +
      "</div>"
    );
  }

  function priorityGroupEmptyHtml(groupKey) {
    return (
      '<div class="priority-group__empty priority-group__empty--' +
      groupKey +
      '"><p class="priority-group__empty-copy">' +
      esc(getPriorityGroupEmptyText(groupKey)) +
      "</p></div>"
    );
  }

  function getPriorityHeaderToolsMarkup() {
    return (
      '<button type="button" class="priority-header-tool" onclick="cyclePriorityViewSortMode()" title="' +
      getPrioritySortLabel(priorityViewSortMode) +
      '" aria-label="' +
      getPrioritySortLabel(priorityViewSortMode) +
      '">' +
      '<span class="priority-header-tool__icon" aria-hidden="true">' +
      sortIconMarkup() +
      "</span>" +
      '<span class="priority-header-tool__label">' +
      esc(getPrioritySortLabel(priorityViewSortMode)) +
      "</span></button>"
    );
  }

  function renderPriorityTitle(state) {
    var title = getTitleHost();
    if (!title || !state) return;
    clearTitleMotion(title);
    title.innerHTML =
      '<span class="priority-title">' +
      '<span class="priority-title__flag" aria-hidden="true">' +
      priorityFlagMarkup() +
      "</span>" +
      '<span class="priority-title__copy">' +
      '<span class="priority-title__main">高优先级</span>' +
      '<span class="priority-title__sub">共 ' +
      state.totalCount +
      " 项任务</span>" +
      "</span></span>";
    title.dataset.renderKey = PRIORITY_MODE + "|" + state.totalCount;
    title.dataset.lastDs = PRIORITY_MODE;
    title.classList.remove("is-week-scope", "is-range-offset", "is-relative", "is-plain-date", "is-overdue-scope");
    title.classList.add("is-priority-scope");
  }

  function clearPriorityTitle() {
    var title = getTitleHost();
    if (!title) return;
    title.classList.remove("is-priority-scope");
  }

  function ensurePriorityHeaderState(state) {
    var taskMode = getTaskMode();
    var dateNav = getDateNav();
    if (taskMode) taskMode.classList.toggle(PRIORITY_CLASS, !!state);
    if (dateNav) {
      dateNav.classList.toggle(PRIORITY_NAV_CLASS, !!state);
      bindPriorityTitleClickGuard(dateNav);
      setArrowAvailability(dateNav, !!state);
      syncReturnTodayButton(dateNav, !!state);
    }

    if (!state) {
      clearPriorityTitle();
      clearPriorityHeaderToolsHost();
      return;
    }

    renderPriorityTitle(state);
    var toolsHost = getPriorityHeaderToolsHost();
    if (toolsHost) {
      toolsHost.innerHTML = getPriorityHeaderToolsMarkup();
    }
  }

  function getWeekMetaForToday() {
    var today = todayKey();
    return typeof getTaskWeekMeta === "function" && today ? getTaskWeekMeta(today) : { days: [] };
  }

  function isCurrentWeekDate(ds) {
    return getWeekMetaForToday().days.indexOf(ds) >= 0;
  }

  function getDayOffset(ds) {
    try {
      var base = parseDS(todayKey());
      var target = parseDS(ds);
      if (!base || !target) return 0;
      var baseDate = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
      var targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
      return Math.round((targetDate - baseDate) / 86400000);
    } catch (e) {
      return 0;
    }
  }

  function isWithinPriorityWindowOffset(dayOffset) {
    return dayOffset >= 0 && dayOffset <= PRIORITY_LATER_WINDOW_DAYS;
  }

  function isPriorityLaterWindowDate(ds) {
    var dayOffset = getDayOffset(ds);
    return dayOffset > 0 && dayOffset <= PRIORITY_LATER_WINDOW_DAYS;
  }

  function appendPriorityWindowKeys(keys) {
    var today = todayKey();
    if (!today || typeof parseDS !== "function") return;
    var base = parseDS(today);
    if (!base || Number.isNaN(base.getTime())) return;
    for (var offset = 1; offset <= PRIORITY_LATER_WINDOW_DAYS; offset += 1) {
      var nextDate = new Date(base);
      nextDate.setDate(base.getDate() + offset);
      keys[fd(nextDate)] = true;
    }
  }

  function getWeekdayText(ds) {
    var parsed = parseDS(ds);
    if (!parsed) return "";
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][parsed.getDay()] || "";
  }

  function getMonthDayText(ds) {
    var parsed = parseDS(ds);
    if (!parsed) return String(ds || "");
    return parsed.getMonth() + 1 + "/" + parsed.getDate();
  }

  function getTitleDateText(ds) {
    return getWeekdayText(ds) + " " + getMonthDayText(ds);
  }

  function getChineseMonthDayText(ds) {
    var parsed = parseDS(ds);
    if (!parsed) return String(ds || "");
    return parsed.getMonth() + 1 + "月" + parsed.getDate() + "日";
  }

  function getRelativeDateText(ds) {
    var offset = getDayOffset(ds);
    if (offset === 0) return "今天";
    if (offset === 1) return "明天";
    if (offset === -1) return "昨天";
    if (offset === 2) return "后天";
    if (offset === -2) return "前天";
    if (Math.abs(offset) <= 6) return getWeekdayText(ds);
    return getMonthDayText(ds);
  }

  function getTaskTimeLabel(task) {
    if (!task) return "";
    if (task.planTime) {
      var formatted = typeof formatPlanTimeDisp === "function" ? formatPlanTimeDisp(task.planTime) : task.planTime;
      return typeof taskRowPlainTimeText === "function" ? taskRowPlainTimeText(task, formatted) : formatted;
    }
    if (parseInt(task.duration, 10) > 0) return "预计 " + parseInt(task.duration, 10) + " 分钟";
    return "";
  }

  function getTaskTrailingLabel(entry) {
    var timeLabel = getTaskTimeLabel(entry.task);
    var dateLabel = getRelativeDateText(entry.ds);
    return timeLabel ? dateLabel + " " + timeLabel : dateLabel;
  }

  function getPriorityTaskWhenLabel(entry) {
    var dateLabel = getChineseMonthDayText(entry.ds);
    var weekdayLabel = getWeekdayText(entry.ds);
    var planTimeLabel = "";
    if (entry && entry.task && entry.task.planTime) {
      planTimeLabel = typeof formatPlanTimeDisp === "function" ? formatPlanTimeDisp(entry.task.planTime) : entry.task.planTime;
    }
    var baseLabel = dateLabel + (weekdayLabel ? " " + weekdayLabel : "");
    return planTimeLabel ? baseLabel + " · " + planTimeLabel : baseLabel;
  }

  function normalizePrioritySortValue(entry) {
    if (priorityViewSortMode === "title") {
      return String(entry.task.text || "");
    }
    if (priorityViewSortMode === "time") {
      return String(entry.task.planTime || "99:99");
    }
    return String(entry.ds || "");
  }

  function comparePriorityEntries(a, b) {
    var av = normalizePrioritySortValue(a);
    var bv = normalizePrioritySortValue(b);
    if (priorityViewSortMode === "title") {
      var titleComp = av.localeCompare(bv, "zh-CN");
      if (titleComp !== 0) return titleComp;
    } else if (priorityViewSortMode === "time") {
      if (a.ds !== b.ds) return a.ds.localeCompare(b.ds);
      if (av !== bv) return av.localeCompare(bv);
    } else if (a.ds !== b.ds) {
      return a.ds.localeCompare(b.ds);
    }

    var aTime = String(a.task.planTime || "99:99");
    var bTime = String(b.task.planTime || "99:99");
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return String(a.task.text || "").localeCompare(String(b.task.text || ""), "zh-CN");
  }

  function collectPriorityEntries() {
    var keys = {};
    var today = todayKey();
    if (today) keys[today] = true;
    getWeekMetaForToday().days.forEach(function (ds) {
      keys[ds] = true;
    });
    appendPriorityWindowKeys(keys);
    Object.keys(T || {}).forEach(function (ds) {
      keys[ds] = true;
    });

    return Object.keys(keys)
      .sort()
      .reduce(function (items, ds) {
        if (typeof generateRecurring === "function" && (ds === today || isCurrentWeekDate(ds) || isPriorityLaterWindowDate(ds))) {
          generateRecurring(ds);
        }
        var rows = T && T[ds] ? T[ds] : [];
        rows.forEach(function (task) {
          if (!task || (task.priority || "normal") !== "high") return;
          if (typeof isListedTask === "function" && !isListedTask(task)) return;
          if (typeof isPendingListedTask === "function") {
            if (!isPendingListedTask(task)) return;
          } else if (task.done || task.frozen) {
            return;
          }
          items.push({
            ds: ds,
            task: task,
            dayOffset: getDayOffset(ds)
          });
        });
        return items;
      }, [])
      .sort(comparePriorityEntries);
  }

  function getPrioritySectionKey(entry) {
    var dayOffset = entry && typeof entry.dayOffset === "number" ? entry.dayOffset : getDayOffset(entry.ds);
    if (dayOffset < 0) return "overdue";
    if (dayOffset === 0) return "today";
    if (isCurrentWeekDate(entry.ds)) return "week";
    if (isWithinPriorityWindowOffset(dayOffset)) return "later";
    return "";
  }

  function isPrioritySceneEntry(entry) {
    return !!getPrioritySectionKey(entry);
  }

  function countPriorityEntriesBySection(entries, sectionKey) {
    return entries.filter(function (entry) {
      return getPrioritySectionKey(entry) === sectionKey;
    }).length;
  }

  function getPriorityUpcomingEntries(entries) {
    return entries
      .filter(function (entry) {
        return entry.dayOffset >= 0;
      })
      .slice(0, 4);
  }

  function countCurrentWeekPriorityEntries(entries) {
    return entries.filter(function (entry) {
      return isCurrentWeekDate(entry.ds);
    }).length;
  }

  function buildPrioritySceneEntries() {
    return collectPriorityEntries().filter(isPrioritySceneEntry);
  }

  function getPrioritySceneTotalCount() {
    return buildPrioritySceneEntries().length;
  }

  function buildPriorityGroups(entries, tab) {
    var filteredEntries = entries.filter(function (entry) {
      var sectionKey = getPrioritySectionKey(entry);
      if (!sectionKey) return false;
      if (tab === "overdue") return sectionKey === "overdue";
      if (tab === "today") return sectionKey === "today";
      if (tab === "week") return isCurrentWeekDate(entry.ds);
      return true;
    });

    var grouped = {
      overdue: [],
      today: [],
      week: [],
      later: []
    };

    filteredEntries.forEach(function (entry) {
      var sectionKey = getPrioritySectionKey(entry);
      if (!sectionKey) return;
      grouped[sectionKey].push(entry);
    });

    var groups = [];
    if (grouped.overdue.length) groups.push({ key: "overdue", title: "逾期", count: grouped.overdue.length, items: grouped.overdue });
    if (grouped.today.length) groups.push({ key: "today", title: "今天", count: grouped.today.length, items: grouped.today });
    if (grouped.week.length) groups.push({ key: "week", title: "本周", count: grouped.week.length, items: grouped.week });
    if (grouped.later.length) groups.push({ key: "later", title: PRIORITY_LATER_TITLE, count: grouped.later.length, items: grouped.later });

    if (tab === "all" && !groups.some(function (group) { return group.key === "today"; })) {
      var todayGroup = { key: "today", title: "\u4eca\u5929", count: 0, items: [] };
      var todayInsertIndex = groups.findIndex(function (group) {
        return group.key === "week" || group.key === "later";
      });
      if (todayInsertIndex === -1) groups.push(todayGroup);
      else groups.splice(todayInsertIndex, 0, todayGroup);
    }

    return {
      filteredEntries: filteredEntries,
      groups: groups
    };
  }

  function getPrioritySceneState() {
    var entries = buildPrioritySceneEntries();
    var activeTab = normalizePriorityTab(priorityViewTab);
    var grouped = buildPriorityGroups(entries, activeTab);
    var upcomingEntries = getPriorityUpcomingEntries(entries);

    return {
      activeTab: activeTab,
      totalCount: entries.length,
      overdueCount: countPriorityEntriesBySection(entries, "overdue"),
      todayCount: countPriorityEntriesBySection(entries, "today"),
      weekCount: countCurrentWeekPriorityEntries(entries),
      upcomingWeekCount: countPriorityEntriesBySection(entries, "week"),
      filteredCount: grouped.filteredEntries.length,
      groups: grouped.groups,
      upcomingEntries: upcomingEntries
    };
  }

  function priorityTabsHtml(state) {
    return [
      { key: "all", label: "全部", count: state.totalCount },
      { key: "week", label: "本周", count: state.weekCount },
      { key: "overdue", label: "逾期", count: state.overdueCount },
      { key: "today", label: "今天", count: state.todayCount }
    ]
      .map(function (item) {
        return (
          '<button type="button" class="priority-tabs__button' +
          (state.activeTab === item.key ? " is-active" : "") +
          '" onclick="setPriorityViewTab(\'' +
          item.key +
          "')\">" +
          '<span class="priority-tabs__label">' +
          esc(item.label) +
          "</span>" +
          '<span class="priority-tabs__count priority-tabs__count--' +
          item.key +
          '">' +
          item.count +
          "</span></button>"
        );
      })
      .join("");
  }

  function priorityTaskCardHtml(entry, tone) {
    var sectionTone = tone || getPrioritySectionKey(entry);
    return (
      '<button type="button" class="priority-task-card priority-task-card--' +
      sectionTone +
      '" onclick="jumpPriorityTaskDate(\'' +
      entry.ds +
      "')\">" +
      '<span class="priority-task-card__lead" aria-hidden="true">' +
      '<span class="priority-task-card__marker priority-task-card__marker--priority-high"></span></span>' +
      '<span class="priority-task-card__copy">' +
      '<span class="priority-task-card__title-row">' +
      '<strong class="priority-task-card__title" title="' +
      esc(entry.task.text) +
      '">' +
      esc(entry.task.text) +
      "</strong></span></span>" +
      '<span class="priority-task-card__tail">' +
      '<span class="priority-task-card__when">' +
      esc(getPriorityTaskWhenLabel(entry)) +
      "</span></span></button>"
    );
  }

  function getPrioritySceneEmptyCopy(state) {
    if (state.activeTab === "today") {
      return {
        title: "今天没有高优先级任务",
        sub: "好好休息，为明天积蓄能量吧"
      };
    }
    if (state.activeTab === "overdue") {
      return {
        title: "没有逾期的高优先级任务",
        sub: "做得不错，重要的事情都还在节奏内。"
      };
    }
    if (state.activeTab === "week") {
      return {
        title: "本周没有高优先级任务",
        sub: "把注意力留给今天最重要的事，也很好。"
      };
    }
    if (!state.totalCount) {
      return {
        title: "还没有高优先级任务",
        sub: "把真正需要优先推进的事项标记为高优先级，它们会集中展示在这里。"
      };
    }
    return {
      title: "当前筛选下没有高优先级任务",
      sub: "切换上面的标签，看看其它时间段的重点任务。"
    };
  }

  function prioritySceneEmptyIllustrationMarkup() {
    return (
      '<svg class="priority-scene__empty-svg" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="120" cy="149" rx="58" ry="10" fill="var(--priority-empty-shadow)"/>' +
      '<circle cx="30" cy="108" r="4" fill="var(--priority-empty-dot)" opacity=".62"/>' +
      '<circle cx="210" cy="104" r="4" fill="var(--priority-empty-dot)" opacity=".62"/>' +
      '<rect x="86" y="30" width="68" height="92" rx="13" stroke="var(--priority-empty-ink)" stroke-width="8.5"/>' +
      '<rect x="106" y="18" width="28" height="18" rx="5" fill="white" stroke="var(--priority-empty-ink)" stroke-width="8.5"/>' +
      '<path d="M104 62H136" stroke="var(--priority-empty-ink-strong)" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M104 80H136" stroke="var(--priority-empty-ink-strong)" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M104 98H128" stroke="var(--priority-empty-ink-strong)" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="138" y="98" width="32" height="32" rx="10" fill="white" stroke="var(--priority-empty-accent)" stroke-width="5.5"/>' +
      '<path d="M146 114L152 120L162 108.5" stroke="var(--priority-empty-accent)" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>"
    );
  }

  function priorityGroupsHtml(state) {
    if (!state.filteredCount) {
      var emptyCopy = getPrioritySceneEmptyCopy(state);
      return (
        '<div class="priority-scene__empty">' +
        '<div class="priority-scene__empty-illustration" aria-hidden="true">' +
        prioritySceneEmptyIllustrationMarkup() +
        "</div>" +
        '<p class="priority-scene__empty-title">' +
        esc(emptyCopy.title) +
        '</p><p class="priority-scene__empty-sub">' +
        esc(emptyCopy.sub) +
        "</p></div>"
      );
    }

    return state.groups
      .map(function (group) {
        var groupBody = group.items.length
          ? group.items
              .map(function (entry) {
                return priorityTaskCardHtml(entry, group.key);
              })
              .join("")
          : priorityGroupEmptyHtml(group.key);

        return (
          '<section class="priority-group priority-group--' +
          group.key +
          '">' +
          priorityGroupHeaderHtml(group) +
          '<div class="priority-group__list">' +
          groupBody +
          "</div></section>"
        );
      })
      .join("");
  }

  function renderPriorityTaskScene(list, state) {
    if (!list || !state) return;
    list.innerHTML =
      '<section class="priority-scene" aria-label="高优先级任务列表">' +
      '<div class="priority-scene__toolbar"><div class="priority-tabs" role="tablist" aria-label="高优先级视图筛选">' +
      priorityTabsHtml(state) +
      "</div></div>" +
      priorityGroupsHtml(state) +
      "</section>";
    if (!state.filteredCount && list.firstElementChild) {
      list.firstElementChild.classList.add("priority-scene--empty");
    }
  }

  function ensurePriorityOverviewShell(root) {
    if (!root) return null;
    var shell = root.querySelector("." + PRIORITY_SHELL_CLASS);
    if (!shell) {
      shell = document.createElement("section");
      root.appendChild(shell);
    }
    shell.className = "week-action-shell " + PRIORITY_SHELL_CLASS;
    shell.setAttribute("aria-label", "高优先级概览");
    return shell;
  }

  function priorityOverviewRingGradient(state) {
    var overdue = state.overdueCount;
    var today = state.todayCount;
    var week = state.upcomingWeekCount;
    var later = Math.max(0, state.totalCount - overdue - today - week);
    var total = Math.max(1, overdue + today + week + later);
    var redEnd = (overdue / total) * 100;
    var orangeEnd = redEnd + (today / total) * 100;
    var blueEnd = orangeEnd + (week / total) * 100;
    return (
      "conic-gradient(" +
      "#ef4444 0 " +
      redEnd +
      "%, " +
      "#fb923c " +
      redEnd +
      "% " +
      orangeEnd +
      "%, " +
      "#6366f1 " +
      orangeEnd +
      "% " +
      blueEnd +
      "%, " +
      "#e5e7eb " +
      blueEnd +
      "% 100%)"
    );
  }

  function priorityOverviewMetricHtml(value, label, tone) {
    return (
      '<div class="priority-overview__metric priority-overview__metric--' +
      tone +
      '"><b>' +
      value +
      "</b><span>" +
      esc(label) +
      "</span></div>"
    );
  }

  function priorityOverviewUpcomingRowHtml(entry) {
    var tone = getPrioritySectionKey(entry);
    return (
      '<button type="button" class="priority-overview__row priority-overview__row--' +
      tone +
      '" onclick="jumpPriorityTaskDate(\'' +
      entry.ds +
      "')\">" +
      '<span class="priority-overview__row-copy">' +
      '<strong title="' +
      esc(entry.task.text) +
      '">' +
      esc(entry.task.text) +
      "</strong>" +
      "<span>" +
      esc(getTaskTrailingLabel(entry)) +
      "</span></span>" +
      '<em>' +
      esc(getTitleDateText(entry.ds)) +
      "</em></button>"
    );
  }

  function renderPriorityOverviewSidebar(state) {
    var root = document.getElementById("taskDashCol");
    if (!root) return;
    var shell = ensurePriorityOverviewShell(root);
    if (!shell) return;

    root.classList.remove("is-week-action", "is-overdue-action");
    root.classList.add("is-priority-action");
    root.setAttribute("aria-label", "高优先级概览");

    shell.innerHTML =
      '<div class="priority-overview__head"><span class="priority-overview__kicker">高优先级概览</span></div>' +
      '<div class="priority-overview__hero">' +
      '<div class="priority-overview__ring-wrap">' +
      '<div class="priority-overview__ring" style="--priority-ring-bg:' +
      priorityOverviewRingGradient(state) +
      '">' +
      '<div class="priority-overview__ring-center"><strong>' +
      state.totalCount +
      '</strong><span>总计</span></div></div>' +
      '<div class="priority-overview__metrics-side">' +
      priorityOverviewMetricHtml(state.overdueCount, "逾期", "overdue") +
      priorityOverviewMetricHtml(state.todayCount, "今天", "today") +
      priorityOverviewMetricHtml(state.upcomingWeekCount, "本周", "week") +
      "</div></div></div>" +
      '<div class="priority-overview__section">' +
      '<div class="priority-overview__section-head"><div class="priority-overview__section-title">即将到来</div></div>' +
      '<div class="priority-overview__list">' +
      (state.upcomingEntries.length
        ? state.upcomingEntries.map(priorityOverviewUpcomingRowHtml).join("")
        : '<div class="priority-overview__empty">今天之后没有新的高优先级安排。</div>') +
      "</div>" +
      '<button type="button" class="priority-overview__action" onclick="leavePriorityView()">查看完整日程</button>' +
      "</div>";
  }

  function clearPriorityOverviewSidebar() {
    var root = document.getElementById("taskDashCol");
    if (!root) return;
    root.classList.remove("is-priority-action");
    var shell = root.querySelector("." + PRIORITY_SHELL_CLASS);
    if (shell && shell.parentNode) shell.parentNode.removeChild(shell);
  }

  function renderPriorityModeFrame() {
    var state = null;
    if (isPriorityMode()) {
      state = getPrioritySceneState();
      renderPriorityTaskScene(document.getElementById("tList"), state);
      renderPriorityOverviewSidebar(state);
    } else {
      clearPriorityOverviewSidebar();
    }
    ensurePriorityHeaderState(state);
    return state;
  }

  function scheduleApply() {
    renderPriorityModeFrame();
  }

  function hookRender() {
    if (typeof rT !== "function" || window.__priorityViewRTPatched) return;
    window.__priorityViewRTPatched = true;
    var originalRT = rT;
    rT = function () {
      var result = originalRT.apply(this, arguments);
      renderPriorityModeFrame();
      return result;
    };
  }

  window.setPriorityViewTab = function (tab) {
    var nextTab = normalizePriorityTab(tab);
    if (priorityViewTab === nextTab) return;
    priorityViewTab = nextTab;
    persistPriorityTab(priorityViewTab);
    if (typeof rT === "function") rT();
  };

  window.cyclePriorityViewSortMode = function () {
    var currentIndex = PRIORITY_SORT_MODES.indexOf(normalizePrioritySortMode(priorityViewSortMode));
    priorityViewSortMode = PRIORITY_SORT_MODES[(currentIndex + 1) % PRIORITY_SORT_MODES.length];
    persistPrioritySortMode(priorityViewSortMode);
    if (typeof rT === "function") rT();
  };

  window.jumpPriorityTaskDate = function (ds) {
    if (typeof pick === "function") pick(ds);
  };

  window.leavePriorityView = function () {
    if (typeof goToday === "function") goToday();
  };

  window.getPrioritySceneTotalCount = getPrioritySceneTotalCount;

  hookRender();
  scheduleApply();
  if (typeof window.refreshGlobalSideNav === "function") window.refreshGlobalSideNav();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      hookRender();
      scheduleApply();
      if (typeof window.refreshGlobalSideNav === "function") window.refreshGlobalSideNav();
    });
  }

  window.addEventListener("hashchange", scheduleApply);
  window.addEventListener("popstate", scheduleApply);
  window.addEventListener("resize", scheduleApply);
})();

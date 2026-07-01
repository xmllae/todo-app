(function () {
  var _ensureHeaderLayoutRaf = 0;

  function scheduleEnsureHeaderLayout() {
    if (_ensureHeaderLayoutRaf) return;
    _ensureHeaderLayoutRaf = window.requestAnimationFrame(function () {
      _ensureHeaderLayoutRaf = 0;
      ensureHeaderLayout();
    });
  }

  function isDesktop() {
    return window.matchMedia("(min-width: 1181px)").matches;
  }

  function getSortLabel(mode) {
    var key = String(mode || "created");
    if (key === "created") return "创建时间";
    if (key === "priority") return "优先级";
    return "截止日期";
  }

  function getCurrentSortMode() {
    if (typeof lastSort !== "undefined" && lastSort) {
      return String(lastSort);
    }
    if (typeof defaultSortMode !== "undefined" && defaultSortMode) {
      return String(defaultSortMode);
    }
    if (window.lastSort) return String(window.lastSort);
    if (window.defaultSortMode) return String(window.defaultSortMode);
    return "created";
  }

  function ensureSortButtonLabel(batchBar) {
    var sortBtn = batchBar.querySelector(".batch-sort-btn");
    if (!sortBtn) return;
    var label = sortBtn.querySelector(".batch-sort-label");
    if (!label) {
      label = document.createElement("span");
      label.className = "batch-sort-label";
      sortBtn.appendChild(label);
    }
    label.textContent = getSortLabel(getCurrentSortMode());

    var chev = sortBtn.querySelector(".batch-sort-chev");
    if (!chev) {
      chev = document.createElement("span");
      chev.className = "batch-sort-chev";
      chev.setAttribute("aria-hidden", "true");
      chev.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
      sortBtn.appendChild(chev);
    }
  }

  function cleanupSortButtonLabel(batchBar) {
    var sortBtn = batchBar.querySelector(".batch-sort-btn");
    if (!sortBtn) return;
    var extra = sortBtn.querySelectorAll(".batch-sort-label, .batch-sort-chev");
    extra.forEach(function (el) {
      el.remove();
    });
  }

  function ensureBatchActionIcons(batchBar) {
    if (!batchBar) return;
    var multiBtn = batchBar.querySelector("#multiSelectBtn");
    if (!multiBtn) return;
    var targetSvg =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>';
    if (multiBtn.innerHTML.indexOf("M21 12v7") === -1) {
      multiBtn.innerHTML = targetSvg;
    }
  }

  function syncQuickImportShortcutState(addSplit) {
    if (!addSplit) return;
    var quickBtn = addSplit.querySelector(".add-split-quick");
    if (!quickBtn) return;
    var quickBox = document.getElementById("quickImportBox");
    var isOpen = !!(quickBox && !quickBox.classList.contains("hidden"));
    quickBtn.classList.toggle("is-open", isOpen);
    quickBtn.setAttribute("aria-pressed", isOpen ? "true" : "false");
  }

  function isWeekQuickModePending() {
    if (typeof getGlobalSideNavQuickMode === "function") {
      return getGlobalSideNavQuickMode() === "week";
    }
    try {
      var state = JSON.parse(localStorage.getItem("tuole_gsn_state_v1") || "null");
      return !!(state && state.quick === "week");
    } catch (e) {
      return false;
    }
  }

  function primeWeekBulkActionState(addSplit) {
    if (!addSplit) return;
    var mainBtn = addSplit.querySelector(".add-split-main");
    if (!mainBtn) return;
    if (isWeekQuickModePending()) {
      if (mainBtn.dataset.weekBulkToggle === "1") return;
      addSplit.classList.add("is-week-bulk-booting");
      mainBtn.dataset.weekBulkToggle = "1";
      mainBtn.classList.add("is-week-bulk-idle");
      mainBtn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="7 10 12 15 17 10"></polyline><polyline points="7 5 12 10 17 5"></polyline></svg>\u5c55\u5f00\u4efb\u52a1';
      mainBtn.setAttribute("title", "\u5c55\u5f00\u4efb\u52a1");
      mainBtn.setAttribute("aria-label", "\u5c55\u5f00\u4efb\u52a1");
      mainBtn.setAttribute("aria-disabled", "true");
      mainBtn.tabIndex = 0;
      return;
    }
    if (
      mainBtn.dataset.weekBulkToggle === "1" ||
      addSplit.classList.contains("is-week-bulk-hidden") ||
      addSplit.classList.contains("is-week-bulk-booting")
    ) {
      if (typeof markWeekHeaderActionInstant === "function") {
        markWeekHeaderActionInstant(addSplit);
      } else {
        addSplit.classList.add("add-split--instant-restore");
        window.setTimeout(function () {
          if (addSplit && addSplit.classList) {
            addSplit.classList.remove("add-split--instant-restore");
          }
        }, 220);
      }
    }
    addSplit.classList.remove("is-week-bulk-booting", "is-week-bulk-hidden");
    addSplit.removeAttribute("aria-hidden");
    mainBtn.tabIndex = 0;
  }

  function ensureQuickImportShortcut(addSplit) {
    if (!addSplit) return;
    var mainBtn = addSplit.querySelector(".add-split-main");
    if (!mainBtn) return;

    addSplit.classList.add("add-split--quick-shortcut");

    var quickBtn = addSplit.querySelector(".add-split-quick");
    if (!quickBtn) {
      quickBtn = document.createElement("button");
      quickBtn.type = "button";
      quickBtn.className = "add-split-quick";
      quickBtn.setAttribute("title", "\u5feb\u901f\u5bfc\u5165");
      quickBtn.setAttribute("aria-label", "\u5feb\u901f\u5bfc\u5165");
      quickBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>';
      quickBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof closeAddSplitMenu === "function") closeAddSplitMenu();
        if (typeof toggleQuickImport === "function") toggleQuickImport();
        if (typeof syncQuickImportEntryState === "function") {
          window.requestAnimationFrame(syncQuickImportEntryState);
        } else {
          window.requestAnimationFrame(function () {
            syncQuickImportShortcutState(addSplit);
          });
        }
      });
      addSplit.insertBefore(quickBtn, mainBtn);
    }

    syncQuickImportShortcutState(addSplit);
  }

  function ensureHeaderLayout(forceRunWhenHidden) {
    var taskMode = document.getElementById("taskMode");
    if (!taskMode || (!forceRunWhenHidden && taskMode.classList.contains("hidden"))) return;

    var dateNav = document.querySelector(
      "#taskMode .task-main-col > .task-card > .date-nav",
    );
    var batchBar = document.querySelector(
      "#taskMode .task-main-col .list-panel .batch-bar",
    );
    if (!dateNav || !batchBar) return;

    var batchLeft = batchBar.querySelector(".batch-bar-left");
    if (!batchLeft) return;

    var actionWrap = dateNav.querySelector(".date-nav-actions");
    var movedAdd = dateNav.querySelector(".date-nav-actions .add-split");
    ensureBatchActionIcons(batchBar);

    if (!isDesktop()) {
      if (movedAdd) batchLeft.insertBefore(movedAdd, batchLeft.firstChild || null);
      var inlineAdd = batchLeft.querySelector(".add-split");
      if (inlineAdd) ensureQuickImportShortcut(inlineAdd);
      var desktopTodayBtns = dateNav.querySelectorAll(".date-nav-today-btn");
      desktopTodayBtns.forEach(function (el) {
        el.remove();
      });
      if (actionWrap) {
        if (!actionWrap.children.length) actionWrap.remove();
      }
      cleanupSortButtonLabel(batchBar);
      return;
    }

    var desktopTodayBtns = dateNav.querySelectorAll(".date-nav-today-btn");
    desktopTodayBtns.forEach(function (el) {
      el.remove();
    });

    if (!actionWrap) {
      actionWrap = document.createElement("div");
      actionWrap.className = "date-nav-actions";
      dateNav.appendChild(actionWrap);
    }

    var addSplit = batchBar.querySelector(".batch-bar-left .add-split");
    if (addSplit) {
      primeWeekBulkActionState(addSplit);
      actionWrap.appendChild(addSplit);
    }
    var actionAddSplit = actionWrap.querySelector(".add-split");
    if (actionAddSplit) {
      primeWeekBulkActionState(actionAddSplit);
      ensureQuickImportShortcut(actionAddSplit);
    }

    ensureSortButtonLabel(batchBar);
  }

  function hook(name) {
    var fn = window[name];
    if (typeof fn !== "function") return;
    var key = "__sched_ref_fix_" + name;
    if (window[key]) return;
    window[key] = true;
    window[name] = function () {
      var ret = fn.apply(this, arguments);
      // Run once synchronously to avoid first-paint jump, then one RAF pass as a safety net.
      ensureHeaderLayout();
      scheduleEnsureHeaderLayout();
      return ret;
    };
  }

  function boot() {
    ensureHeaderLayout();
    hook("rT");
    hook("rFilterBar");
    hook("rAll");
    hook("applyMode");
    hook("updateSortUI");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.ensureScheduleHeaderLayoutNow = function (forceRunWhenHidden) {
    ensureHeaderLayout(!!forceRunWhenHidden);
  };
  window.ensureScheduleHeaderLayout = scheduleEnsureHeaderLayout;

  window.addEventListener("resize", function () {
    scheduleEnsureHeaderLayout();
  });
  window.addEventListener("hashchange", function () {
    scheduleEnsureHeaderLayout();
  });
  window.addEventListener("popstate", function () {
    scheduleEnsureHeaderLayout();
  });
})();

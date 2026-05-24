(function () {
  if (window.__overdueHeaderViewBound) return;
  window.__overdueHeaderViewBound = true;

  var OVERDUE_CLASS = "task-mode--overdue-view";
  var OVERDUE_NAV_CLASS = "date-nav--overdue";

  function isOverdueMode() {
    return typeof getTaskQuickMode === "function" && getTaskQuickMode() === "overdue";
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

  function getOverdueSubtitle() {
    return "\u672a\u5b8c\u6210\u7684\u5386\u53f2\u4efb\u52a1";
  }

  function setArrowAvailability(dateNav, disabled) {
    if (!dateNav) return;
    dateNav.querySelectorAll(".nav-arrow").forEach(function (btn) {
      if (disabled) {
        if (!btn.dataset.overduePrevTabIndex) {
          btn.dataset.overduePrevTabIndex = btn.getAttribute("tabindex") || "";
        }
        if (!btn.dataset.overduePrevVisibility) {
          btn.dataset.overduePrevVisibility = btn.style.visibility || "";
        }
        if (!btn.dataset.overduePrevPointerEvents) {
          btn.dataset.overduePrevPointerEvents = btn.style.pointerEvents || "";
        }
        btn.setAttribute("aria-hidden", "true");
        btn.tabIndex = -1;
        btn.style.visibility = "hidden";
        btn.style.pointerEvents = "none";
        return;
      }

      btn.removeAttribute("aria-hidden");
      if (btn.dataset.overduePrevTabIndex) {
        btn.setAttribute("tabindex", btn.dataset.overduePrevTabIndex);
      } else {
        btn.removeAttribute("tabindex");
      }
      btn.style.visibility = btn.dataset.overduePrevVisibility || "";
      btn.style.pointerEvents = btn.dataset.overduePrevPointerEvents || "";
      delete btn.dataset.overduePrevTabIndex;
      delete btn.dataset.overduePrevVisibility;
      delete btn.dataset.overduePrevPointerEvents;
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

  function closeOverdueCreateEntries() {
    if (typeof closeAddSplitMenu === "function") closeAddSplitMenu();
    if (window._quickImportModalOpen && typeof closeQuickImportModal === "function") closeQuickImportModal();

    var quickBox = document.getElementById("quickImportBox");
    if (quickBox) quickBox.classList.add("hidden");

    var addHold = document.getElementById("addTaskInlineHold");
    if (addHold && !addHold.classList.contains("hidden")) {
      if (typeof hideAddTaskInline === "function") hideAddTaskInline();
      else addHold.classList.add("hidden");
    }

    var addWrap = document.getElementById("addEmbedWrap");
    if (addWrap) addWrap.classList.remove("add-embed-active");

    var addSplit = document.querySelector("#taskMode .task-main-col .add-split");
    if (addSplit) addSplit.classList.remove("add-split-form-open");

    if (typeof syncQuickImportEntryState === "function") syncQuickImportEntryState();
    if (typeof syncAddTaskMainLabel === "function") syncAddTaskMainLabel(false);
  }

  function closeOverdueTaskToolbar() {
    var sortDropdown = document.getElementById("sortDropdown");
    if (sortDropdown) sortDropdown.classList.remove("show");

    var batchBar = document.getElementById("batchBar");
    if (batchBar && document.activeElement && batchBar.contains(document.activeElement)) {
      try {
        document.activeElement.blur();
      } catch (e) {}
    }

    if (typeof multiSelect !== "undefined" && multiSelect) {
      if (typeof toggleMultiSelect === "function") {
        toggleMultiSelect();
      } else {
        multiSelect = false;
        if (typeof selectedIds !== "undefined" && selectedIds && selectedIds.clear) selectedIds.clear();
        var multiBtn = document.getElementById("multiSelectBtn");
        var multiBar = document.getElementById("multiBar");
        var listPanel = document.querySelector("#taskMode .list-panel");
        if (multiBtn) multiBtn.classList.remove("on");
        if (multiBar) multiBar.classList.remove("show");
        if (listPanel) listPanel.classList.remove("list-panel--multi");
      }
    }
  }

  function renderOverdueTitle() {
    var title = getTitleHost();
    if (!title) return;
    clearTitleMotion(title);

    var key = "overdue|title";
    if (
      title.dataset.renderKey !== key ||
      !title.querySelector(".date-nav-date-main") ||
      !title.querySelector(".date-nav-date-sub")
    ) {
      title.innerHTML =
        '<span class="date-nav-date-main">\u903e\u671f</span>' +
        '<span class="date-nav-date-sub"></span>';
      title.dataset.renderKey = key;
      title.dataset.lastDs = "overdue";
    }

    title.classList.remove("is-week-scope", "is-range-offset", "is-relative", "is-plain-date");
    clearTitleMotion(title);
    title.classList.add("is-overdue-scope");

    var main = title.querySelector(".date-nav-date-main");
    var sub = title.querySelector(".date-nav-date-sub");
    if (main) main.removeAttribute("style");
    if (sub) {
      sub.textContent = getOverdueSubtitle();
      sub.removeAttribute("aria-hidden");
      sub.classList.remove("date-nav-date-sub--ghost");
      sub.classList.remove("is-empty");
      sub.removeAttribute("style");
    }
  }

  function clearOverdueTitle() {
    var title = getTitleHost();
    if (!title) return;
    title.classList.remove("is-overdue-scope");
  }

  function bindOverdueTitleClickGuard(dateNav) {
    if (!dateNav || dateNav.dataset.overdueClickGuardBound) return;
    var h3 = dateNav.querySelector("h3");
    if (!h3) return;
    dateNav.dataset.overdueClickGuardBound = "1";
    h3.addEventListener(
      "click",
      function (event) {
        if (!isOverdueMode()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  function applyOverdueHeaderState() {
    var taskMode = getTaskMode();
    var dateNav = getDateNav();
    var overdue = isOverdueMode();

    if (taskMode) taskMode.classList.toggle(OVERDUE_CLASS, overdue);
    if (dateNav) {
      dateNav.classList.toggle(OVERDUE_NAV_CLASS, overdue);
      bindOverdueTitleClickGuard(dateNav);
      setArrowAvailability(dateNav, overdue);
      syncReturnTodayButton(dateNav, overdue);
    }

    if (overdue) {
      closeOverdueCreateEntries();
      closeOverdueTaskToolbar();
      renderOverdueTitle();
      clearTitleMotion(getTitleHost());
    }
    else clearOverdueTitle();
  }

  function scheduleApply() {
    applyOverdueHeaderState();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(applyOverdueHeaderState);
    }
  }

  function hookRender() {
    if (typeof rT !== "function" || window.__overdueHeaderRTPatched) return;
    window.__overdueHeaderRTPatched = true;
    var originalRT = rT;
    rT = function () {
      var result = originalRT.apply(this, arguments);
      scheduleApply();
      return result;
    };
  }

  hookRender();
  scheduleApply();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      hookRender();
      scheduleApply();
    });
  }

  window.addEventListener("hashchange", scheduleApply);
  window.addEventListener("popstate", scheduleApply);
  window.addEventListener("resize", scheduleApply);
  window.applyOverdueHeaderState = scheduleApply;
})();

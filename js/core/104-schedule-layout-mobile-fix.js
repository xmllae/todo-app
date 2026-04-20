(function () {
  function isDesktop() {
    return window.matchMedia("(min-width: 1181px)").matches;
  }

  function getSortLabel(mode) {
    var key = String(mode || "deadline");
    if (key === "created") return "创建时间";
    if (key === "priority") return "优先级";
    return "截止日期";
  }

  function ensureArrowGroup(dateNav) {
    var h3 = dateNav.querySelector("h3");
    if (!h3) return;
    var arrows = dateNav.querySelectorAll(".nav-arrow");
    if (!arrows || arrows.length < 2) return;
    var group = dateNav.querySelector(".date-nav-arrow-group");
    if (!group) {
      group = document.createElement("div");
      group.className = "date-nav-arrow-group";
    }
    group.appendChild(arrows[0]);
    group.appendChild(arrows[1]);
    dateNav.insertBefore(group, h3);
  }

  function restoreArrowOrder(dateNav) {
    var group = dateNav.querySelector(".date-nav-arrow-group");
    var h3 = dateNav.querySelector("h3");
    if (!group || !h3) return;
    var arrows = group.querySelectorAll(".nav-arrow");
    if (arrows.length >= 2) {
      dateNav.insertBefore(arrows[0], h3);
      if (h3.nextSibling) dateNav.insertBefore(arrows[1], h3.nextSibling);
      else dateNav.appendChild(arrows[1]);
    }
    group.remove();
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
    label.textContent = getSortLabel(window.lastSort || window.defaultSortMode || "deadline");

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

  function createTodayBtn() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "date-nav-today-btn";
    btn.setAttribute("aria-label", "\u56de\u5230\u4eca\u5929");
    btn.innerHTML =
      '<i class="ph ph-calendar-blank" aria-hidden="true"></i><span>\u4eca\u5929</span>';
    btn.addEventListener("click", function () {
      if (typeof goToday === "function") goToday();
    });
    return btn;
  }

  function ensureHeaderLayout() {
    var taskMode = document.getElementById("taskMode");
    if (!taskMode || taskMode.classList.contains("hidden")) return;

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

    if (!isDesktop()) {
      restoreArrowOrder(dateNav);
      if (movedAdd) batchLeft.insertBefore(movedAdd, batchLeft.firstChild || null);
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

    ensureArrowGroup(dateNav);

    if (!actionWrap) {
      actionWrap = document.createElement("div");
      actionWrap.className = "date-nav-actions";
      dateNav.appendChild(actionWrap);
    }

    var h3 = dateNav.querySelector("h3");
    var allTodayBtns = dateNav.querySelectorAll(".date-nav-today-btn");
    if (!allTodayBtns.length) {
      var todayBtn = createTodayBtn();
      if (h3 && h3.nextSibling) dateNav.insertBefore(todayBtn, h3.nextSibling);
      else dateNav.appendChild(todayBtn);
    } else {
      allTodayBtns.forEach(function (btn, idx) {
        if (idx > 0) {
          btn.remove();
          return;
        }
        btn.setAttribute("aria-label", "\u56de\u5230\u4eca\u5929");
        btn.innerHTML =
          '<i class="ph ph-calendar-blank" aria-hidden="true"></i><span>\u4eca\u5929</span>';
        if (h3 && btn.previousSibling !== h3) {
          if (h3.nextSibling) dateNav.insertBefore(btn, h3.nextSibling);
          else dateNav.appendChild(btn);
        }
      });
    }

    var addSplit = batchBar.querySelector(".batch-bar-left .add-split");
    if (addSplit) actionWrap.appendChild(addSplit);

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
      setTimeout(ensureHeaderLayout, 0);
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

  window.addEventListener("resize", function () {
    setTimeout(ensureHeaderLayout, 0);
  });
  window.addEventListener("hashchange", function () {
    setTimeout(ensureHeaderLayout, 0);
  });
  window.addEventListener("popstate", function () {
    setTimeout(ensureHeaderLayout, 0);
  });
})();

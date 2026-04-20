(function () {
  function isDesktop() {
    return window.matchMedia("(min-width: 1181px)").matches;
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
      if (movedAdd) batchLeft.insertBefore(movedAdd, batchLeft.firstChild || null);
      if (actionWrap) {
        var tBtns = actionWrap.querySelectorAll(".date-nav-today-btn");
        tBtns.forEach(function (el) {
          el.remove();
        });
        if (!actionWrap.children.length) actionWrap.remove();
      }
      return;
    }

    if (!actionWrap) {
      actionWrap = document.createElement("div");
      actionWrap.className = "date-nav-actions";
      dateNav.appendChild(actionWrap);
    }

    var allTodayBtns = actionWrap.querySelectorAll(".date-nav-today-btn");
    if (!allTodayBtns.length) {
      actionWrap.appendChild(createTodayBtn());
    } else {
      allTodayBtns.forEach(function (btn, idx) {
        if (idx > 0) {
          btn.remove();
          return;
        }
        btn.setAttribute("aria-label", "\u56de\u5230\u4eca\u5929");
        btn.innerHTML =
          '<i class="ph ph-calendar-blank" aria-hidden="true"></i><span>\u4eca\u5929</span>';
      });
    }

    var addSplit = batchBar.querySelector(".batch-bar-left .add-split");
    if (addSplit) actionWrap.appendChild(addSplit);
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

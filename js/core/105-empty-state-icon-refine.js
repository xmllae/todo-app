// 空状态图标优化：按场景替换旧 emoji，避免大面积色块和强成功符号。
(function () {
  function getEmptyState(empty) {
    var main = empty.querySelector(".empty-main");
    var text = main ? main.textContent : "";

    return text.indexOf("匹配") >= 0 ? "filter" : "complete";
  }

  function iconMarkup() {
    return [
      '<svg class="empty-state-icon empty-state-icon--party" viewBox="0 0 48 48" aria-hidden="true" focusable="false">',
      '<path d="M14 35.5 20.5 18l9.5 9.5L14 35.5Z"/>',
      '<path class="empty-state-icon__soft" d="m20.5 18 2.8 14.7"/>',
      '<path class="empty-state-icon__soft" d="M28.5 12.5c1.8-2.5 5.1-2.7 7.1-.7 1.8 1.8 1.6 4.6-.2 6.3"/>',
      '<path d="M32.5 21.5h.1"/>',
      '<path d="M37 28h.1"/>',
      '<path d="M22.5 10.5h.1"/>',
      '<path class="empty-state-icon__soft" d="M35.5 7.5 38 5"/>',
      '<path class="empty-state-icon__soft" d="M40 17.5h3"/>',
      '<path class="empty-state-icon__soft" d="M28.5 5.5v-3"/>',
      "</svg>"
    ].join("");
  }

  function refineEmptyIcons(root) {
    var scope = root || document;
    var empties = scope.querySelectorAll(".empty");

    empties.forEach(function (empty) {
      var icon = empty.querySelector(".em");

      if (!icon) return;

      var state = getEmptyState(empty);

      empty.classList.toggle("empty--filter", state === "filter");
      empty.classList.toggle("empty--complete", state === "complete");

      if (icon.dataset.emptyIconState !== state) {
        icon.innerHTML = iconMarkup();
        icon.dataset.emptyIconState = state;
      }

      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("role", "presentation");
    });
  }

  function initEmptyIconRefine() {
    var taskList = document.getElementById("tList");

    if (!taskList) return;

    refineEmptyIcons(taskList);

    var observer = new MutationObserver(function () {
      refineEmptyIcons(taskList);
    });

    observer.observe(taskList, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEmptyIconRefine);
  } else {
    initEmptyIconRefine();
  }
})();

// App bootstrap: restore theme first, then recover cloud/guest session.

const SVG_MOON = '<i class="header-utility-ico ph ph-moon" aria-hidden="true"></i>';
const SVG_SUN = '<i class="header-utility-ico ph ph-sun" aria-hidden="true"></i>';

function setDarkBtnIcon(animated) {
  const wrapper = document.querySelector("#darkBtn .dark-btn-ico");

  if (!wrapper) {
    return;
  }

  const iconHtml = isDark ? SVG_SUN : SVG_MOON;
  const reducedMotion =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!animated || reducedMotion) {
    wrapper.innerHTML = iconHtml;
    wrapper.classList.remove("dark-ico-exit", "dark-ico-enter");
    return;
  }

  wrapper.classList.remove("dark-ico-exit", "dark-ico-enter");

  let swapped = false;

  const swapIcon = function swapIcon() {
    if (swapped) {
      return;
    }

    swapped = true;
    wrapper.innerHTML = iconHtml;
    wrapper.classList.remove("dark-ico-exit");
    void wrapper.offsetWidth;
    wrapper.classList.add("dark-ico-enter");

    const finishEnter = function finishEnter() {
      wrapper.classList.remove("dark-ico-enter");
      wrapper.removeEventListener("animationend", finishEnter);
    };

    wrapper.addEventListener("animationend", finishEnter, { once: true });
    setTimeout(finishEnter, 400);
  };

  const handleExit = function handleExit() {
    clearTimeout(fallbackTimer);
    swapIcon();
  };

  wrapper.classList.add("dark-ico-exit");
  wrapper.addEventListener("animationend", handleExit, { once: true });

  const fallbackTimer = setTimeout(function runDarkIconFallback() {
    wrapper.removeEventListener("animationend", handleExit);
    swapIcon();
  }, 280);
}

function restoreThemePreference() {
  const darkFlag = window.TuoleApi.storage.readValue("tuole_dark");

  if (darkFlag === "1") {
    isDark = true;
    document.body.classList.add("dark");
    setDarkBtnIcon(false);
  }
}

async function init() {
  renderAvatarPicker();
  initTaskDashReorder();
  restoreThemePreference();
  await restoreSessionOnStartup();
}

init();

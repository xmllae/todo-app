// 订阅弹窗日期与周期联动：负责周期切换、日期推算、草稿、时间输入与即时提示。

var _subDraft = null;

function _subSetCycle(value) {
  window._subCalcDone = false;
  _subUpdateCalcBtn();
  _subCycle = value;

  document.querySelectorAll(".sub-cycle-btn").forEach(function(button) {
    applySubCycleButtonState(button, button.dataset.v === value);
  });

  toggleSubCustomDaysWrap(value === "custom");

  if (value === "custom") {
    setTimeout(_subUpdateDateFromDays, 0);
  }
}

function _subUpdateDaysLeft() {
  const badge = getSubElement("subDaysInline");
  const dateValue = window._subDateVal || "";

  if (!badge) {
    return;
  }

  if (!dateValue) {
    badge.style.display = "none";
    return;
  }

  const targetDate = new Date(dateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const days = Math.ceil((targetDate - today) / 864e5);
  const badgeState = getSubDaysBadgeState(days);

  badge.textContent = badgeState.text;
  badge.style.display = "inline-block";
  badge.style.background = badgeState.background;
  badge.style.color = badgeState.color;
  badge.style.animation = badgeState.animation;
  badge.style.transition = "all 0.3s ease";
}

function _subUpdateDateFromDays() {
  const customDaysInput = getSubElement("subCustomDaysIn");
  const preview = getSubElement("subCustomDatePreview");

  if (!customDaysInput) {
    return;
  }

  const days = parseInt(customDaysInput.value, 10) || 0;
  window._subCalcDone = false;
  _subUpdateCalcBtn();

  if (days <= 0) {
    if (preview) {
      preview.textContent = "";
    }
    return;
  }

  const date = new Date();
  date.setDate(date.getDate() + days);

  if (preview) {
    preview.textContent = "到期 " + formatSubDatePreview(date);
  }
}

function _subSaveDraft() {
  const nameInput = getSubElement("subNameIn");

  if (!nameInput) {
    return;
  }

  const customDaysInput = getSubElement("subCustomDaysIn");
  const draft = {
    name: nameInput.value || "",
    expireDate: getSubInputValue("subDateIn"),
    cost: getSubInputValue("subCostIn"),
    cycle: _subCycle,
    note: getSubInputValue("subNoteIn"),
    customDays: customDaysInput ? customDaysInput.value || "" : "",
    renewal: window._subRenewalVal || "manual"
  };

  if (!draft.name.trim() && !draft.cost && !draft.note && !draft.customDays) {
    return;
  }

  _subDraft = draft;
}

function _subCancel() {
  const confirmBox = getSubElement("subCancelConfirm");

  if (confirmBox) {
    confirmBox.remove();
  }

  _subClearDraft();
  clM();
}

function _subSaveClick(event, id) {
  const name = getSubInputValue("subNameIn");

  if (!name.trim()) {
    saveSub(id);
    return;
  }

  const button = event.currentTarget;
  createSubRipple(button, event.clientX, event.clientY);
  button.classList.add("loading");
  button.disabled = true;

  setTimeout(function() {
    saveSub(id);
  }, 120);
}

function _subClearDraft() {
  _subDraft = null;
}

function _subSetRenewal(value) {
  window._subRenewalVal = value;

  const manualButton = getSubElement("subRenMan");
  const autoButton = getSubElement("subRenAut");

  if (!manualButton || !autoButton) {
    return;
  }

  applySubRenewalButtonState(manualButton, value === "manual");
  applySubRenewalButtonState(autoButton, value !== "manual");
}

function _subUpdateProgress() {
  const filled =
    (getSubInputValue("subNameIn").trim() ? 1 : 0) +
    (getSubInputValue("subDateIn") ? 1 : 0) +
    (getSubInputValue("subCostIn") ? 1 : 0);
  const percent = Math.round((filled / 3) * 100);
  const progressBar = getSubElement("subProgress");
  const progressLabel = getSubElement("subProgressLbl");

  if (progressBar) {
    progressBar.style.width = percent + "%";
  }

  if (progressLabel) {
    progressLabel.textContent = filled + " / 3 必填项";
  }
}

function _subCalcDate() {
  const date = new Date();
  date.setDate(date.getDate() + getSubCycleDays());

  const datePart = formatSubDateValue(date);
  const datePicker = getSubElement("subDatePicker");
  const dateInput = getSubElement("subDateInput");

  window._subCalcDone = true;
  _subSetDate(datePart, true);

  if (datePicker) {
    datePicker.value = datePart;
  }

  if (dateInput) {
    dateInput.value = datePart.replace(/-/g, "/");
  }

  _subUpdateCalcBtn();
}

function _subUpdateCalcBtn() {
  const button = getSubElement("subCalcBtn");

  if (!button) {
    return;
  }

  if (window._subCalcDone) {
    button.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><polyline points="20 6 9 17 4 12"/></svg> 已推算';
    button.style.color = "#22c55e";
    return;
  }

  button.textContent = "推算到期";
  button.style.color = "#818cf8";
}

function _subSyncHiddenDate() {
  const hiddenInput = getSubElement("subDateIn");
  const dateValue = window._subDateVal || "";
  const timeValue = window._subTimeVal || "";

  if (!hiddenInput) {
    return;
  }

  hiddenInput.value = dateValue + (timeValue ? "T" + timeValue : "T00:00");
}

function _subOpenDatePicker() {
  openSubPicker("subDatePicker");
}

function _subOpenTimePicker() {
  openSubPicker("subTimePicker");
}

function _subSetDate(value, fromCalc) {
  const dateInput = getSubElement("subDateInput");

  window._subDateVal = value;

  if (!fromCalc) {
    window._subCalcDone = false;
    _subUpdateCalcBtn();
  }

  if (dateInput && value) {
    dateInput.value = value.replace(/-/g, "/");
    dateInput.style.color = "var(--text)";
    dateInput.style.fontWeight = "600";
  }

  _subSyncHiddenDate();
  _subUpdateDaysLeft();
}

function _subSetTime(value) {
  const timeInput = getSubElement("subTimeInput");

  window._subTimeVal = value;

  if (timeInput) {
    timeInput.value = value || "";
    timeInput.style.color = value ? "var(--text)" : "#b4c0d8";
  }

  toggleSubTimeClearState(!!value);
  _subSyncHiddenDate();
}

function _subClearTime() {
  const timeInput = getSubElement("subTimeInput");

  window._subTimeVal = "";

  if (timeInput) {
    timeInput.value = "";
    timeInput.style.color = "#b4c0d8";
  }

  toggleSubTimeClearState(false);
  _subSyncHiddenDate();
}

function _subBoxMouseEnter() {
  const clearButton = getSubElement("subTimeClear");

  if (clearButton && clearButton.getAttribute("data-has-val")) {
    clearButton.style.opacity = "1";
    clearButton.style.pointerEvents = "auto";
  }
}

function _subBoxMouseLeave() {
  const clearButton = getSubElement("subTimeClear");

  if (clearButton) {
    clearButton.style.opacity = "0";
    clearButton.style.pointerEvents = "none";
  }
}

function _subDateFocus() {
  setSubDateTimeBoxFocus(true);
}

function _subDateBlur() {
  setSubDateTimeBoxFocus(false);
}

function _subTimeFocus() {
  setSubDateTimeBoxFocus(true);
}

function _subTimeBlur() {
  setSubDateTimeBoxFocus(false);
}

function _subDateInputChange(value) {
  const input = getSubElement("subDateInput");
  const parsed = parseSubDateInput(value);

  if (!input) {
    return;
  }

  if (!parsed.dayComplete) {
    input.style.borderColor = "";
    input.style.boxShadow = "";
    return;
  }

  if (parsed.valid) {
    input.style.borderColor = "#6366f1";
    input.style.boxShadow = "0 0 0 3px rgba(99,102,241,.15)";
    _subSetDate(parsed.value, false);
    return;
  }

  if (value.length >= 8) {
    input.style.borderColor = "#ef4444";
    input.style.boxShadow = "0 0 0 2px rgba(239,68,68,.15)";
    return;
  }

  input.style.borderColor = "";
  input.style.boxShadow = "";
}

function _subTimeInputChange(value) {
  const timeInput = getSubElement("subTimeInput");
  const cleanValue = value.trim().replace(/[^0-9:]/g, "");
  const valid = /^([01]?\d|2[0-3]):[0-5]\d$/.test(cleanValue);

  if (valid) {
    if (timeInput) {
      timeInput.style.color = "var(--text)";
    }
    _subSetTime(cleanValue);
    return;
  }

  if (cleanValue) {
    if (timeInput) {
      timeInput.style.color = "#ef4444";
    }
    return;
  }

  _subSetTime("");
}

function applySubCycleButtonState(button, isActive) {
  button.style.background = isActive ? "#6366f1" : "#f8faff";
  button.style.color = isActive ? "#fff" : "var(--text2)";
  button.style.borderColor = isActive ? "#6366f1" : "#e2e8f0";
  button.style.boxShadow = isActive ? "inset 0 2px 8px rgba(0,0,0,.15)" : "none";
  button.style.transform = "none";

  button.querySelectorAll("svg").forEach(function(svg) {
    svg.setAttribute("stroke", isActive ? "#fff" : "#6366f1");
  });

  const checkmark = button.querySelector(".cyc-check");
  if (checkmark) {
    checkmark.remove();
  }
}

function toggleSubCustomDaysWrap(isCustom) {
  const customDaysWrap = getSubElement("subCustomDaysWrap");
  const dateRow = getSubElement("subDateRow");

  if (customDaysWrap) {
    customDaysWrap.style.display = isCustom ? "flex" : "none";
  }

  if (dateRow) {
    dateRow.style.display = "block";
  }
}

function getSubDaysBadgeState(days) {
  if (days > 60) {
    return {
      background: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
      color: "#065f46",
      text: "🟢 还剩 " + days + " 天",
      animation: ""
    };
  }

  if (days >= 30) {
    return {
      background: "linear-gradient(135deg,#fef9c3,#fde68a)",
      color: "#854d0e",
      text: "🟡 还剩 " + days + " 天",
      animation: ""
    };
  }

  if (days >= 1) {
    return {
      background: "linear-gradient(135deg,#fee2e2,#fca5a5)",
      color: "#991b1b",
      text: "🔴 还剩 " + days + " 天",
      animation: "subBadgePulse 1.8s ease-in-out infinite"
    };
  }

  return {
    background: "linear-gradient(135deg,#fee2e2,#fca5a5)",
    color: "#991b1b",
    text: "🔴 已过期 " + Math.abs(days) + " 天",
    animation: "subBadgePulse 1.8s ease-in-out infinite"
  };
}

function createSubRipple(button, clientX, clientY) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement("span");

  ripple.style =
    "position:absolute;border-radius:50%;background:rgba(255,255,255,.6);transform:scale(0);animation:subRipple .6s linear;pointer-events:none;width:100px;height:100px;left:" +
    (clientX - rect.left - 50) +
    "px;top:" +
    (clientY - rect.top - 50) +
    "px";
  button.appendChild(ripple);

  setTimeout(function() {
    ripple.remove();
  }, 700);
}

function applySubRenewalButtonState(button, isActive) {
  button.classList.toggle("ren-on", isActive);
  button.style.borderColor = isActive ? "#c7d2fe" : "#e2e8f0";
  button.style.background = isActive ? "#eef2ff" : "#f8faff";
  button.style.color = isActive ? "#4338ca" : "var(--text2)";
}

function getSubCycleDays() {
  if (_subCycle === "month") {
    return 30;
  }

  if (_subCycle === "quarter") {
    return 90;
  }

  if (_subCycle === "year") {
    return 365;
  }

  if (_subCycle === "custom") {
    return parseInt(getSubInputValue("subCustomDaysIn"), 10) || 30;
  }

  return 30;
}

function toggleSubTimeClearState(hasValue) {
  const clearButton = getSubElement("subTimeClear");

  if (!clearButton) {
    return;
  }

  if (hasValue) {
    clearButton.setAttribute("data-has-val", "1");
    clearButton.style.opacity = "1";
    clearButton.style.pointerEvents = "auto";
    return;
  }

  clearButton.removeAttribute("data-has-val");
  clearButton.style.opacity = "0";
  clearButton.style.pointerEvents = "none";
}

function setSubDateTimeBoxFocus(isActive) {
  const dateTimeBox = getSubElement("subDateTimeBox");

  if (!dateTimeBox) {
    return;
  }

  dateTimeBox.style.borderColor = isActive ? "#6c63ff" : "#e2e8f0";
  dateTimeBox.style.boxShadow = isActive ? "0 0 0 3px rgba(108,99,255,.1)" : "none";
}

function parseSubDateInput(value) {
  const parts = value.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);

  if (!parts) {
    return {
      dayComplete: value.length < 8,
      valid: false,
      value: ""
    };
  }

  const month = +parts[2];
  const day = +parts[3];
  const dayComplete = parts[3].length === 2 || day > 3;

  if (!dayComplete) {
    return {
      dayComplete: false,
      valid: false,
      value: ""
    };
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      dayComplete: true,
      valid: false,
      value: ""
    };
  }

  const normalizedValue =
    parts[1] +
    "-" +
    String(month).padStart(2, "0") +
    "-" +
    String(day).padStart(2, "0");
  const parsedDate = new Date(normalizedValue);

  return {
    dayComplete: true,
    valid: !isNaN(parsedDate.getTime()),
    value: normalizedValue
  };
}

function openSubPicker(id) {
  const input = getSubElement(id);

  if (!input) {
    return;
  }

  if (input.showPicker) {
    input.showPicker();
    return;
  }

  input.click();
}

function formatSubDateValue(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatSubDatePreview(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("/");
}

function getSubElement(id) {
  return document.getElementById(id);
}

function getSubInputValue(id) {
  const element = getSubElement(id);
  return element ? element.value || "" : "";
}

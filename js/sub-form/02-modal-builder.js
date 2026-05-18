// 订阅弹窗：负责组装订阅表单的结构与初始状态，不改动既有交互入口。

var SUB_MODAL_INPUT_STYLE = "width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:.9rem;color:var(--text);background:#f8faff;outline:none;transition:all 0.3s ease;font-family:inherit;box-sizing:border-box";
var SUB_MODAL_FOCUS_ON = "this.style.borderColor='#818cf8';this.style.boxShadow='0 0 0 3px rgba(129,140,248,.15)'";
var SUB_MODAL_FOCUS_OFF = "this.style.borderColor='var(--inp-bd)';this.style.boxShadow='none'";
var SUB_MODAL_FOCUS_ATTRS = 'onfocus="' + SUB_MODAL_FOCUS_ON + '" onblur="' + SUB_MODAL_FOCUS_OFF + '"';
var SUB_MODAL_SECTION_GAP_STYLE = "margin-bottom:24px";
var SUB_MODAL_CYCLE_DATA = [
  ["month", "月付", "30天"],
  ["quarter", "季付", "90天"],
  ["year", "年付", "365天"],
  ["custom", "自定义", "自设天数"]
];
var SUB_MODAL_CYCLE_ICONS = {
  month: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  quarter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="8" y1="14" x2="16" y2="14"></line></svg>',
  year: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="9 16 11 18 15 14"></polyline></svg>',
  custom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>'
};

function _subTimeInputAuto(inp) {
  var value = inp.value.replace(/[^0-9]/g, "");
  if (value.length >= 2 && !inp.value.includes(":")) {
    inp.value = value.substring(0, 2) + ":" + value.substring(2, 4);
  }
}

function _subUpdateTimeChip() {
  var clearButton = document.getElementById("subTimeClear");
  if (clearButton) {
    clearButton.style.display = window._subTimeVal ? "inline" : "none";
  }
}

function openSubModal(id) {
  var subscription = id ? subscriptions.find(function(item) {
    return item.id === id;
  }) : null;
  var draft = !subscription && _subDraft ? _subDraft : null;

  if (subscription) {
    _subClearDraft();
  }

  var state = buildSubModalState(subscription, draft);
  renderSubModal(buildSubModalHtml(subscription, state));

  setTimeout(function() {
    var nameInput = document.getElementById("subNameIn");
    if (nameInput) {
      nameInput.focus();
    }
  }, 80);
}

function buildSubModalState(subscription, draft) {
  _subCycle = subscription
    ? subscription.cycle
    : draft
      ? draft.cycle
      : "month";

  window._subRenewalVal = subscription
    ? subscription.renewal || "manual"
    : draft
      ? draft.renewal || "manual"
      : "manual";

  var todayString = formatSubDateForInput(new Date());
  var dateString = (
    subscription
      ? subscription.expireDate
      : draft && draft.expireDate
        ? draft.expireDate
        : todayString
  ).substring(0, 10);

  window._subDateVal = dateString;
  window._subTimeVal = "";

  var hintState = getSubDaysHintState(dateString);
  var customDaysValue = subscription && subscription.customDays
    ? subscription.customDays
    : draft && draft.customDays
      ? draft.customDays
      : hintState.initialCustomDays;

  return {
    subscription: subscription,
    dateString: dateString,
    renewal: window._subRenewalVal || "manual",
    showCustom: _subCycle === "custom",
    customDaysValue: customDaysValue,
    hintText: hintState.text,
    hintColor: hintState.color,
    hintBackground: hintState.background,
    nameValue: esc(subscription ? subscription.name : draft ? draft.name : ""),
    costValue: subscription ? subscription.cost : draft ? draft.cost : "",
    noteValue: esc(subscription ? subscription.note || "" : draft ? draft.note || "" : "")
  };
}

function renderSubModal(html) {
  var modalBody = document.getElementById("mBody");
  var modalBg = document.getElementById("mBg");

  modalBody.innerHTML = html;
  modalBody.style.maxWidth = "520px";
  modalBody.style.width = "100%";
  modalBody.style.borderRadius = "20px";
  modalBody.style.padding = window.innerWidth <= 640 ? "18px 14px" : "28px 30px";
  modalBody.style.textAlign = "left";
  modalBody.style.boxSizing = "border-box";
  modalBg.classList.add("show");
}

function buildSubModalHtml(subscription, state) {
  return [
    buildSubModalStyles(),
    '<div id="subForm">',
    buildSubModalHeader(subscription),
    '<div id="subFormErr" style="display:none"></div>',
    buildSubNameField(state),
    buildSubCycleField(state),
    buildSubDateField(state),
    buildSubCostField(state),
    buildSubRenewalField(state),
    buildSubNoteField(state),
    buildSubActionRow(subscription),
    "</div>"
  ].join("");
}

function buildSubModalHeader(subscription) {
  var title = subscription ? "编辑订阅" : "添加订阅";
  var desc = subscription ? "修改订阅信息" : "记录一个新的订阅服务";

  return [
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1.5px solid var(--task-bd);transition:background 100ms ease" onmouseenter="this.style.background=\'rgba(129,140,248,.04)\'" onmouseleave="this.style.background=\'transparent\'">',
    '<div id="subHdrIcon" style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#818cf8,#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 18px rgba(99,102,241,.38);transition:transform 100ms ease">',
    getSubHeaderIcon(subscription),
    "</div>",
    "<div>",
    `<div style="font-size:1rem;font-weight:600;color:var(--text);letter-spacing:-.3px">${title}</div>`,
    `<div style="font-size:.74rem;color:#999;margin-top:2px">${desc}</div>`,
    "</div>",
    "</div>"
  ].join("");
}

function buildSubNameField(state) {
  return [
    `<div style="${SUB_MODAL_SECTION_GAP_STYLE}">`,
    buildSubLabel("服务名称", true),
    `<input id="subNameIn" type="text" value="${state.nameValue}" placeholder="请输入订阅服务名称" style="${SUB_MODAL_INPUT_STYLE}" ${SUB_MODAL_FOCUS_ATTRS} autocomplete="off" oninput="var e=document.getElementById('subNameErr');if(e&&this.value.trim())e.style.display='none';">`,
    '<div id="subNameErr" style="display:none;color:#ef4444;font-size:.78rem;font-weight:600;margin-top:5px">⚠️ 请填写服务名称</div>',
    "</div>"
  ].join("");
}

function buildSubCycleField(state) {
  var previewText = buildSubCustomDatePreview(state.showCustom, state.customDaysValue);

  return [
    `<div style="${SUB_MODAL_SECTION_GAP_STYLE}">`,
    buildSubLabel("订阅周期", true),
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
    buildSubCycleButtons(),
    "</div>",
    `<div id="subCustomDaysWrap" style="display:${state.showCustom ? "flex" : "none"};align-items:center;gap:8px;margin-top:10px;padding:10px 14px;border:1.5px dashed #818cf8;border-radius:10px;background:#f5f3ff">`,
    `<input id="subCustomDaysIn" type="number" value="${state.customDaysValue}" placeholder="30" min="1" step="1" style="width:72px;border:1.5px solid #818cf8;border-radius:10px;padding:8px 10px;font-size:.9rem;color:#6366f1;font-weight:700;text-align:center;background:#ede9fe;outline:none;font-family:inherit;box-sizing:border-box" ${SUB_MODAL_FOCUS_ATTRS} oninput="_subUpdateDateFromDays()">`,
    '<span style="font-size:.85rem;color:var(--text2)">天</span>',
    `<span id="subCustomDatePreview" style="font-size:.75rem;color:#6366f1;font-weight:600;margin-left:6px;white-space:nowrap">${previewText}</span>`,
    "</div>",
    "</div>"
  ].join("");
}

function buildSubDateField(state) {
  var dateInputValue = state.dateString ? state.dateString.replace(/-/g, "/") : "";
  var dateInputColor = state.dateString ? "var(--text)" : "#b4c0d8";

  return [
    `<div style="${SUB_MODAL_SECTION_GAP_STYLE}">`,
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">',
    '<label style="display:flex;align-items:center;gap:7px;font-size:.72rem;font-weight:700;color:#334155;letter-spacing:.5px;text-transform:uppercase"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#6366f1);flex-shrink:0"></span>到期日期<span style="color:#ef4444;margin-left:1px">*</span></label>',
    '<button type="button" id="subCalcBtn" onclick="_subCalcDate()" style="font-size:.74rem;color:#818cf8;background:none;border:none;cursor:pointer;font-family:inherit;padding:0;font-weight:600;text-decoration:underline;text-underline-offset:2px">推算到期</button>',
    "</div>",
    `<input id="subDateIn" type="hidden" value="${state.dateString}T00:00">`,
    `<input id="subDatePicker" type="date" value="${state.dateString}" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" onchange="_subSetDate(this.value)">`,
    '<input id="subTimePicker" type="time" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" onchange="_subSetTime(this.value)">',
    buildSubDateTimeStyles(),
    '<div id="subDateTimeBox" onmouseenter="_subBoxMouseEnter()" onmouseleave="_subBoxMouseLeave()">',
    '<div id="subDateSide" onclick="document.getElementById(\'subDateInput\').focus()">',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    `<input id="subDateInput" type="text" value="${dateInputValue}" placeholder="YYYY/MM/DD" maxlength="10" style="border:none;outline:none;font-size:.88rem;font-weight:600;color:${dateInputColor};font-family:inherit;flex:1;min-width:0;background:transparent;cursor:text;margin-right:4px" oninput="_subDateInputChange(this.value)" onfocus="_subDateFocus(this)" onblur="_subDateBlur(this)">`,
    '<button type="button" id="subChevronBtn" onclick="_subOpenDatePicker()" title="打开日历"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>',
    "</div>",
    '<div id="subTimeSide" onclick="document.getElementById(\'subTimeInput\').focus()">',
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    '<input id="subTimeInput" type="text" placeholder="HH:MM" maxlength="5" style="border:none;outline:none;font-size:.88rem;color:#b4c0d8;font-family:inherit;flex:1;min-width:0;background:transparent;cursor:text" oninput="_subTimeInputAuto(this);_subTimeInputChange(this.value)" onfocus="_subTimeFocus(this)" onblur="_subTimeBlur(this)">',
    '<span id="subTimeClear" onclick="event.stopPropagation();_subClearTime()" style="opacity:0;pointer-events:none;cursor:pointer;color:#94a3b8;font-size:.72rem;line-height:1;flex-shrink:0;transition:opacity .15s">✕</span>',
    "</div>",
    "</div>",
    `<div id="subDaysInline" style="display:none;margin-top:6px;font-size:.78rem;font-weight:500;padding:3px 10px;border-radius:20px;transition:background .3s,color .3s;background:${state.hintBackground};color:${state.hintColor}">${state.hintText}</div>`,
    "</div>"
  ].join("");
}

function buildSubCostField(state) {
  return [
    `<div style="margin-top:16px;${SUB_MODAL_SECTION_GAP_STYLE}">`,
    buildSubLabel("费用", true),
    '<div style="display:flex;align-items:stretch;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#f8faff;transition:all 0.3s ease">',
    '<span style="display:flex;align-items:center;padding:0 12px;font-size:.88rem;font-weight:600;color:#6366f1;background:#f8faff;border-right:1.5px solid #E0E0E0;flex-shrink:0;white-space:nowrap">¥</span>',
    `<input id="subCostIn" type="number" value="${state.costValue}" placeholder="0.00" step="0.01" min="0" style="flex:1;border:none;outline:none;padding:10px 14px;font-size:.9rem;color:var(--text);background:#f8faff;font-family:inherit;min-width:0" ${SUB_MODAL_FOCUS_ATTRS}>`,
    "</div>",
    "</div>"
  ].join("");
}

function buildSubRenewalField(state) {
  var manualOn = state.renewal === "manual";
  var autoOn = state.renewal === "auto";

  return [
    `<div style="${SUB_MODAL_SECTION_GAP_STYLE}">`,
    buildSubLabel("续期方式", false),
    buildSubRenewalStyles(),
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">',
    buildSubRenewalButton("manual", "手动续期", manualOn),
    buildSubRenewalButton("auto", "自动续期", autoOn),
    "</div>",
    "</div>"
  ].join("");
}

function buildSubNoteField(state) {
  return [
    `<div style="${SUB_MODAL_SECTION_GAP_STYLE}">`,
    buildSubLabel("备注", false),
    `<textarea id="subNoteIn" placeholder="添加备注，如账号、提醒等…" style="${SUB_MODAL_INPUT_STYLE};height:80px;resize:none;overflow-y:auto" ${SUB_MODAL_FOCUS_ATTRS}>${state.noteValue}</textarea>`,
    "</div>"
  ].join("");
}

function buildSubActionRow(subscription) {
  return [
    '<div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;padding-top:8px">',
    '<button type="button" id="subCancelBtn" onclick="_subCancel()" style="padding:11px;border-radius:10px;border:1.5px solid #e2e8f0;background:transparent;color:var(--text2);font-size:.92rem;font-weight:500;cursor:pointer;transition:all 0.3s ease;font-family:inherit">取消</button>',
    `<button type="button" id="subSaveBtn" onclick="_subSaveClick(event,${subscription ? subscription.id : 0})" style="padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#818cf8,#6366f1);color:#fff;font-size:.92rem;font-weight:700;cursor:pointer;transition:all 0.3s ease;font-family:inherit;box-shadow:0 4px 14px rgba(99,102,241,.35);letter-spacing:.3px;position:relative;overflow:hidden"><span class="btn-text">${subscription ? "保存修改" : "保存"}</span><span class="btn-spinner"></span></button>`,
    "</div>"
  ].join("");
}

function buildSubLabel(text, required) {
  return `<label style="display:flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:#334155;margin-bottom:7px;letter-spacing:.5px;text-transform:uppercase"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#6366f1);flex-shrink:0"></span>${text}${required ? '<span style="color:#ef4444;margin-left:1px">*</span>' : ""}</label>`;
}

function buildSubCycleButtons() {
  return SUB_MODAL_CYCLE_DATA.map(function(row) {
    var value = row[0];
    var label = row[1];
    var desc = row[2];
    var active = _subCycle === value;
    var icon = SUB_MODAL_CYCLE_ICONS[value];
    var activeIcon = icon.replace(/stroke="#6366f1"/g, 'stroke="#fff"');
    var style = "width:100%;padding:12px 8px;border-radius:12px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;transition:border-color 120ms ease,background 120ms ease,box-shadow 120ms ease;";

    if (active) {
      style += "border:1.5px solid #6366f1;background:#6366f1;color:#fff;box-shadow:inset 0 2px 8px rgba(0,0,0,.15);";
    } else {
      style += "border:1.5px solid #e2e8f0;background:#f8faff;color:var(--text2);";
    }

    return [
      `<button type="button" class="sub-cycle-btn" data-v="${value}" onclick="_subSetCycle(this.dataset.v)" style="${style}">`,
      active ? activeIcon : icon,
      `<span style="font-size:.82rem;font-weight:700;margin-top:1px">${label}</span>`,
      desc ? `<span style="font-size:.68rem;opacity:.75">${desc}</span>` : "",
      "</button>"
    ].join("");
  }).join("");
}

function buildSubCustomDatePreview(showCustom, daysValue) {
  if (!showCustom || !daysValue) {
    return "";
  }

  var date = new Date();
  date.setDate(date.getDate() + parseInt(daysValue, 10));
  return "到期 " + formatSubDateForDisplay(date);
}

function buildSubModalStyles() {
  return [
    "<style>",
    "@keyframes subBadgePulse{0%,100%{opacity:1}50%{opacity:.5}}",
    "@keyframes subNameShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}",
    "@keyframes subRipple{to{transform:scale(4);opacity:0}}",
    "#subCalcBtn:hover{background:linear-gradient(135deg,#818cf8,#6366f1)!important;color:#fff!important;border-color:transparent!important}",
    ".sub-cycle-btn:hover{border-color:#818cf8!important;box-shadow:0 2px 8px rgba(99,102,241,.18)!important}",
    "#subRenMan:hover,#subRenAut:hover{border-color:#818cf8!important;color:#6366f1!important}",
    "#subCancelBtn:hover{border-color:#ef4444!important;color:#ef4444!important}",
    "#subSaveBtn:hover{transform:translateY(-2px)!important;box-shadow:0 8px 24px rgba(99,102,241,.45)!important}",
    "input::placeholder,textarea::placeholder{color:#b4c0d8}",
    "#subNoteIn::-webkit-scrollbar{display:none}#subNoteIn{scrollbar-width:none}",
    "#subCostIn::-webkit-inner-spin-button,#subCostIn::-webkit-outer-spin-button{display:none}#subCostIn{-moz-appearance:textfield}",
    "#subCustomDaysIn::-webkit-inner-spin-button,#subCustomDaysIn::-webkit-outer-spin-button{display:none}#subCustomDaysIn{-moz-appearance:textfield}",
    "@keyframes subSpin{to{transform:rotate(360deg)}}",
    "input:focus,textarea:focus{border-color:#6c63ff!important;box-shadow:0 0 0 3px rgba(108,99,255,.1)!important}",
    ".sub-divider{height:1px;background:linear-gradient(to right,transparent,#e8eaf6,transparent);margin:4px 0 16px}",
    "#subSaveBtn .btn-spinner{display:none}#subSaveBtn.loading .btn-text{display:none}#subSaveBtn.loading .btn-spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:subSpin .7s linear infinite;vertical-align:middle}",
    "</style>"
  ].join("");
}

function buildSubDateTimeStyles() {
  return [
    "<style>",
    "#subDateTimeBox{display:flex;align-items:stretch;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;height:44px;transition:border-color .2s,box-shadow .2s;background:var(--inp-bg);position:relative}",
    "#subDateTimeBox:hover{border-color:#818cf8;box-shadow:0 0 0 3px rgba(129,140,248,.12)}",
    "#subDateSide{display:flex;align-items:center;gap:6px;padding:0 8px 0 12px;cursor:text;transition:background .15s;flex:2;min-width:0;border-right:1px solid #e2e8f0}",
    "#subTimeSide{display:flex;align-items:center;gap:6px;padding:0 10px;cursor:text;transition:background .15s;flex:1;min-width:120px}",
    "#subDateSide:hover,#subTimeSide:hover{background:rgba(129,140,248,.07)}",
    "#subChevronBtn{background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;flex-shrink:0;color:#8c93a8;transition:color .15s}",
    "#subChevronBtn:hover{color:#3b5bdb}",
    "#subTimeClear{opacity:0;pointer-events:none;cursor:pointer;color:#94a3b8;font-size:.72rem;line-height:1;flex-shrink:0;transition:opacity .15s}",
    "#subDateTimeBox:hover #subTimeClear.has-val{opacity:1;pointer-events:auto}",
    "</style>"
  ].join("");
}

function buildSubRenewalStyles() {
  return [
    "<style>",
    "#subRenMan,#subRenAut{position:relative;display:flex;align-items:center;gap:10px;padding:0 14px;height:52px;border-radius:10px;cursor:pointer;font-size:.88rem;font-family:inherit;font-weight:500;transition:background 150ms ease-in-out,border-color 150ms ease-in-out,color 150ms ease-in-out;overflow:hidden;text-align:left;}",
    "#subRenMan .ren-icon,#subRenAut .ren-icon{font-size:1rem;transition:transform 150ms ease-in-out;flex-shrink:0}",
    "#subRenMan:hover .ren-icon,#subRenAut:hover .ren-icon{transform:scale(1.15)}",
    "#subRenMan.ren-on,#subRenAut.ren-on{border-left:4px solid #6366f1!important;background:#eef2ff!important;color:#4338ca!important;font-weight:600;border-color:#c7d2fe!important}",
    "#subRenMan:not(.ren-on):hover,#subRenAut:not(.ren-on):hover{border-color:#818cf8!important;color:#6366f1!important}",
    ".ren-check{width:16px;height:16px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;margin-left:auto;flex-shrink:0;font-size:.6rem;color:#fff;opacity:0;transform:scale(0);transition:opacity 150ms ease-in-out,transform 150ms ease-in-out}",
    ".ren-on .ren-check{opacity:1;transform:scale(1)}",
    "</style>"
  ].join("");
}

function buildSubRenewalButton(type, label, active) {
  var icon = type === "manual"
    ? '<svg class="ren-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
    : '<svg class="ren-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>';

  return [
    `<button type="button" id="${type === "manual" ? "subRenMan" : "subRenAut"}" class="${active ? "ren-on" : ""}" onclick="_subSetRenewal('${type}')" style="border:1.5px solid ${active ? "#c7d2fe" : "#e2e8f0"};background:${active ? "#eef2ff" : "#f8faff"};color:${active ? "#4338ca" : "var(--text2)"}">`,
    icon,
    `<span>${label}</span>`,
    '<span class="ren-check">✓</span>',
    "</button>"
  ].join("");
}

function getSubHeaderIcon(subscription) {
  if (subscription) {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
  }

  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><line x1="12" y1="2" x2="12" y2="3"></line><line x1="19" y1="5" x2="18" y2="6"></line><line x1="5" y1="5" x2="6" y2="6"></line></svg>';
}

function getSubDaysHintState(dateString) {
  var state = {
    text: "",
    color: "#94a3b8",
    background: "transparent",
    initialCustomDays: 30
  };

  if (!dateString) {
    return state;
  }

  var expireDate = new Date(dateString);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  expireDate.setHours(0, 0, 0, 0);

  var days = Math.ceil((expireDate - today) / 864e5);
  state.initialCustomDays = days > 0 ? days : 30;

  if (days > 30) {
    state.text = "还剩 " + days + " 天";
    state.color = "#16a34a";
    state.background = "#f0fdf4";
  } else if (days >= 7) {
    state.text = "还剩 " + days + " 天";
    state.color = "#ca8a04";
    state.background = "#fefce8";
  } else if (days >= 1) {
    state.text = "还剩 " + days + " 天";
    state.color = "#ea580c";
    state.background = "#fff7ed";
  } else if (days === 0) {
    state.text = "今天到期";
    state.color = "#dc2626";
    state.background = "#fef2f2";
  } else {
    state.text = "已到期";
    state.color = "#dc2626";
    state.background = "#fef2f2";
  }

  return state;
}

function formatSubDateForInput(date) {
  return [
    date.getFullYear(),
    padSubNumber(date.getMonth() + 1),
    padSubNumber(date.getDate())
  ].join("-");
}

function formatSubDateForDisplay(date) {
  return [
    date.getFullYear(),
    padSubNumber(date.getMonth() + 1),
    padSubNumber(date.getDate())
  ].join("/");
}

function padSubNumber(value) {
  return String(value).padStart(2, "0");
}

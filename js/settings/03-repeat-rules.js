// 重复规则：负责高级规则弹窗、规则与任务同步、未来实例生成与规则列表渲染。

var _crTaskId = null;
var _crTaskTitle = "";
var _crRuleConfig = {
  baseType: "weekly",
  weeklyDays: [],
  monthlyDays: [],
  monthlyLastDay: false,
  additions: [],
  exceptions: []
};
var CR_UI_WEEK = ["一", "二", "三", "四", "五", "六", "日"];

function syncToRule(task) {
  if (!task || !task.recurRuleId) {
    return;
  }

  const rule = findRecurRule(task.recurRuleId);

  if (!rule) {
    return;
  }

  syncTaskFieldsToRule(rule, task);
  syncFutureRecurringTasks(task.recurRuleId, task);
}

function findRecurRule(ruleId) {
  return recurRules.find(function(rule) {
    return rule.id === ruleId;
  });
}

function syncTaskFieldsToRule(rule, task) {
  rule.text = task.text;
  rule.priority = task.priority;
  rule.planTime = task.planTime || "";
  rule.duration = task.duration || 0;
  rule.tags = [].concat(task.tags || []);
  rule.color = task.color || "";
  rule.note = task.note || "";
  rule.subtasks = (task.subtasks || []).map(function(subtask) {
    return {
      text: subtask.text
    };
  });
}

function syncFutureRecurringTasks(ruleId, task) {
  for (const ds in T) {
    if (ds <= sel) {
      continue;
    }

    (T[ds] || []).forEach(function(futureTask) {
      if (futureTask.recurRuleId === ruleId && !futureTask.done && !futureTask.archived) {
        futureTask.text = task.text;
        futureTask.priority = task.priority;
        futureTask.planTime = task.planTime || "";
        futureTask.duration = task.duration || 0;
        futureTask.tags = [].concat(task.tags || []);
        futureTask.color = task.color || "";
        futureTask.note = task.note || "";
        futureTask.subtasks = createFutureRuleSubtasks(task.subtasks || []);
      }
    });
  }
}

function createFutureRuleSubtasks(subtasks) {
  const baseId = Date.now() + Math.floor(Math.random() * 1e6);

  return subtasks.map(function(subtask, index) {
    return {
      id: baseId + index + Math.floor(Math.random() * 1e4),
      text: subtask.text,
      done: false
    };
  });
}

function crSortWeeklyChars(days) {
  const order = {};

  CR_UI_WEEK.forEach(function(char, index) {
    order[char] = index;
  });

  return days.slice().sort(function(a, b) {
    return (order[a] != null ? order[a] : 99) - (order[b] != null ? order[b] : 99);
  });
}

function crCharToDow(char) {
  const map = {
    "日": 0,
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6
  };

  return map[char] != null ? map[char] : -1;
}

function crToggleArr(arr, item) {
  const index = arr.indexOf(item);

  if (index >= 0) {
    const next = arr.slice();
    next.splice(index, 1);
    return next;
  }

  return arr.concat([item]);
}

function crCloneCfg(config) {
  return {
    baseType: config.baseType,
    weeklyDays: config.weeklyDays.slice(),
    monthlyDays: config.monthlyDays.slice(),
    monthlyLastDay: !!config.monthlyLastDay,
    additions: config.additions.slice(),
    exceptions: config.exceptions.slice()
  };
}

function crRuleToConfig(rule) {
  if (!rule) {
    return null;
  }

  if (rule.type === "daily") {
    return {
      baseType: "weekly",
      weeklyDays: CR_UI_WEEK.slice(),
      monthlyDays: [],
      monthlyLastDay: false,
      additions: rule.advAdditions ? rule.advAdditions.slice() : [],
      exceptions: rule.exceptions ? rule.exceptions.slice() : []
    };
  }

  const config = {
    baseType: rule.type === "monthly" ? "monthly" : "weekly",
    weeklyDays: [],
    monthlyDays: rule.monthDays ? rule.monthDays.slice() : [],
    monthlyLastDay: !!rule.monthlyLastDay,
    additions: rule.advAdditions ? rule.advAdditions.slice() : [],
    exceptions: rule.exceptions ? rule.exceptions.slice() : []
  };

  if (rule.advWeeklyDays && rule.advWeeklyDays.length) {
    config.weeklyDays = rule.advWeeklyDays.slice();
  } else if (rule.type === "weekly" && rule.weekdays && rule.weekdays.length) {
    config.weeklyDays = rule.weekdays.map(function(weekday) {
      return WD[weekday];
    }).filter(Boolean);
  }

  return config;
}

function formatWeeklyRuleSummary(weeklyDays, emptyText) {
  const labels = crSortWeeklyChars([].concat(weeklyDays || []).filter(Boolean));

  if (!labels.length) {
    return emptyText || "";
  }

  return "\u6bcf\u5468" + labels.join("\u3001");
}

function buildMonthlyRuleLabels(monthDays, monthlyLastDay) {
  const labels = ([].concat(monthDays || []))
    .filter(function(day, index, arr) {
      return day != null && day !== "" && arr.indexOf(day) === index;
    })
    .map(function(day) {
      return String(day) + "\u53f7";
    });

  if (monthlyLastDay) {
    labels.push("\u6708\u5e95");
  }

  return labels;
}

function formatMonthlyRuleSummary(monthDays, monthlyLastDay, emptyText) {
  const labels = buildMonthlyRuleLabels(monthDays, monthlyLastDay);

  if (!labels.length) {
    return emptyText || "";
  }

  return "\u6bcf\u6708" + labels.join("\u3001");
}

function appendRecurringSummaryExtras(parts, additions, exceptions) {
  const safeAdditions = additions || [];
  const safeExceptions = exceptions || [];

  if (safeAdditions.indexOf("holidays") >= 0) {
    parts.push("+\u6cd5\u5b9a\u8282\u5047\u65e5");
  }
  if (safeAdditions.indexOf("workdays") >= 0) {
    parts.push("+\u6cd5\u5b9a\u8c03\u4f11\u8865\u73ed");
  }
  if (safeExceptions.indexOf("skip_holidays") >= 0) {
    parts.push("-\u8df3\u8fc7\u8282\u5047\u65e5");
  }
  if (safeExceptions.indexOf("skip_weekends") >= 0) {
    parts.push("-\u8df3\u8fc7\u5468\u672b");
  }
}

function buildRecurringSummaryText(options) {
  const parts = [];
  const baseType = options && options.baseType;

  if (baseType === "weekly") {
    const weeklySummary = formatWeeklyRuleSummary(options.weeklyDays, options.emptyText);

    if (weeklySummary) {
      parts.push(weeklySummary);
    }
  } else if (baseType === "monthly") {
    const monthlySummary = formatMonthlyRuleSummary(
      options.monthDays,
      options.monthlyLastDay,
      options.emptyText
    );

    if (monthlySummary) {
      parts.push(monthlySummary);
    }
  } else if (baseType === "daily") {
    parts.push("\u6bcf\u5929");
  }

  appendRecurringSummaryExtras(parts, options && options.additions, options && options.exceptions);
  return parts.filter(Boolean).join(" ");
}

function getRuleWeeklyDays(rule) {
  if (!rule) {
    return [];
  }

  if (Array.isArray(rule.advWeeklyDays) && rule.advWeeklyDays.length) {
    return rule.advWeeklyDays.slice();
  }

  return (rule.weekdays || []).map(function(day) {
    return WD[day];
  }).filter(Boolean);
}

function getRuleMonthDays(rule) {
  if (!rule) {
    return [];
  }

  if (Array.isArray(rule.monthDays) && rule.monthDays.length) {
    return rule.monthDays.slice();
  }

  return rule.monthDay != null ? [rule.monthDay] : [];
}

function buildRecurringSummaryTextFromRule(rule, emptyText) {
  if (!rule) {
    return "";
  }

  if (rule.type === "daily") {
    return "\u6bcf\u5929";
  }

  return buildRecurringSummaryText({
    baseType: rule.type === "weekly" ? "weekly" : "monthly",
    weeklyDays: getRuleWeeklyDays(rule),
    monthDays: getRuleMonthDays(rule),
    monthlyLastDay: !!rule.monthlyLastDay,
    additions: rule.advAdditions || [],
    exceptions: rule.exceptions || [],
    emptyText: emptyText
  });
}

function crBuildSummaryText(config) {
  const parts = [];

  if (config.baseType === "weekly") {
    if (config.weeklyDays.length) {
      parts.push("每周" + crSortWeeklyChars(config.weeklyDays).join(""));
    }
  } else {
    const monthDays = config.monthlyDays.slice();

    if (config.monthlyLastDay) {
      monthDays.push("月底");
    }
    if (monthDays.length) {
      parts.push("每月" + monthDays.join(",") + "号");
    }
  }

  if (config.additions.indexOf("holidays") >= 0) {
    parts.push("+法定节假日");
  }
  if (config.additions.indexOf("workdays") >= 0) {
    parts.push("+法定调休补班");
  }
  if (config.exceptions.indexOf("skip_holidays") >= 0) {
    parts.push("-跳过节假日");
  }
  if (config.exceptions.indexOf("skip_weekends") >= 0) {
    parts.push("-跳过周末");
  }

  return parts.filter(Boolean).join(" ");
}

function crBuildPreviewText(config) {
  let text = "";

  if (config.baseType === "weekly") {
    const weeklyDays = crSortWeeklyChars(config.weeklyDays);
    text = "每周" + (weeklyDays.length ? weeklyDays.join("、") : "未选");
  } else {
    text = "每月" + (config.monthlyDays.length ? config.monthlyDays.join("、") : "");
    if (config.monthlyLastDay) {
      text += (config.monthlyDays.length ? "、" : "") + "月底";
    }
    if (!config.monthlyDays.length && !config.monthlyLastDay) {
      text += "未选";
    }
  }

  if (config.additions.indexOf("holidays") >= 0) {
    text += "，以及所有法定节假日";
  }
  if (config.additions.indexOf("workdays") >= 0) {
    text += "，以及调休补班日";
  }
  if (config.exceptions.indexOf("skip_holidays") >= 0) {
    text += " (但遇到节假日不提醒)";
  }
  if (config.exceptions.indexOf("skip_weekends") >= 0) {
    text += " (但遇到周末不提醒)";
  }

  return text;
}

function crRenderModal() {
  const mount = document.getElementById("crModalMount");

  if (!mount) {
    return;
  }

  const config = _crRuleConfig;
  const isWeekly = config.baseType === "weekly";
  const preview = crBuildPreviewText(config);

  mount.innerHTML = buildCustomRepeatModalHtml(config, isWeekly, preview);
}

function buildCustomRepeatModalHtml(config, isWeekly, preview) {
  return [
    buildCustomRepeatModalHeader(),
    '<div class="cr-modal-body">',
    buildCustomRepeatSegment(isWeekly),
    buildCustomRepeatFrequencyBlock(config, isWeekly),
    '<hr class="cr-hr">',
    buildCustomRepeatOptionGrid(config),
    buildCustomRepeatPreview(preview),
    buildCustomRepeatFooter(),
    "</div>"
  ].join("");
}

function buildCustomRepeatModalHeader() {
  return [
    '<div class="cr-modal-hd">',
    '  <div class="cr-modal-hd-ico" aria-hidden="true">',
    '    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>',
    '      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    "    </svg>",
    "  </div>",
    '  <div class="cr-modal-hd-text">',
    '    <div class="cr-modal-kicker" id="crModalTitle">',
    '      <svg class="cr-modal-kick-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '        <rect x="3" y="4" width="18" height="18" rx="2"/>',
    '        <line x1="16" y1="2" x2="16" y2="6"/>',
    '        <line x1="8" y1="2" x2="8" y2="6"/>',
    '        <line x1="3" y1="10" x2="21" y2="10"/>',
    "      </svg>",
    "      <span>高级重复规则</span>",
    "    </div>",
    '    <p class="cr-modal-task-tit">' + esc(_crTaskTitle || "") + "</p>",
    "  </div>",
    '  <button type="button" class="cr-modal-x" onclick="closeCustomRepeatModal()" aria-label="关闭">×</button>',
    "</div>"
  ].join("");
}

function buildCustomRepeatSegment(isWeekly) {
  return '<div class="cr-seg">' +
    '<button type="button" class="' + (isWeekly ? "on" : "") + '" onclick="crSetBaseType(\'weekly\')">按周重复</button>' +
    '<button type="button" class="' + (!isWeekly ? "on" : "") + '" onclick="crSetBaseType(\'monthly\')">按月重复</button>' +
    "</div>";
}

function buildCustomRepeatFrequencyBlock(config, isWeekly) {
  return '<div class="cr-freq-block ' + (isWeekly ? "cr-freq-block--weekly" : "cr-freq-block--monthly") + '">' +
    (isWeekly ? buildCustomRepeatWeeklyBlock(config) : buildCustomRepeatMonthlyBlock(config)) +
    "</div>";
}

function buildCustomRepeatWeeklyBlock(config) {
  return '<label class="cr-lbl">选择星期</label><div class="cr-wk-row">' + buildWeeklyButtonsHtml(config.weeklyDays) + "</div>";
}

function buildWeeklyButtonsHtml(selectedDays) {
  return CR_UI_WEEK.map(function(day) {
    const isSelected = selectedDays.indexOf(day) >= 0;
    return '<button type="button" class="cr-wk-btn' + (isSelected ? " on" : "") + '" onclick="crToggleWeekDay(\'' + day + "')\">" + day + "</button>";
  }).join("");
}

function buildCustomRepeatMonthlyBlock(config) {
  return '<label class="cr-lbl">选择日期（可多选）</label><div class="cr-mo-grid">' + buildMonthButtonsHtml(config) + "</div>";
}

function buildMonthButtonsHtml(config) {
  const buttons = [];

  for (let day = 1; day <= 31; day += 1) {
    const isSelected = config.monthlyDays.indexOf(day) >= 0;
    buttons.push('<button type="button" class="cr-mo-btn' + (isSelected ? " on" : "") + '" onclick="crToggleMonthDay(' + day + ')">' + day + "</button>");
  }

  buttons.push('<button type="button" class="cr-mo-btn cr-mo-last' + (config.monthlyLastDay ? " on" : "") + '" onclick="crToggleMonthlyLast()">月底最后一天</button>');

  return buttons.join("");
}

function buildCustomRepeatOptionGrid(config) {
  return '<div class="cr-grid2">' +
    buildCustomRepeatAdditionBlock(config) +
    buildCustomRepeatExceptionBlock(config) +
    "</div>";
}

function buildCustomRepeatAdditionBlock(config) {
  return "<div>" +
    '<div class="cr-subtit em">＋ 额外增加提醒（并集）</div>' +
    buildCustomRepeatOptionButton("holidays", "法定节假日", config.additions, "crToggleAddition", "em") +
    buildCustomRepeatOptionButton("workdays", "法定调休补班日", config.additions, "crToggleAddition", "em") +
    "</div>";
}

function buildCustomRepeatExceptionBlock(config) {
  return "<div>" +
    '<div class="cr-subtit ex">－ 遇到以下跳过（排除）</div>' +
    buildCustomRepeatOptionButton("skip_holidays", "跳过法定节假日", config.exceptions, "crToggleException", "ex") +
    buildCustomRepeatOptionButton("skip_weekends", "跳过周末", config.exceptions, "crToggleException", "ex") +
    "</div>";
}

function buildCustomRepeatOptionButton(key, label, selected, handlerName, tone) {
  const isSelected = selected.indexOf(key) >= 0;

  return '<button type="button" class="cr-opt-btn' + (isSelected ? " on " + tone : "") + '" onclick="' + handlerName + "('" + key + "')\">" +
    label +
    "<span>" + (isSelected ? "✓" : "") + "</span>" +
    "</button>";
}

function buildCustomRepeatPreview(preview) {
  return '<div class="cr-preview"><p class="cr-p-lbl">当前规则解析预览：</p><p class="cr-p-txt" id="crPreviewLine">' + esc(preview) + "</p></div>";
}

function buildCustomRepeatFooter() {
  return '<div class="cr-ft">' +
    '<button type="button" class="cr-cancel" onclick="closeCustomRepeatModal()">取消</button>' +
    '<button type="button" class="cr-save" onclick="saveCustomRepeatModal()">保存复杂规则</button>' +
    "</div>";
}

function crSetBaseType(type) {
  _crRuleConfig.baseType = type;
  crRenderModal();
}

function crToggleWeekDay(day) {
  _crRuleConfig.weeklyDays = crToggleArr(_crRuleConfig.weeklyDays, day);
  crRenderModal();
}

function crToggleMonthDay(day) {
  _crRuleConfig.monthlyDays = crToggleArr(_crRuleConfig.monthlyDays, day);
  crRenderModal();
}

function crToggleMonthlyLast() {
  _crRuleConfig.monthlyLastDay = !_crRuleConfig.monthlyLastDay;
  crRenderModal();
}

function crToggleAddition(key) {
  _crRuleConfig.additions = crToggleArr(_crRuleConfig.additions, key);
  crRenderModal();
}

function crToggleException(key) {
  _crRuleConfig.exceptions = crToggleArr(_crRuleConfig.exceptions, key);
  crRenderModal();
}

function openCustomRepeatModal(taskId) {
  const task = (T[sel] || []).find(function(item) {
    return +item.id === +taskId;
  });

  if (!task || task.archived) {
    return;
  }

  _crTaskId = task.id;
  _crTaskTitle = task.text || "";
  _crRuleConfig = crCloneCfg(resolveInitialCustomRuleConfig(task));

  const modalBg = document.getElementById("crModalBg");

  crRenderModal();

  if (modalBg) {
    modalBg.classList.add("show");
    document.body.style.overflow = "hidden";
  }
}

function resolveInitialCustomRuleConfig(task) {
  const rule = task.recurRuleId ? findRecurRule(task.recurRuleId) : null;
  const config = rule ? crRuleToConfig(rule) : null;

  if (config) {
    return config;
  }

  const selectedDate = parseDS(sel);

  return {
    baseType: "weekly",
    weeklyDays: [WD[selectedDate.getDay()]],
    monthlyDays: [selectedDate.getDate()],
    monthlyLastDay: false,
    additions: [],
    exceptions: []
  };
}

function closeCustomRepeatModal() {
  const modalBg = document.getElementById("crModalBg");

  if (modalBg) {
    modalBg.classList.remove("show");
  }

  document.body.style.overflow = "";
  _crTaskId = null;
  _crTaskTitle = "";
}

function saveCustomRepeatModal() {
  if (_crTaskId == null) {
    return;
  }

  const config = crCloneCfg(_crRuleConfig);

  if (config.baseType === "weekly" && !config.weeklyDays.length) {
    toast("请选择至少一个星期");
    return;
  }
  if (config.baseType === "monthly" && !config.monthlyDays.length && !config.monthlyLastDay) {
    toast("请选择日期或勾选月底");
    return;
  }

  const task = (T[sel] || []).find(function(item) {
    return item.id === _crTaskId;
  });

  if (!task) {
    return;
  }

  if (task.recurRuleId) {
    removeExistingRecurRule(task.recurRuleId);
  }

  const rule = buildCustomRepeatRule(task, config);

  recurRules.push(rule);
  task.recurRuleId = rule.id;

  closeCustomRepeatModal();
  save();
  rT();
  rRecurList();
  toast("已保存高级重复规则");
}

function removeExistingRecurRule(ruleId) {
  recurRules = recurRules.filter(function(rule) {
    return rule.id !== ruleId;
  });

  for (const ds in T) {
    if (ds <= sel) {
      continue;
    }

    T[ds] = (T[ds] || []).filter(function(task) {
      return !(task.recurRuleId === ruleId && !task.done && !task.archived);
    });

    if (!T[ds].length) {
      delete T[ds];
    }
  }
}

function buildCustomRepeatRule(task, config) {
  const ruleId = "rr_" + Date.now();
  const weekdays = config.baseType === "weekly"
    ? config.weeklyDays.map(crCharToDow).filter(function(day, index, arr) {
      return day >= 0 && arr.indexOf(day) === index;
    }).sort(function(a, b) {
      return a - b;
    })
    : [];
  const monthDays = config.baseType === "monthly"
    ? config.monthlyDays.slice().sort(function(a, b) {
      return a - b;
    })
    : [];

  return {
    id: ruleId,
    text: task.text,
    priority: task.priority,
    planTime: task.planTime || "",
    duration: task.duration || 0,
    type: config.baseType === "weekly" ? "weekly" : "monthly",
    weekdays: weekdays,
    monthDay: monthDays.length ? monthDays[0] : 1,
    monthDays: monthDays,
    monthlyLastDay: config.baseType === "monthly" ? config.monthlyLastDay : false,
    startDate: sel,
    active: true,
    tags: [].concat(task.tags || []),
    color: task.color || "",
    note: task.note || "",
    subtasks: (task.subtasks || []).map(function(subtask) {
      return {
        text: subtask.text
      };
    }),
    advSummary: crBuildSummaryText(config) || "未设置有效规则",
    advWeeklyDays: config.baseType === "weekly" ? config.weeklyDays.slice() : [],
    advAdditions: config.additions.slice(),
    exceptions: config.exceptions.slice()
  };
}

(function initCustomRepeatEscShortcut() {
  if (window._crEscInit) {
    return;
  }

  window._crEscInit = 1;
  document.addEventListener("keydown", function(event) {
    if (event.key !== "Escape") {
      return;
    }

    const modalBg = document.getElementById("crModalBg");

    if (modalBg && modalBg.classList.contains("show")) {
      event.preventDefault();
      closeCustomRepeatModal();
    }
  });
})();

function generateRecurring(ds) {
  if (!recurRules || !recurRules.length) {
    return;
  }

  const date = parseDS(ds);
  const weekday = date.getDay();
  const dayOfMonth = date.getDate();
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  recurRules.forEach(function(rule) {
    if (!rule.active || ds < rule.startDate) {
      return;
    }

    if (!doesRecurringRuleMatchDate(rule, weekday, dayOfMonth, lastDayOfMonth)) {
      return;
    }
    if (shouldSkipRecurringDate(rule, weekday)) {
      return;
    }

    ensureDayTaskBucket(ds);

    if (T[ds].some(function(task) {
      return task.recurRuleId === rule.id;
    })) {
      return;
    }

    T[ds].push(buildRecurringTaskFromRule(rule));
  });
}

function doesRecurringRuleMatchDate(rule, weekday, dayOfMonth, lastDayOfMonth) {
  if (rule.type === "daily") {
    return true;
  }

  if (rule.type === "weekly") {
    return (rule.weekdays || []).includes(weekday);
  }

  let matched = false;

  if (rule.monthDays && rule.monthDays.length) {
    matched = rule.monthDays.indexOf(dayOfMonth) >= 0;
  } else if (rule.monthDay != null) {
    matched = dayOfMonth === rule.monthDay;
  }

  if (rule.monthlyLastDay && dayOfMonth === lastDayOfMonth) {
    matched = true;
  }

  return matched;
}

function shouldSkipRecurringDate(rule, weekday) {
  const exceptions = rule.exceptions || [];

  return exceptions.indexOf("skip_weekends") >= 0 && (weekday === 0 || weekday === 6);
}

function ensureDayTaskBucket(ds) {
  if (!T[ds]) {
    T[ds] = [];
  }
}

function buildRecurringTaskFromRule(rule) {
  return mkTask(rule.text, rule.priority, rule.planTime, rule.duration, {
    recurRuleId: rule.id,
    tags: [].concat(rule.tags || []),
    color: rule.color || "",
    note: rule.note || "",
    subtasks: createFutureRuleSubtasks(rule.subtasks || [])
  });
}

function getRecurringSyncStartDate() {
  return fd(now);
}

function removePendingRecurringTasksFrom(ruleId, startDs) {
  let changed = false;

  for (const ds in T) {
    if (ds < startDs) {
      continue;
    }

    const dayTasks = T[ds] || [];
    const nextTasks = dayTasks.filter(function(task) {
      return !(task.recurRuleId === ruleId && !task.done && !task.archived);
    });

    if (nextTasks.length === dayTasks.length) {
      continue;
    }

    changed = true;

    if (nextTasks.length) {
      T[ds] = nextTasks;
    } else {
      delete T[ds];
    }
  }

  return changed;
}

function addCurrentCalendarMonthSyncDates(dateSet, startDs) {
  if (!Number.isFinite(cY) || !Number.isFinite(cM)) {
    return;
  }

  const monthLastDay = new Date(cY, cM + 1, 0).getDate();

  for (let day = 1; day <= monthLastDay; day += 1) {
    const ds = cY + "-" + String(cM + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");

    if (ds >= startDs) {
      dateSet.add(ds);
    }
  }
}

function collectRecurringSyncDates(startDs) {
  const dates = new Set([startDs]);

  if (typeof sel === "string" && sel && sel >= startDs) {
    dates.add(sel);
  }

  for (const ds in T) {
    if (ds >= startDs) {
      dates.add(ds);
    }
  }

  addCurrentCalendarMonthSyncDates(dates, startDs);

  return Array.from(dates).sort();
}

function ensureRecurringTaskForRuleOnDate(rule, ds) {
  if (!rule || !rule.active || !ds || ds < rule.startDate) {
    return false;
  }

  const date = parseDS(ds);

  if (!date || Number.isNaN(date.getTime())) {
    return false;
  }

  const weekday = date.getDay();
  const dayOfMonth = date.getDate();
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  if (!doesRecurringRuleMatchDate(rule, weekday, dayOfMonth, lastDayOfMonth)) {
    return false;
  }
  if (shouldSkipRecurringDate(rule, weekday)) {
    return false;
  }

  ensureDayTaskBucket(ds);

  if (T[ds].some(function(task) {
    return task.recurRuleId === rule.id;
  })) {
    return false;
  }

  T[ds].push(buildRecurringTaskFromRule(rule));
  return true;
}

function restoreRecurringTasksFrom(rule, startDs) {
  let changed = false;

  collectRecurringSyncDates(startDs).forEach(function(ds) {
    if (ensureRecurringTaskForRuleOnDate(rule, ds)) {
      changed = true;
    }
  });

  return changed;
}

function setRecurRuleActiveState(ruleId, isActive) {
  const rule = findRecurRule(ruleId);

  if (!rule) {
    return false;
  }

  const nextActive = !!isActive;

  if (!!rule.active === nextActive) {
    return false;
  }

  rule.active = nextActive;

  const startDs = getRecurringSyncStartDate();

  if (nextActive) {
    restoreRecurringTasksFrom(rule, startDs);
  } else {
    removePendingRecurringTasksFrom(rule.id, startDs);
  }

  return true;
}

function addRecurRule(taskId, ruleType) {
  const type = ruleType || "daily";
  const task = (T[sel] || []).find(function(item) {
    return item.id === taskId;
  });

  if (!task) {
    return;
  }

  if (task.recurRuleId) {
    deleteRecurRule(task.recurRuleId, true);
  }

  const selectedDate = parseDS(sel);
  const ruleId = "rr_" + Date.now();

  recurRules.push({
    id: ruleId,
    text: task.text,
    priority: task.priority,
    planTime: task.planTime || "",
    duration: task.duration || 0,
    type: type,
    weekdays: type === "weekly" ? [selectedDate.getDay()] : [],
    monthDay: selectedDate.getDate(),
    startDate: sel,
    active: true,
    tags: [].concat(task.tags || []),
    color: task.color || "",
    note: task.note || "",
    subtasks: (task.subtasks || []).map(function(subtask) {
      return {
        text: subtask.text
      };
    })
  });

  task.recurRuleId = ruleId;
  save();
  rT();
  rRecurList();
  toast(type === "weekly" ? "🔁 已设置每周重复" : "🔁 已设置每日重复");
}

function updateRecurRule(ruleId, field, value) {
  const rule = findRecurRule(ruleId);

  if (!rule) {
    return;
  }

  const isActiveField = field === "active";

  if (isActiveField) {
    if (!setRecurRuleActiveState(ruleId, value)) {
      return;
    }
  } else {
    rule[field] = value;
  }

  save();
  rT();
  rRecurList();

  if (isActiveField) {
    rCal();
  }
}

function toggleRecurWeekday(ruleId, day) {
  const rule = findRecurRule(ruleId);

  if (!rule) {
    return;
  }

  if (!rule.weekdays) {
    rule.weekdays = [];
  }

  const index = rule.weekdays.indexOf(day);

  if (index >= 0) {
    rule.weekdays.splice(index, 1);
  } else {
    rule.weekdays.push(day);
  }

  save();
  rRecurList();
}

function deleteRecurRule(ruleId, silent) {
  const today = fd(now);

  for (const ds in T) {
    if (ds <= today) {
      continue;
    }

    T[ds] = (T[ds] || []).filter(function(task) {
      return !(task.recurRuleId === ruleId && !task.done && !task.archived);
    });

    if (T[ds] && !T[ds].length) {
      delete T[ds];
    }
  }

  recurRules = recurRules.filter(function(rule) {
    return rule.id !== ruleId;
  });

  for (const ds in T) {
    T[ds].forEach(function(task) {
      if (task.recurRuleId === ruleId) {
        task.recurRuleId = "";
      }
    });
  }

  save();
  rT();
  rRecurList();
  rCal();

  if (!silent) {
    toast("🗑️ 规则已删除");
  }
}

function rRecurList() {
  const recurList = document.getElementById("recurList");

  if (!recurList) {
    return;
  }

  if (!recurRules.length) {
    recurList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">暂无重复规则</div>';
    return;
  }

  recurList.innerHTML = recurRules.map(renderRecurRuleItem).join("");
}

function renderRecurRuleItem(rule) {
  const ruleText = getRecurListTypeLabel(rule);
  const extras = [];

  if ((rule.subtasks || []).length) {
    extras.push("📋" + (rule.subtasks || []).length);
  }
  if (rule.note) {
    extras.push('<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>');
  }
  if (rule.color) {
    extras.push("🎨");
  }

  const extraHtml = extras.length
    ? '<span style="font-size:.7rem;color:var(--text3);margin-left:4px">' + extras.join(" ") + "</span>"
    : "";

  return '<div class="rr-item">' +
    '<span class="rr-text">' + esc(rule.text) + extraHtml + "</span>" +
    '<span class="rr-rule"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' + ruleText + "</span>" +
    prioBadge(rule.priority) +
    '<button class="rr-toggle ' + (rule.active ? "rr-on" : "") + '" onclick="updateRecurRule(\'' + rule.id + "','active'," + (!rule.active) + ')">' + (rule.active ? "✅" : "⏸") + "</button>" +
    '<button class="rr-del" onclick="deleteRecurRule(\'' + rule.id + '\')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
    "</div>";
}

function getRecurListTypeLabel(rule) {
  return buildRecurringSummaryTextFromRule(rule, "\u672a\u8bbe\u7f6e");
}

function getRecurDesc(ruleId) {
  const rule = findRecurRule(ruleId);

  if (!rule) {
    return "";
  }

  return buildRecurringSummaryTextFromRule(rule, "\u672a\u8bbe\u7f6e");
}

function formatPlanTimeDisp(planTime) {
  if (!planTime) {
    return "";
  }

  const match = String(planTime).trim().match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return String(planTime).trim();
  }

  return String(+match[1]).padStart(2, "0") + ":" + match[2];
}

function joinRecurringMetaParts(parts) {
  const normalized = ([]).concat(parts || []).map(function(part) {
    return String(part || "").trim();
  }).filter(Boolean);

  if (!normalized.length) {
    return "";
  }
  if (normalized.length === 1) {
    return normalized[0];
  }

  return normalized[0] + " (" + normalized.slice(1).join(" ") + ")";
}

function buildRecurringMetaModel(summary, timeText) {
  const summaryText = String(summary || "").trim();
  const timeValue = String(timeText || "").trim();

  return {
    summary: summaryText,
    time: timeValue,
    text: joinRecurringMetaParts([summaryText, timeValue])
  };
}

function joinRecurringSummaryAndTime(summary, timeText) {
  return buildRecurringMetaModel(summary, timeText).text;
}

function buildRecurringMetaTextHtml(summary, timeText) {
  const meta = buildRecurringMetaModel(summary, timeText);

  if (!meta.summary && !meta.time) {
    return "";
  }
  if (!meta.summary) {
    return '<span class="task-recur-badge-time">' + esc(meta.time) + "</span>";
  }
  if (!meta.time) {
    return '<span class="task-recur-badge-summary">' + esc(meta.summary) + "</span>";
  }

  return '<span class="task-recur-badge-summary">' + esc(meta.summary) + '</span><span class="task-recur-badge-time">(' + esc(meta.time) + ")</span>";
}

function buildRecurringSummaryPrefixHtml(summary, hasTrailingValue) {
  const base = String(summary || "").trim();

  if (!base) {
    return "";
  }

  return hasTrailingValue
    ? '<span class="time-edit-pill-prefix-main">' + esc(base) + '</span><span class="time-edit-pill-prefix-open" aria-hidden="true">(</span>'
    : '<span class="time-edit-pill-prefix-main">' + esc(base) + "</span>";
}

function buildRecurringSummarySuffixHtml(hasLeadingValue) {
  return hasLeadingValue
    ? '<span class="time-edit-pill-prefix-close" aria-hidden="true">)</span>'
    : "";
}

function taskRecurRowBadgeSvg() {
  return '<svg class="task-recur-badge-ico" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
}

function taskRowRecurTimeInnerHtml(task, planTime) {
  const desc = getRecurDesc(task.recurRuleId) || "\u91cd\u590d";
  const timeText = planTime
    ? (typeof taskRowPlainTimeText === "function"
      ? taskRowPlainTimeText(task, formatPlanTimeDisp(planTime))
      : formatPlanTimeDisp(planTime))
    : "";
  const meta = buildRecurringMetaModel(desc, timeText);
  const label = meta.text;
  const textHtml = buildRecurringMetaTextHtml(desc, timeText);

  return '<span class="task-recur-badge time-disp" onclick="event.stopPropagation();if(window.openTaskDetail)window.openTaskDetail(' + task.id + ')" title="' + esc(label) + '">' + taskRecurRowBadgeSvg() + '<span class="task-recur-badge-txt">' + textHtml + "</span></span>";
}

function checkUnfreeze() {
  const today = fd(now);

  for (const ds in T) {
    T[ds].forEach(function(task) {
      if (task.frozen && task.frozenUntil && task.frozenUntil <= today) {
        task.frozen = false;
        task.frozenUntil = "";
      }
    });
  }
}

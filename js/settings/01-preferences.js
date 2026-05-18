// 偏好设置：负责截止时间显示、默认排序和自动排序的开关与初始化。

let prioTplPickerOpen = null;

function rPrioColorSettings() {
  return null;
}

function toggleDeadline() {
  showDeadline = !showDeadline;
  togglePreferenceButton("deadlineToggle", showDeadline);
  rT();
  save();
  toast(showDeadline ? "⏰ 截止时间已开启" : "⏰ 截止时间已关闭");
}

function setDefaultSort(mode) {
  mode = normalizeSortMode(mode);
  defaultSortMode = mode;
  lastSort = mode;
  save();
  syncDefaultSortSelect();
  toast("🔀 默认排序: " + getSortModeLabel(mode));
}

function toggleAutoSort() {
  autoSortEnabled = !autoSortEnabled;
  togglePreferenceButton("autoSortToggle", autoSortEnabled);
  rT();
  save();
  toast(autoSortEnabled ? "🔀 自动排序已开启" : "🔀 自动排序已关闭");
}

function sortDisplayList(arr, mode) {
  mode = normalizeSortMode(mode);

  return arr.sort(function(a, b) {
    const doneCompare = compareDoneState(a, b);
    if (doneCompare !== 0) {
      return doneCompare;
    }

    if (mode === "priority") {
      return comparePriorityTask(a, b);
    }

    if (mode === "deadline") {
      return compareDeadlineTask(a, b);
    }

    return compareCreatedDesc(a, b);
  });
}

function hydrateSortModes() {
  defaultSortMode = normalizeSortMode(defaultSortMode);
  lastSort = normalizeSortMode(lastSort);

  const hydrated = {};
  Object.keys(sortStates || {}).forEach(function(key) {
    hydrated[key] = normalizeSortMode(sortStates[key]);
  });

  sortStates = hydrated;
  syncDefaultSortSelect();
}

function togglePreferenceButton(id, isOn) {
  const button = document.getElementById(id);

  if (button) {
    button.classList.toggle("on", isOn);
  }
}

function syncDefaultSortSelect() {
  const select = document.getElementById("defaultSortSel");

  if (select) {
    select.value = defaultSortMode;
  }
}

function getSortModeLabel(mode) {
  const names = {
    created: "创建时间",
    deadline: "截止日期",
    priority: "优先级"
  };

  return names[mode] || mode;
}

function compareDoneState(a, b) {
  if (a.done && !b.done) {
    return 1;
  }

  if (!a.done && b.done) {
    return -1;
  }

  return 0;
}

function comparePriorityTask(a, b) {
  const priorityOrder = {
    high: 0,
    medium: 1,
    normal: 1,
    low: 2
  };
  const priorityA = priorityOrder[a.priority] ?? 1;
  const priorityB = priorityOrder[b.priority] ?? 1;

  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  return compareCreatedDesc(a, b);
}

function compareDeadlineTask(a, b) {
  const deadlineA = deadlineSortKey(a);
  const deadlineB = deadlineSortKey(b);

  if (deadlineA == null && deadlineB == null) {
    return compareCreatedDesc(a, b);
  }

  if (deadlineA == null) {
    return 1;
  }

  if (deadlineB == null) {
    return -1;
  }

  if (deadlineA !== deadlineB) {
    return deadlineA - deadlineB;
  }

  return compareCreatedDesc(a, b);
}

function compareCreatedDesc(a, b) {
  return (b.created || 0) - (a.created || 0);
}

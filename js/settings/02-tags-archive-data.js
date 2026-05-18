// 标签、筛选与归档面板：统一管理标签维护、筛选栏、归档查询和数据导入导出。

const TAG_ICON_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
const FILTER_ALL_ICON_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
const ARCHIVE_BOX_ICON_SVG = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 8px"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';
const ARCHIVE_SEARCH_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
const ARCHIVE_YEAR_ICON_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
const RECOVER_ICON = "↩";

function getTag(id) {
  return customTags.find(function(tag) {
    return tag.id === id;
  });
}

function rTagMgmt() {
  const tagMgmt = document.getElementById("tagMgmt");

  if (!tagMgmt) {
    return;
  }

  tagMgmt.innerHTML = customTags.map(renderTagMgmtItem).join("");
}

function renderTagMgmtItem(tag) {
  return [
    '<div class="tag-mgmt-item">',
    '  <div class="tm-color" style="background:' + tag.color + '"></div>',
    '  <span class="tm-name">' + esc(tag.name) + "</span>",
    '  <button class="tm-del" onclick="delTag(\'' + tag.id + '\')">',
    '    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">',
    '      <line x1="18" y1="6" x2="6" y2="18"/>',
    '      <line x1="6" y1="6" x2="18" y2="18"/>',
    "    </svg>",
    "  </button>",
    "</div>"
  ].join("");
}

function addTag() {
  const nameInput = document.getElementById("newTagName");
  const colorInput = document.getElementById("newTagColor");
  const name = nameInput ? nameInput.value.trim() : "";
  const color = colorInput ? colorInput.value : "#6366f1";

  if (!name) {
    toast("⚠️ 请输入标签名");
    return;
  }

  customTags.push({
    id: "tag_" + Date.now(),
    name: name,
    color: color
  });

  if (nameInput) {
    nameInput.value = "";
  }

  rTagMgmt();
  rFilterBar();
  rTagDropdownContent();
  save();
  toast("🏷️ 标签已添加");
}

function delTag(id) {
  customTags = customTags.filter(function(tag) {
    return tag.id !== id;
  });

  for (const ds in T) {
    T[ds].forEach(function(task) {
      task.tags = (task.tags || []).filter(function(tagId) {
        return tagId !== id;
      });
    });
  }

  if (FTag === id) {
    FTag = "";
  }

  rTagMgmt();
  rFilterBar();
  rTagDropdownContent();
  rT();
  save();
  toast("🗑️ 标签已删除");
}

function toggleTagDropdown() {
  const dropdown = document.getElementById("tagDropdown");

  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

function rTagDropdownContent() {
  const dropdown = document.getElementById("tagDropdown");

  if (!dropdown) {
    return;
  }

  dropdown.innerHTML = buildTagDropdownHtml();
  updateTagFilterButton();
}

function buildTagDropdownHtml() {
  const items = [
    '<div class="sd-title">按标签筛选</div>',
    buildAllTagDropdownItem(),
    '<div class="sd-divider"></div>'
  ];

  customTags.forEach(function(tag) {
    items.push(buildTagDropdownItem(tag));
  });

  return items.join("");
}

function buildAllTagDropdownItem() {
  return '<div class="sd-item' + (!FTag ? " sd-active" : "") + '" onclick="setTagFilter(\'\')">' +
    "<span>" + FILTER_ALL_ICON_SVG + "全部标签</span>" +
    '<span class="sd-check">✓</span>' +
    "</div>";
}

function buildTagDropdownItem(tag) {
  const count = getVisibleTagTaskCount(tag.id);

  return '<div class="sd-item' + (FTag === tag.id ? " sd-active" : "") + '" onclick="setTagFilter(\'' + tag.id + '\')">' +
    '<span style="display:inline-flex;align-items:center;gap:6px">' +
    '<span style="background:' + tag.color + ';color:#fff;padding:1px 8px;border-radius:10px;font-size:.78rem;font-weight:600">' + esc(tag.name) + "</span>" +
    '<span style="font-size:.7rem;color:var(--text3)">' + count + "</span>" +
    "</span>" +
    '<span class="sd-check">✓</span>' +
    "</div>";
}

function getVisibleTagTaskCount(tagId) {
  return (T[sel] || []).filter(function(task) {
    return !task.archived && (task.tags || []).includes(tagId);
  }).length;
}

function updateTagFilterButton() {
  const button = document.getElementById("tagFilterBtn");

  if (!button) {
    return;
  }

  if (!FTag) {
    button.innerHTML = TAG_ICON_SVG + ' 标签<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.1em;margin-left:3px"><polyline points="6 9 12 15 18 9"/></svg>';
    button.classList.remove("on");
    return;
  }

  const tag = getTag(FTag);
  const color = tag ? tag.color : "#6366f1";
  const name = tag ? tag.name : "标签";

  button.innerHTML = TAG_ICON_SVG +
    ' <span style="background:' + color + ';color:#fff;padding:1px 7px;border-radius:9px;font-size:.78rem;font-weight:600">' + esc(name) + "</span>" +
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.1em;margin-left:3px"><polyline points="6 9 12 15 18 9"/></svg>';
  button.classList.add("on");
}

function setTagFilter(id) {
  FTag = id;
  document.getElementById("tagDropdown").classList.remove("show");
  rTagDropdownContent();
  rFilterBar();
  rT();
  rKanban();
}

function rFilterBar() {
  const dayTasks = T[sel] || [];
  const visibleTasks = dayTasks.filter(function(task) {
    return !task.archived;
  });
  const pendingCount = visibleTasks.filter(function(task) {
    return !task.done && !task.frozen;
  }).length;
  const doneCount = visibleTasks.filter(function(task) {
    return task.done;
  }).length;
  const highCount = visibleTasks.filter(function(task) {
    return task.priority === "high" && !task.done;
  }).length;
  const starredCount = visibleTasks.filter(function(task) {
    return task.starred && !task.done;
  }).length;
  const frozenCount = visibleTasks.filter(function(task) {
    return task.frozen;
  }).length;
  const filterBar = document.getElementById("filterBar");
  const savedScrollLeft = filterBar ? filterBar.scrollLeft : 0;

  if (!filterBar) {
    return;
  }

  filterBar.innerHTML = [
    '<div class="task-filter">',
    '<button class="' + (F === "all" && !FTag ? "on" : "") + '" onclick="filt(\'all\')">全部</button>',
    '<button class="' + (F === "pending" ? "on" : "") + '" onclick="filt(\'pending\')">待办' + buildFilterBadge(pendingCount, F === "pending") + "</button>",
    '<button class="' + (F === "done" ? "on" : "") + '" onclick="filt(\'done\')">已完成' + buildFilterBadge(doneCount, F === "done") + "</button>",
    '<button class="' + (F === "high" ? "on" : "") + '" onclick="filt(\'high\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>高' + buildFilterBadge(highCount, F === "high") + "</button>",
    '<button class="' + (F === "starred" ? "on" : "") + '" onclick="filt(\'starred\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="' + (F === "starred" ? "#f59e0b" : "none") + '" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>星标' + buildFilterBadge(starredCount, F === "starred") + "</button>",
    '<button class="' + (F === "frozen" ? "on" : "") + '" onclick="filt(\'frozen\')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>冻结' + buildFilterBadge(frozenCount, F === "frozen") + "</button>",
    "</div>"
  ].join("");

  setTimeout(function() {
    restoreFilterBarScroll(filterBar, savedScrollLeft);
    bindFilterBarMask(filterBar);
  }, 0);
}

function buildFilterBadge(count, active) {
  const background = active ? "rgba(255,255,255,.3)" : count === 0 ? "var(--inp-bd)" : "var(--acc)";
  const color = count === 0 && !active ? "var(--text3)" : "#fff";

  return '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:8px;font-size:.68rem;font-weight:700;background:' + background + ";color:" + color + ';margin-left:3px">' + count + "</span>";
}

function restoreFilterBarScroll(filterBar, savedScrollLeft) {
  filterBar.scrollLeft = savedScrollLeft;
}

function bindFilterBarMask(filterBar) {
  const taskFilter = filterBar.querySelector(".task-filter");

  if (!taskFilter) {
    return;
  }

  const updateMask = function() {
    const isAtStart = taskFilter.scrollLeft <= 0;
    const isAtEnd = Math.ceil(taskFilter.scrollLeft + taskFilter.clientWidth) >= taskFilter.scrollWidth;
    let mask = "none";

    if (!isAtStart || !isAtEnd) {
      if (isAtStart) {
        mask = "linear-gradient(to right,#000 0%,#000 75%,transparent 100%)";
      } else if (isAtEnd) {
        mask = "linear-gradient(to left,#000 0%,#000 75%,transparent 100%)";
      } else {
        mask = "linear-gradient(to right,transparent 0%,#000 10%,#000 90%,transparent 100%)";
      }
    }

    taskFilter.style.maskImage = mask;
    taskFilter.style.webkitMaskImage = mask;
  };

  updateMask();
  taskFilter.removeEventListener("scroll", updateMask);
  taskFilter.addEventListener("scroll", updateMask, false);
}

function filt(filter) {
  F = filter;
  FTag = "";

  const filterBar = document.getElementById("filterBar");
  const taskFilter = filterBar ? filterBar.querySelector(".task-filter") : null;
  const savedPos = taskFilter ? taskFilter.scrollLeft : 0;

  rFilterBar();
  rT();

  if (!filterBar) {
    return;
  }

  setTimeout(function() {
    const nextTaskFilter = filterBar.querySelector(".task-filter");

    if (nextTaskFilter) {
      nextTaskFilter.scrollLeft = savedPos;
    }
  }, 0);
}

function checkAutoArchive() {
  if (!autoArchive) {
    return;
  }

  const today = fd(now);

  for (const ds in T) {
    if (ds >= today) {
      continue;
    }

    (T[ds] || []).forEach(function(task) {
      if (task.done && !task.archived) {
        task.archived = true;
      }
    });
  }
}

function toggleArchive() {
  autoArchive = !autoArchive;
  document.getElementById("archToggle").classList.toggle("on", autoArchive);

  if (autoArchive) {
    checkAutoArchive();
  }

  rAll();
  save();
  toast(autoArchive ? "📦 自动归档已开启" : "📦 自动归档已关闭");
}

function toggleShowArchived() {
  showArchivedInList = !showArchivedInList;
  document.getElementById("showArchToggle").classList.toggle("on", showArchivedInList);
  rAll();
  save();
  toast(showArchivedInList ? "👁 已显示归档" : "👁 已隐藏归档");
}

function manualArchive() {
  let count = 0;

  for (const ds in T) {
    (T[ds] || []).forEach(function(task) {
      if (task.done && !task.archived) {
        task.archived = true;
        count += 1;
      }
    });
  }

  rAll();
  save();
  toast("📦 已归档 " + count + " 条");
}

function restoreArchived(ds, id) {
  const task = (T[ds] || []).find(function(item) {
    return item.id === id;
  });

  if (!task) {
    return;
  }

  task.archived = false;
  rAll();
  save();
  toast("📦 已恢复到日程");
}

function buildArchYearMap() {
  archYearMap = {};

  for (const ds in T) {
    (T[ds] || []).filter(function(task) {
      return task.archived;
    }).forEach(function(task) {
      const parts = ds.split("-");
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];

      if (!archYearMap[year]) {
        archYearMap[year] = {
          total: 0,
          months: {}
        };
      }

      if (!archYearMap[year].months[month]) {
        archYearMap[year].months[month] = {
          total: 0,
          days: {}
        };
      }

      if (!archYearMap[year].months[month].days[day]) {
        archYearMap[year].months[month].days[day] = 0;
      }

      archYearMap[year].total += 1;
      archYearMap[year].months[month].total += 1;
      archYearMap[year].months[month].days[day] += 1;
    });
  }
}

function rArchive() {
  const archiveView = document.getElementById("archiveView");

  if (!archiveView) {
    return;
  }

  buildArchYearMap();

  const totalArchived = Object.keys(archYearMap).reduce(function(total, year) {
    return total + archYearMap[year].total;
  }, 0);

  if (!totalArchived) {
    archiveView.innerHTML = buildArchiveEmptyState("暂无归档任务");
    return;
  }

  archiveView.innerHTML = buildArchivePanelHtml(totalArchived);
  queryArchive();
}

function buildArchivePanelHtml(totalArchived) {
  const years = Object.keys(archYearMap).sort().reverse();
  const yearOptions = years.map(function(year) {
    return '<option value="' + year + '"' + (archQYear === year ? " selected" : "") + ">" + year + "年 (" + archYearMap[year].total + ")</option>";
  }).join("");

  return [
    '<div class="arch-total">📦 共 <span class="at-num">' + totalArchived + "</span> 条归档</div>",
    '<div class="arch-query-row">',
    buildArchiveSelectGroup("年份", "archYearSel", yearOptions, "archYearChanged()", ARCHIVE_YEAR_ICON_SVG, true),
    buildArchiveSelectGroup("月份", "archMonthSel", buildArchiveMonthOptions(), "archMonthChanged()", "📅 ", false),
    buildArchiveSelectGroup("日期", "archDaySel", buildArchiveDayOptions(), "archDayChanged()", "📅 ", false),
    '<button class="arch-query-btn" onclick="queryArchive()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>查询</button>',
    "</div>",
    '<div class="arch-search-wrap"><span class="as-icon">' + ARCHIVE_SEARCH_ICON_SVG + '</span><input class="arch-search-input" placeholder="搜索任务名…" value="' + esc(archSearch) + '" oninput="archSearch=this.value;clearTimeout(window._archST);window._archST=setTimeout(queryArchive,400)"></div>',
    '<div id="archQueryResults"></div>'
  ].join("");
}

function buildArchiveSelectGroup(label, id, optionsHtml, changeHandler, iconMarkup, includeAllOption) {
  const allOption = includeAllOption ? '<option value="">全部</option>' : "";

  return '<div class="arch-sel-group"><label>' + iconMarkup + label + '</label><select id="' + id + '" onchange="' + changeHandler + '">' + allOption + optionsHtml + "</select></div>";
}

function buildArchiveMonthOptions() {
  if (!archQYear) {
    return '<option value="">全部</option>';
  }

  const months = archYearMap[archQYear] ? archYearMap[archQYear].months : {};

  return ['<option value="">全部</option>'].concat(
    Object.keys(months).sort().map(function(month) {
      return '<option value="' + month + '"' + (archQMonth === month ? " selected" : "") + ">" + Number(month) + "月 (" + months[month].total + ")</option>";
    })
  ).join("");
}

function buildArchiveDayOptions() {
  if (!archQYear || !archQMonth) {
    return '<option value="">全部</option>';
  }

  const days = archYearMap[archQYear] && archYearMap[archQYear].months[archQMonth]
    ? archYearMap[archQYear].months[archQMonth].days
    : {};

  return ['<option value="">全部</option>'].concat(
    Object.keys(days).sort().map(function(day) {
      return '<option value="' + day + '"' + (archQDay === day ? " selected" : "") + ">" + Number(day) + "日 (" + days[day] + ")</option>";
    })
  ).join("");
}

function archYearChanged() {
  archQYear = document.getElementById("archYearSel").value;
  archQMonth = "";
  archQDay = "";
  rArchive();
}

function archMonthChanged() {
  archQMonth = document.getElementById("archMonthSel").value;
  archQDay = "";
  rArchive();
}

function archDayChanged() {
  archQDay = document.getElementById("archDaySel").value;
  queryArchive();
}

function queryArchive() {
  const archiveResults = document.getElementById("archQueryResults");

  if (!archiveResults) {
    return;
  }

  let filtered = collectArchivedTasksByFilters();

  if (archSearch) {
    const keyword = archSearch.toLowerCase();
    filtered = filtered.filter(function(task) {
      return task.text.toLowerCase().includes(keyword);
    });
  }

  if (!filtered.length) {
    archiveResults.innerHTML = buildArchiveEmptyState("未找到匹配的归档任务");
    return;
  }

  archiveResults.innerHTML = buildArchiveQueryHtml(filtered);
}

function collectArchivedTasksByFilters() {
  const filtered = [];

  for (const ds in T) {
    const parts = ds.split("-");
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (archQYear && year !== archQYear) {
      continue;
    }
    if (archQMonth && month !== archQMonth) {
      continue;
    }
    if (archQDay && day !== archQDay) {
      continue;
    }

    (T[ds] || []).filter(function(task) {
      return task.archived;
    }).forEach(function(task) {
      filtered.push(Object.assign({}, task, {
        originalDate: ds
      }));
    });
  }

  return filtered;
}

function buildArchiveQueryHtml(filtered) {
  const groupedByMonth = groupArchivedTasksByMonth(filtered);
  const months = Object.keys(groupedByMonth).sort().reverse();
  const summary = '<div class="arch-summary-bar"><span class="asb-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>找到 <span class="asb-num">' + filtered.length + "</span> 条</span></div>";

  return summary + months.map(function(monthKey) {
    return buildArchiveMonthHtml(monthKey, groupedByMonth[monthKey]);
  }).join("");
}

function groupArchivedTasksByMonth(filtered) {
  const grouped = {};

  filtered.forEach(function(task) {
    const monthKey = task.originalDate.substring(0, 7);

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }

    grouped[monthKey].push(task);
  });

  return grouped;
}

function buildArchiveMonthHtml(monthKey, tasks) {
  const monthTasks = tasks.slice().sort(function(a, b) {
    return b.originalDate.localeCompare(a.originalDate);
  });
  const pageSize = window._archPages[monthKey] || ARCH_PAGE;
  const visibleTasks = monthTasks.slice(0, pageSize);
  const hasMore = monthTasks.length > pageSize;
  const collapsed = window._archCollapsed[monthKey];
  const parts = monthKey.split("-");
  const monthTitle = parts[0] + "年" + Number(parts[1]) + "月";

  return '<div class="arch-month' + (collapsed ? " collapsed" : "") + '">' +
    '<div class="arch-month-head" onclick="toggleArchMonth(\'' + monthKey + '\')">' +
    '<span class="am-arrow">▼</span>' +
    '<span class="am-title">' + monthTitle + "</span>" +
    '<span class="am-cnt">' + monthTasks.length + " 条</span>" +
    "</div>" +
    '<div class="am-tasks">' +
    visibleTasks.map(renderArchiveTaskItem).join("") +
    (hasMore ? '<button class="arch-loadmore" onclick="event.stopPropagation();loadMoreArch(\'' + monthKey + "')\">加载更多（还有 " + (monthTasks.length - pageSize) + " 条）</button>" : "") +
    "</div>" +
    "</div>";
}

function renderArchiveTaskItem(task) {
  return '<div class="am-task">' +
    '<span class="amt-date">' + dispS(task.originalDate) + "</span>" +
    '<span class="amt-text">' + esc(task.text) + "</span>" +
    prioBadge(task.priority, null, "font-size:.62rem;padding:1px 5px") +
    '<button class="am-restore" onclick="event.stopPropagation();restoreArchived(\'' + task.originalDate + "'," + task.id + ')" title="恢复">' + RECOVER_ICON + "</button>" +
    "</div>";
}

function toggleArchMonth(monthKey) {
  window._archCollapsed[monthKey] = !window._archCollapsed[monthKey];
  queryArchive();
}

function loadMoreArch(monthKey) {
  window._archPages[monthKey] = (window._archPages[monthKey] || ARCH_PAGE) + ARCH_PAGE;
  queryArchive();
}

function buildArchiveEmptyState(text) {
  return '<div class="arch-empty">' + ARCHIVE_BOX_ICON_SVG + text + "</div>";
}

function exportAll() {
  const data = getCurrentData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "tuole_backup_" + fd(now) + ".json";
  link.click();
  URL.revokeObjectURL(url);
  toast("📤 数据已导出");
}

function importAll(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function(loadEvent) {
    try {
      const data = JSON.parse(loadEvent.target.result);
      hydrateImportedData(data);
      rCal();
      rAll();
      syncImportedSettingsUI();
      save();
      toast("✅ 数据已导入");
    } catch (error) {
      toast("❌ 文件格式错误");
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

function hydrateImportedData(data) {
  if (!data.tasks) {
    return;
  }

  T = data.tasks || {};
  templates = data.templates || [];
  sortStates = data.sortStates || {};
  recurRules = data.recurRules || [];

  if (data.customTags) {
    customTags = data.customTags;
  }
  if (data.autoArchive !== undefined) {
    autoArchive = data.autoArchive;
  }
  if (data.showArchivedInList !== undefined) {
    showArchivedInList = data.showArchivedInList;
  }
  if (data.priorityColors) {
    priorityColors = Object.assign({}, DEFAULT_PRIO_COLORS, data.priorityColors);
  }
  if (data.priorityTemplateIds) {
    priorityTemplateIds = Object.assign({}, DEFAULT_PRIO_TEMPLATE_IDS, data.priorityTemplateIds);
  } else {
    inferPrioTemplatesFromColors();
  }
  syncPriorityColorsFromTemplates();
  if (data.showDeadline !== undefined) {
    showDeadline = data.showDeadline;
  }
  if (data.defaultSortMode) {
    defaultSortMode = data.defaultSortMode;
  }
  if (data.autoSortEnabled !== undefined) {
    autoSortEnabled = data.autoSortEnabled;
  }

  lastSort = defaultSortMode;
  updatePrioVars();
}

function syncImportedSettingsUI() {
  const defaultSortSel = document.getElementById("defaultSortSel");
  const autoSortToggle = document.getElementById("autoSortToggle");
  const archToggle = document.getElementById("archToggle");
  const showArchToggle = document.getElementById("showArchToggle");
  const deadlineToggle = document.getElementById("deadlineToggle");

  if (defaultSortSel) {
    defaultSortSel.value = defaultSortMode;
  }
  if (autoSortToggle) {
    autoSortToggle.classList.toggle("on", autoSortEnabled);
  }
  if (archToggle) {
    archToggle.classList.toggle("on", autoArchive);
  }
  if (showArchToggle) {
    showArchToggle.classList.toggle("on", showArchivedInList);
  }
  if (deadlineToggle) {
    deadlineToggle.classList.toggle("on", showDeadline);
  }
}

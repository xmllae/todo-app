// 订阅页挂载与公共工具
function ensureSubMode() {
  var appShell = document.querySelector("#appMain .app");
  var mount = appShell || document.getElementById("appMain");
  if (!mount) return;

  var existing = document.getElementById("subscriptionsMode");
  if (existing) {
    if (existing.parentNode !== mount) mount.appendChild(existing);
    return;
  }

  var d = document.createElement("div");
  d.id = "subscriptionsMode";
  d.className = "hidden";
  d.innerHTML =
    '<div class="sub-premium-page">' +
    '<aside class="sub-side-nav">' +
    '<div class="sub-side-head"><strong>总览</strong><span>Subscription OS</span></div>' +
    '<div class="sub-side-sec">' +
    '<div class="sub-side-title">管理</div>' +
    '<button class="sub-side-item is-active" id="subSideAll" type="button" onclick="_subSetTab(\'all\')"><span><i class="ph ph-shield-check"></i>我的订阅</span><span class="sub-side-count" id="subNavAllCount">0</span></button>' +
    '<button class="sub-side-item" id="subSideSoon" type="button" onclick="_subSetTab(\'soon\')"><span><i class="ph ph-arrows-clockwise"></i>即将续费</span><span class="sub-side-count" id="subNavSoonCount">0</span></button>' +
    '<button class="sub-side-item" id="subSideExpired" type="button" onclick="_subSetTab(\'expired\')"><span><i class="ph ph-x-circle"></i>已失效</span><span class="sub-side-count" id="subNavExpiredCount">0</span></button>' +
    '</div>' +
    '<div class="sub-side-sec">' +
    '<div class="sub-side-title">分类管理</div>' +
    '<div id="subNavCategories"><div class="sub-side-empty">暂无分类</div></div>' +
    '</div>' +
    '<div class="sub-side-sec">' +
    '<div class="sub-side-title">工具</div>' +
    '<button class="sub-tool-item" type="button" onclick="_subToolToast(\'消费分析\')"><span><i class="ph ph-chart-pie-slice"></i>消费分析</span></button>' +
    '<button class="sub-tool-item" type="button" onclick="_subToolToast(\'日历视图\')"><span><i class="ph ph-calendar"></i>日历视图</span></button>' +
    '<button class="sub-tool-item" type="button" onclick="_subToolToast(\'优惠与折扣\')"><span><i class="ph ph-percent"></i>优惠与折扣</span></button>' +
    '</div>' +
    '</aside>' +
    '<section class="sub-main-panel">' +
    '<div class="sub-page-header">' +
    '<div><h2 class="sub-page-title">我的订阅</h2><p class="sub-page-desc">管理你的所有订阅服务，掌控每一笔支出。</p></div>' +
    '<button class="sub-add-btn" type="button" onclick="openSubModal()"><i class="ph ph-plus"></i>新建项目</button>' +
    '</div>' +
    '<div id="subStats"></div>' +
    '<div id="subBanner"></div>' +
    '<div id="subList"></div>' +
    '</section>' +
    '</div>';

  mount.appendChild(d);
}

function getSubColor(days) {
  if (days <= 0) return { bg: "#fef2f2", border: "#fca5a5", text: "#ef4444" };
  if (days <= 7) return { bg: "#fff7ed", border: "#fdba74", text: "#ea580c" };
  return { bg: "#ecfeff", border: "#67e8f9", text: "#0e7490" };
}

function calcDaysLeft(d) {
  var e = new Date(d);
  if (isNaN(e)) return 9999;
  var t = new Date();
  t.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.ceil((e - t) / 864e5);
}

function _subNormalizeText(v) {
  return String(v == null ? "" : v).trim();
}

function _subFormatCurrency(v) {
  var n = +v || 0;
  if (n <= 0) return "—";
  return "¥ " + n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _subFormatDateTime(dateStr, timeStr) {
  if (!dateStr) return "—";
  var d = new Date(dateStr);
  if (isNaN(d)) return dateStr + (timeStr ? " " + timeStr : "");
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "/" + m + "/" + day + (timeStr ? " " + timeStr : "");
}

function _subMonthlyCost(entry) {
  if (!entry) return 0;
  var v = +entry.cost || 0;
  if (v <= 0) return 0;
  if (entry.cycle === "month") return v;
  if (entry.cycle === "quarter") return v / 3;
  if (entry.cycle === "year") return v / 12;
  if (entry.cycle === "custom") {
    var days = +entry.customDays || 30;
    if (days <= 0) days = 30;
    return (v / days) * 30;
  }
  return v;
}

function _subCategoryLabelByKey(key) {
  var map = {
    entertainment: "娱乐",
    work: "工作效率",
    learning: "学习教育",
    cloud: "云服务",
    life: "生活服务",
    other: "其他",
  };
  return map[key] || map.other;
}

function _subDetectCategory(s) {
  var text = (_subNormalizeText(s && s.name) + " " + _subNormalizeText(s && s.note)).toLowerCase();

  if (/(netflix|spotify|youtube|disney|music|movie|video|game|娱乐|音乐|视频|影视|动漫)/.test(text)) {
    return { key: "entertainment", label: _subCategoryLabelByKey("entertainment") };
  }
  if (/(icloud|dropbox|onedrive|google drive|aws|azure|cloud|storage|网盘|存储|云)/.test(text)) {
    return { key: "cloud", label: _subCategoryLabelByKey("cloud") };
  }
  if (/(coursera|udemy|edx|skillshare|learn|study|class|course|学习|课程|教育|训练营)/.test(text)) {
    return { key: "learning", label: _subCategoryLabelByKey("learning") };
  }
  if (/(adobe|microsoft|office|notion|figma|github|chatgpt|claude|jira|slack|工作|效率|协作|开发|设计)/.test(text)) {
    return { key: "work", label: _subCategoryLabelByKey("work") };
  }
  if (/(health|fitness|life|家庭|生活|健康|健身|个人)/.test(text)) {
    return { key: "life", label: _subCategoryLabelByKey("life") };
  }
  return { key: "other", label: _subCategoryLabelByKey("other") };
}

function _subTagToneByKey(key) {
  var map = {
    important: "danger",
    work: "violet",
    entertainment: "warm",
    learning: "sky",
    cloud: "mint",
    life: "warm",
    auto: "mint",
    manual: "muted",
    other: "neutral",
  };
  return map[key] || "neutral";
}

function _subBuildLabels(s, days) {
  var labels = [];
  var push = function (key, text) {
    if (!labels.some(function (x) { return x.key === key; })) {
      labels.push({ key: key, text: text, tone: _subTagToneByKey(key) });
    }
  };

  var cat = _subDetectCategory(s);
  var renewal = (s && s.renewal) || "manual";

  if (days >= 0 && days <= 7) push("important", "重要");
  if (cat.key !== "other") push(cat.key, cat.label);
  if (renewal === "auto") push("auto", "自动");
  else push("manual", "手动");
  if (!labels.length) push("other", "普通");

  return labels.slice(0, 3);
}

function _subStatusMeta(days) {
  if (days < 0) {
    return { key: "expired", text: "已失效", dotClass: "is-danger", dueText: "已过期 " + Math.abs(days) + " 天", dueClass: "is-danger" };
  }
  if (days <= 7) {
    return { key: "soon", text: "即将续费", dotClass: "is-warn", dueText: days === 0 ? "今天到期" : "剩 " + days + " 天", dueClass: "is-warn" };
  }
  return { key: "active", text: "活跃中", dotClass: "", dueText: "剩 " + days + " 天", dueClass: "" };
}

function _subMetaForEntry(s) {
  var days = calcDaysLeft(s && s.expireDate);
  var category = _subDetectCategory(s);
  var labels = _subBuildLabels(s, days);
  var status = _subStatusMeta(days);
  return {
    days: days,
    category: category,
    labels: labels,
    status: status,
    amount: +((s && s.cost) || 0),
  };
}

function _subRenderSideCategories(items) {
  var wrap = document.getElementById("subNavCategories");
  if (!wrap) return;

  if (!items || !items.length) {
    wrap.innerHTML = '<div class="sub-side-empty">暂无可用分类</div>';
    return;
  }

  wrap.innerHTML = items
    .map(function (item) {
      return (
        '<button class="sub-cat-item' + (_subLabelFilter === item.key ? " is-active" : "") + '" data-key="' + item.key + '" type="button" onclick="_subSetLabelFilter(\'' + item.key + '\')">' +
        '<span><i class="ph ph-folder"></i>' + esc(item.label) + '</span>' +
        '<span class="sub-cat-count">' + item.count + "</span>" +
        "</button>"
      );
    })
    .join("");
}

function _subUpdateSideCounts(summary) {
  summary = summary || {};
  var all = document.getElementById("subNavAllCount");
  var soon = document.getElementById("subNavSoonCount");
  var expired = document.getElementById("subNavExpiredCount");
  if (all) all.textContent = summary.total || 0;
  if (soon) soon.textContent = summary.soon || 0;
  if (expired) expired.textContent = summary.expired || 0;
}

function _subSyncSideActiveState() {
  var allBtn = document.getElementById("subSideAll");
  var soonBtn = document.getElementById("subSideSoon");
  var expiredBtn = document.getElementById("subSideExpired");

  if (allBtn) allBtn.classList.toggle("is-active", _subTabFilter === "all");
  if (soonBtn) soonBtn.classList.toggle("is-active", _subTabFilter === "soon");
  if (expiredBtn) expiredBtn.classList.toggle("is-active", _subTabFilter === "expired");

  var catBtns = document.querySelectorAll("#subNavCategories .sub-cat-item");
  catBtns.forEach(function (btn) {
    btn.classList.toggle("is-active", btn.getAttribute("data-key") === _subLabelFilter);
  });
}

function _subToolToast(name) {
  if (typeof toast === "function") toast(name + " 功能准备中");
}

function _subSetSearch(v) {
  _subSearch = v || "";
  _subPage = 1;
  rSubList();
}

function _subSetSort(v) {
  _subSort = v || "days";
  rSubList();
}

function _subSetTab(v) {
  _subTabFilter = v || "all";
  _subPage = 1;
  rSubList();
}

function _subSetLabelFilter(v) {
  _subLabelFilter = v || "all";
  _subPage = 1;
  rSubList();
}

function _subToggleMonthFilter() {
  _subMonthFilter = !_subMonthFilter;
  _subPage = 1;
  rSubscriptions();
}

function _subSetPage(page) {
  var p = parseInt(page, 10) || 1;
  if (p < 1) p = 1;
  _subPage = p;
  rSubList();
}

function _subSetPageSize(size) {
  var n = parseInt(size, 10);
  if (!n || n < 1) n = 10;
  _subPageSize = n;
  _subPage = 1;
  rSubList();
}

function _subToggleAll(checked) {
  var rows = document.querySelectorAll("#subList .sub-table-row[data-id]");
  rows.forEach(function (row) {
    var id = +row.getAttribute("data-id");
    if (checked) _subSelected.add(id);
    else _subSelected.delete(id);
  });
  rSubList();
}

function _subToggleOne(id, checked) {
  if (checked) _subSelected.add(id);
  else _subSelected.delete(id);
  rSubList();
}

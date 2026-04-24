// 订阅页统计与提醒
function rSubscriptions() {
  subscriptions = JSON.parse(localStorage.getItem("tuole_subs") || "[]");
  var multiBar = document.querySelector(".multi-bar.show");
  if (multiBar) multiBar.classList.remove("show");

  var stats = document.getElementById("subStats");
  if (!stats) return;

  var rows = subscriptions.map(function (s) {
    return { item: s, meta: _subMetaForEntry(s) };
  });

  var total = rows.length;
  var activeCount = rows.filter(function (r) {
    return r.meta.status.key !== "expired";
  }).length;
  var soonRows = rows
    .filter(function (r) {
      return r.meta.status.key === "soon";
    })
    .sort(function (a, b) {
      return a.meta.days - b.meta.days;
    });
  var expiredCount = rows.filter(function (r) {
    return r.meta.status.key === "expired";
  }).length;

  var monthCost = rows.reduce(function (sum, r) {
    return sum + _subMonthlyCost(r.item);
  }, 0);
  var yearCost = monthCost * 12;

  var now = new Date();
  var nowYear = now.getFullYear();
  var nowMonth = now.getMonth();
  var prevMonthDate = new Date(nowYear, nowMonth - 1, 1);
  var prevYear = prevMonthDate.getFullYear();
  var prevMonth = prevMonthDate.getMonth();

  var currentBucket = 0;
  var prevBucket = 0;
  rows.forEach(function (r) {
    var d = new Date(r.item.expireDate);
    if (isNaN(d)) return;
    var cost = _subMonthlyCost(r.item);
    if (d.getFullYear() === nowYear && d.getMonth() === nowMonth) currentBucket += cost;
    if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) prevBucket += cost;
  });

  var trendText = "暂无上月基准";
  var trendClass = "flat";
  if (prevBucket > 0) {
    var trend = ((currentBucket - prevBucket) / prevBucket) * 100;
    var absPct = Math.abs(trend).toFixed(1) + "%";
    if (trend > 0.01) {
      trendText = "较上月 ↑ " + absPct;
      trendClass = "up";
    } else if (trend < -0.01) {
      trendText = "较上月 ↓ " + absPct;
      trendClass = "down";
    } else {
      trendText = "较上月基本持平";
      trendClass = "flat";
    }
  }

  var nextRow = rows
    .filter(function (r) {
      return r.meta.days >= 0;
    })
    .sort(function (a, b) {
      return a.meta.days - b.meta.days;
    })[0];

  var nextValue = "无待续费";
  var nextMeta = "当前没有即将续费的项目";
  var nextValueClass = "";
  if (nextRow) {
    var d = nextRow.meta.days;
    nextValue = d === 0 ? "今天" : "剩 " + d + " 天";
    nextMeta = _subFormatDateTime(nextRow.item.expireDate, nextRow.item.expireTime) + " · " + esc(_subNormalizeText(nextRow.item.name) || "未命名服务");
    if (d <= 7) nextValueClass = " is-alert";
  }

  function mkCard(opt) {
    var iconCls = opt.iconClass ? " " + opt.iconClass : "";
    var valCls = opt.valueClass ? " " + opt.valueClass : "";
    var clickable = opt.click ? ' onclick="' + opt.click + '"' : "";
    var stateCls = opt.stateClass ? " " + opt.stateClass : "";
    return (
      '<div class="sub-stat-card' + stateCls + (opt.click ? " is-clickable" : "") + '"' + clickable + '>' +
      '<div class="sub-stat-head">' +
      '<span class="sub-stat-label">' + opt.label + "</span>" +
      '<span class="sub-stat-icon' + iconCls + '">' +
      opt.icon +
      "</span>" +
      "</div>" +
      '<div class="sub-stat-value' + valCls + '">' + opt.value + "</div>" +
      '<div class="sub-stat-meta">' + opt.meta + "</div>" +
      (opt.trend ? '<div class="sub-stat-trend ' + opt.trendClass + '">' + opt.trend + "</div>" : "") +
      "</div>"
    );
  }

  var statHtml = "";
  statHtml += mkCard({
    label: "活跃订阅",
    value: String(activeCount),
    meta: "共计订阅服务 " + total + " 项",
    icon:
      '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    iconClass: "",
  });

  statHtml += mkCard({
    label: "月度支出",
    value: _subFormatCurrency(monthCost),
    meta: _subMonthFilter ? "当前只统计本月到期项目" : "按订阅周期折算后的月均花费",
    trend: trendText,
    trendClass: trendClass,
    icon:
      '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7H3"/><path d="M21 12H3"/><path d="M7 17H3"/><path d="M17 17H9"/></svg>',
    click: "_subToggleMonthFilter()",
    stateClass: _subMonthFilter ? " is-active" : "",
  });

  statHtml += mkCard({
    label: "即将续费",
    value: nextValue,
    valueClass: nextValueClass,
    meta: nextMeta,
    icon:
      '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    iconClass: " sub-stat-icon--warn",
  });

  statHtml += mkCard({
    label: "年度预计支出",
    value: _subFormatCurrency(yearCost),
    meta: "按月均支出折算全年预算",
    icon:
      '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>',
    iconClass: " sub-stat-icon--success",
  });

  stats.innerHTML = statHtml;

  var banner = document.getElementById("subBanner");
  var shouldShow = typeof _subAlertShouldShow === "function" ? _subAlertShouldShow() : !_subBannerDismissed;

  if (banner && shouldShow && soonRows.length) {
    var topRows = soonRows.slice(0, 3).map(function (r) {
      var dayText = r.meta.days === 0 ? "今天" : "剩 " + r.meta.days + " 天";
      return (
        '<button type="button" onclick="_subHighlightRow(' +
        r.item.id +
        ')">' +
        esc(_subNormalizeText(r.item.name) || "未命名") +
        "（" +
        dayText +
        "）</button>"
      );
    });

    var more = soonRows.length > 3 ? "，另有 " + soonRows.length + " 项待处理" : "";

    banner.innerHTML =
      '<div class="sub-alert-banner">' +
      '<i class="ph ph-warning-circle"></i>' +
      '<div class="sub-alert-copy"><strong>续费提醒：</strong>' +
      topRows.join("、") +
      more +
      "。</div>" +
      '<button class="sub-alert-close" type="button" onclick="_subAlertDismiss&&_subAlertDismiss();_subBannerDismissed=true;document.getElementById(\'subBanner\').innerHTML=\'\'">×</button>' +
      "</div>";
  } else if (banner) {
    banner.innerHTML = "";
  }

  var categoryCountMap = {};
  rows.forEach(function (r) {
    var key = r.meta.category.key;
    categoryCountMap[key] = (categoryCountMap[key] || 0) + 1;
  });

  var order = ["entertainment", "work", "learning", "cloud", "life", "other"];
  var categoryList = order
    .map(function (key) {
      return {
        key: key,
        label: _subCategoryLabelByKey(key),
        count: categoryCountMap[key] || 0,
      };
    })
    .filter(function (x) {
      return x.count > 0;
    });

  _subCategorySnapshot = categoryList;
  _subRenderSideCategories(categoryList);
  _subUpdateSideCounts({ total: total, soon: soonRows.length, expired: expiredCount });
  _subSyncSideActiveState();

  rSubList();
}

function _clb(c, customDays) {
  if (c === "month") return "月付";
  if (c === "year") return "年付";
  if (c === "quarter") return "季付";
  if (c === "custom") return customDays ? customDays + " 天" : "自定义";
  return "自定义";
}

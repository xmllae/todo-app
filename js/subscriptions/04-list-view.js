// 订阅页列表视图
function _subEsc(v) {
  if (typeof esc === "function") return esc(v == null ? "" : String(v));
  var div = document.createElement("div");
  div.textContent = v == null ? "" : String(v);
  return div.innerHTML;
}

function _subAvatarHtml(item, meta) {
  var icon = _subNormalizeText(item.icon);
  if (icon) {
    return '<span class="sub-service-avatar is-emoji">' + _subEsc(icon.slice(0, 2)) + "</span>";
  }
  var name = _subNormalizeText(item.name);
  var first = name ? name.charAt(0).toUpperCase() : "?";
  return '<span class="sub-service-avatar sub-service-avatar--' + meta.category.key + '">' + _subEsc(first) + "</span>";
}

function _subTabCounters(rows) {
  return {
    all: rows.length,
    active: rows.filter(function (r) {
      return r.meta.status.key === "active";
    }).length,
    soon: rows.filter(function (r) {
      return r.meta.status.key === "soon";
    }).length,
    expired: rows.filter(function (r) {
      return r.meta.status.key === "expired";
    }).length,
  };
}

function _subMatchesLabel(meta, key) {
  if (!key || key === "all") return true;
  if (meta.category.key === key) return true;
  return meta.labels.some(function (label) {
    return label.key === key;
  });
}

function _subSortRows(rows) {
  rows.sort(function (a, b) {
    if (_subSort === "name") {
      return (_subNormalizeText(a.item.name) || "").localeCompare(_subNormalizeText(b.item.name) || "");
    }
    if (_subSort === "cost") return b.meta.amount - a.meta.amount;
    if (_subSort === "days_desc") return b.meta.days - a.meta.days;
    if (_subSort === "expire") return new Date(a.item.expireDate) - new Date(b.item.expireDate);
    return a.meta.days - b.meta.days;
  });
}

function _subBuildLabelOptions(rows) {
  var options = [{ key: "all", label: "全部标签" }];
  var has = { all: true };

  (_subCategorySnapshot || []).forEach(function (cat) {
    if (!has[cat.key]) {
      has[cat.key] = true;
      options.push({ key: cat.key, label: cat.label });
    }
  });

  [
    { key: "important", label: "重要" },
    { key: "auto", label: "自动" },
    { key: "manual", label: "手动" },
  ].forEach(function (opt) {
    if (rows.some(function (r) { return _subMatchesLabel(r.meta, opt.key); }) && !has[opt.key]) {
      has[opt.key] = true;
      options.push(opt);
    }
  });

  return options;
}

function _subBuildPager(totalPages) {
  if (totalPages <= 1) return "";

  var html = '<button class="sub-page-btn" type="button" onclick="_subSetPage(' + (_subPage - 1) + ')"' + (_subPage <= 1 ? " disabled" : "") + '><i class="ph ph-caret-left"></i></button>';

  var start = Math.max(1, _subPage - 1);
  var end = Math.min(totalPages, start + 2);
  if (end - start < 2) start = Math.max(1, end - 2);

  for (var i = start; i <= end; i++) {
    html += '<button class="sub-page-btn' + (i === _subPage ? " is-active" : "") + '" type="button" onclick="_subSetPage(' + i + ')">' + i + "</button>";
  }

  html += '<button class="sub-page-btn" type="button" onclick="_subSetPage(' + (_subPage + 1) + ')"' + (_subPage >= totalPages ? " disabled" : "") + '><i class="ph ph-caret-right"></i></button>';
  return html;
}

function _subRenderTableEmpty(kind) {
  if (kind === "all") {
    return (
      '<div class="sub-table-empty">' +
      '<i class="ph ph-bell-slash" style="font-size:2rem;color:var(--sub-text-3)"></i>' +
      '<div class="sub-empty-title">暂无订阅记录</div>' +
      '<div class="sub-empty-desc">点击右上角“新建项目”开始记录你的订阅服务</div>' +
      '<button class="sub-empty-btn" type="button" onclick="openSubModal()">+ 添加订阅</button>' +
      "</div>"
    );
  }

  return (
    '<div class="sub-table-empty">' +
    '<i class="ph ph-magnifying-glass" style="font-size:2rem;color:var(--sub-text-3)"></i>' +
    '<div class="sub-empty-title">未找到匹配结果</div>' +
    '<div class="sub-empty-desc">尝试调整筛选条件或搜索关键词</div>' +
    "</div>"
  );
}

function rSubList() {
  var list = document.getElementById("subList");
  if (!list) return;

  var rows = subscriptions.map(function (s) {
    return { item: s, meta: _subMetaForEntry(s) };
  });

  if (_subMonthFilter) {
    var now = new Date();
    rows = rows.filter(function (r) {
      var d = new Date(r.item.expireDate);
      return !isNaN(d) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }

  var counters = _subTabCounters(rows);

  var filtered = rows.slice();
  if (_subTabFilter === "active") {
    filtered = filtered.filter(function (r) {
      return r.meta.status.key === "active";
    });
  } else if (_subTabFilter === "soon") {
    filtered = filtered.filter(function (r) {
      return r.meta.status.key === "soon";
    });
  } else if (_subTabFilter === "expired") {
    filtered = filtered.filter(function (r) {
      return r.meta.status.key === "expired";
    });
  }

  if (_subSearch) {
    var q = _subSearch.toLowerCase();
    filtered = filtered.filter(function (r) {
      return (
        _subNormalizeText(r.item.name).toLowerCase().indexOf(q) >= 0 ||
        _subNormalizeText(r.item.note).toLowerCase().indexOf(q) >= 0
      );
    });
  }

  if (_subLabelFilter && _subLabelFilter !== "all") {
    filtered = filtered.filter(function (r) {
      return _subMatchesLabel(r.meta, _subLabelFilter);
    });
  }

  _subSortRows(filtered);

  var totalFiltered = filtered.length;
  var pageSize = _subPageSize || 10;
  var totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (_subPage > totalPages) _subPage = totalPages;
  if (_subPage < 1) _subPage = 1;

  var startIndex = (_subPage - 1) * pageSize;
  var pageRows = filtered.slice(startIndex, startIndex + pageSize);
  var labelOptions = _subBuildLabelOptions(rows);

  var tabs = [
    { key: "all", label: "全部", count: counters.all },
    { key: "active", label: "活跃中", count: counters.active },
    { key: "soon", label: "即将续费", count: counters.soon },
    { key: "expired", label: "已失效", count: counters.expired },
  ];

  var tabHtml = tabs
    .map(function (t) {
      return (
        '<button class="sub-tab-btn' +
        (_subTabFilter === t.key ? " is-active" : "") +
        '" type="button" onclick="_subSetTab(\'' +
        t.key +
        '\')">' +
        t.label +
        '<span class="tab-count">(' +
        t.count +
        ")</span></button>"
      );
    })
    .join("");

  var labelSelect =
    '<select class="sub-select" onchange="_subSetLabelFilter(this.value)">' +
    labelOptions
      .map(function (opt) {
        return '<option value="' + opt.key + '"' + (_subLabelFilter === opt.key ? " selected" : "") + ">" + _subEsc(opt.label) + "</option>";
      })
      .join("") +
    "</select>";

  var sortSelect =
    '<select class="sub-select" onchange="_subSetSort(this.value)">' +
    '<option value="days"' + (_subSort === "days" ? " selected" : "") + ">按剩余天数（升序）</option>" +
    '<option value="days_desc"' + (_subSort === "days_desc" ? " selected" : "") + ">按剩余天数（降序）</option>" +
    '<option value="expire"' + (_subSort === "expire" ? " selected" : "") + ">按到期日期</option>" +
    '<option value="cost"' + (_subSort === "cost" ? " selected" : "") + ">按费用高低</option>" +
    '<option value="name"' + (_subSort === "name" ? " selected" : "") + ">按名称 A-Z</option>" +
    "</select>";

  var topBar =
    '<div class="sub-list-topbar">' +
    '<div class="sub-tab-strip">' +
    tabHtml +
    "</div>" +
    '<div class="sub-tools">' +
    '<div class="sub-search-wrap">' +
    '<i class="ph ph-magnifying-glass"></i>' +
    '<input id="subSearchInp" type="text" placeholder="搜索订阅服务..." value="' +
    _subEsc(_subSearch) +
    '" oninput="_subSetSearch(this.value);var c=document.getElementById(\'subSearchClear\');if(c)c.classList.toggle(\'show\',!!this.value)">' +
    '<button class="sub-search-clear' +
    (_subSearch ? " show" : "") +
    '" id="subSearchClear" type="button" onclick="document.getElementById(\'subSearchInp\').value=\'\';_subSetSearch(\'\');this.classList.remove(\'show\')">×</button>' +
    "</div>" +
    labelSelect +
    sortSelect +
    "</div>" +
    "</div>";

  var batchBar = "";
  if (_subSelected.size > 0) {
    batchBar =
      '<div class="sub-batch-bar">' +
      '<span class="sub-batch-text">已选择 ' + _subSelected.size + " 项</span>" +
      '<button class="sub-batch-btn danger" type="button" onclick="_subBatchDel()">批量删除</button>' +
      '<button class="sub-batch-btn primary" type="button" onclick="_subBatchRenew()">批量续期</button>' +
      '<button class="sub-batch-btn ghost" type="button" onclick="_subSelected.clear();rSubList()">取消选择</button>' +
      "</div>";
  }

  var tableContent = "";
  var mobileContent = "";

  if (!totalFiltered) {
    tableContent = _subRenderTableEmpty(subscriptions.length ? "filter" : "all");
    mobileContent = '<div class="sub-mobile-list">' + tableContent + "</div>";
  } else {
    var tableRows = pageRows
      .map(function (row) {
        var item = row.item;
        var meta = row.meta;
        var checked = _subSelected.has(item.id);
        var classes = "sub-table-row";
        if (checked) classes += " is-selected";
        else if (meta.status.key === "soon") classes += " is-soon";
        else if (meta.status.key === "expired") classes += " is-expired";

        var name = _subNormalizeText(item.name) || "未命名服务";
        var subline = _subNormalizeText(item.note) || meta.category.label;
        if (subline.length > 22) subline = subline.slice(0, 22) + "…";

        var tags = meta.labels.slice(0, 2);
        var tagHtml = tags
          .map(function (tag) {
            return '<span class="sub-tag sub-tag--' + tag.tone + '">' + _subEsc(tag.text) + "</span>";
          })
          .join("");

        var dueClass = meta.status.dueClass ? " " + meta.status.dueClass : "";

        var actionBtn =
          meta.status.key === "expired"
            ? '<button class="sub-op-btn is-danger" type="button" onclick="_subRenewOne(' + item.id + ')">重新订阅</button>'
            : '<button class="sub-op-btn" type="button" onclick="editSub(' + item.id + ')">管理</button>';

        return (
          '<div class="' +
          classes +
          '" data-id="' +
          item.id +
          '">' +
          '<div class="sub-service-cell">' +
          '<input class="sub-service-check" type="checkbox"' +
          (checked ? " checked" : "") +
          ' onclick="event.stopPropagation();_subToggleOne(' +
          item.id +
          ',this.checked)">' +
          _subAvatarHtml(item, meta) +
          '<div class="sub-service-main"><div class="sub-service-name">' +
          _subEsc(name) +
          '</div><div class="sub-service-sub">' +
          _subEsc(subline) +
          "</div></div></div>" +
          '<div class="sub-tag-group">' +
          tagHtml +
          "</div>" +
          '<div class="sub-status-pill"><span class="sub-status-dot ' +
          meta.status.dotClass +
          '"></span><span>' +
          meta.status.text +
          "</span></div>" +
          '<div><div class="sub-due-main' +
          dueClass +
          '">' +
          meta.status.dueText +
          '</div><div class="sub-due-sub">' +
          _subEsc(_subFormatDateTime(item.expireDate, item.expireTime)) +
          "</div></div>" +
          '<div><span class="sub-cycle-pill">' +
          _subEsc(_clb(item.cycle, item.customDays)) +
          "</span></div>" +
          '<div class="sub-amount">' +
          _subEsc(_subFormatCurrency(item.cost)) +
          "</div>" +
          '<div class="sub-row-actions">' +
          actionBtn +
          '<button class="sub-more-btn" type="button" aria-label="更多操作" onclick="event.stopPropagation();editSub(' +
          item.id +
          ')"><i class="ph ph-dots-three-vertical"></i></button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    tableContent =
      batchBar +
      '<div class="sub-table-head">' +
      '<div><label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="subHdrCb" onclick="_subToggleAll(this.checked)">服务</label></div>' +
      "<div>标签</div>" +
      "<div>状态</div>" +
      "<div>到期时间</div>" +
      "<div>周期</div>" +
      "<div>金额</div>" +
      "<div>操作</div>" +
      "</div>" +
      '<div class="sub-table-body">' +
      tableRows +
      "</div>" +
      '<div class="sub-table-foot">' +
      '<span class="sub-foot-total">共 ' +
      totalFiltered +
      " 项</span>" +
      '<div class="sub-foot-right">' +
      '<div class="sub-pager">' +
      _subBuildPager(totalPages) +
      "</div>" +
      '<select class="sub-page-size" onchange="_subSetPageSize(this.value)">' +
      '<option value="10"' + (_subPageSize === 10 ? " selected" : "") + ">10</option>" +
      '<option value="20"' + (_subPageSize === 20 ? " selected" : "") + ">20</option>" +
      '<option value="50"' + (_subPageSize === 50 ? " selected" : "") + ">50</option>" +
      "</select>" +
      "</div>" +
      "</div>";

    mobileContent =
      '<div class="sub-mobile-list">' +
      pageRows
        .map(function (row) {
          var item = row.item;
          var meta = row.meta;
          var checked = _subSelected.has(item.id);
          var tags = meta.labels.slice(0, 2);

          var actionBtn =
            meta.status.key === "expired"
              ? '<button class="sub-card-btn danger" type="button" onclick="_subRenewOne(' + item.id + ')">重新订阅</button>'
              : '<button class="sub-card-btn primary" type="button" onclick="editSub(' + item.id + ')">管理</button>';

          return (
            '<div class="sub-mobile-card" data-id="' +
            item.id +
            '">' +
            '<div class="sub-mobile-head">' +
            '<input class="sub-service-check" type="checkbox"' +
            (checked ? " checked" : "") +
            ' onclick="_subToggleOne(' +
            item.id +
            ',this.checked)">' +
            _subAvatarHtml(item, meta) +
            '<div style="min-width:0;flex:1">' +
            '<div class="sub-service-name">' +
            _subEsc(_subNormalizeText(item.name) || "未命名服务") +
            "</div>" +
            '<div class="sub-tag-group" style="margin-top:6px">' +
            tags
              .map(function (tag) {
                return '<span class="sub-tag sub-tag--' + tag.tone + '">' + _subEsc(tag.text) + "</span>";
              })
              .join("") +
            "</div>" +
            "</div>" +
            '<span class="sub-status-pill"><span class="sub-status-dot ' + meta.status.dotClass + '"></span></span>' +
            "</div>" +
            '<div class="sub-mobile-meta">' +
            '<div class="sub-mobile-kv"><small>到期时间</small><strong>' + _subEsc(_subFormatDateTime(item.expireDate, item.expireTime)) + "</strong></div>" +
            '<div class="sub-mobile-kv"><small>计费周期</small><strong>' + _subEsc(_clb(item.cycle, item.customDays)) + "</strong></div>" +
            '<div class="sub-mobile-kv"><small>剩余</small><strong>' + _subEsc(meta.status.dueText) + "</strong></div>" +
            '<div class="sub-mobile-kv"><small>金额</small><strong>' + _subEsc(_subFormatCurrency(item.cost)) + "</strong></div>" +
            "</div>" +
            '<div class="sub-mobile-actions">' +
            actionBtn +
            '<button class="sub-card-btn" type="button" onclick="delSub(' + item.id + ')">删除</button>' +
            "</div>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  list.innerHTML =
    topBar +
    '<div class="sub-table-wrap">' +
    tableContent +
    "</div>" +
    mobileContent;

  _subSyncHdrCb();
  _subSyncSideActiveState();
}

function _subRowClick() {}

function _subRenewOne(id) {
  var s = subscriptions.find(function (x) {
    return x.id === id;
  });
  if (!s) return;
  var base = new Date(s.expireDate);
  if (isNaN(base)) {
    toast("无效到期日期");
    return;
  }
  if (s.cycle === "month") base.setMonth(base.getMonth() + 1);
  else if (s.cycle === "year") base.setFullYear(base.getFullYear() + 1);
  else if (s.cycle === "quarter") base.setMonth(base.getMonth() + 3);
  else if (s.cycle === "custom" && s.customDays) base.setDate(base.getDate() + +s.customDays);
  else base.setMonth(base.getMonth() + 1);
  s.expireDate = base.toISOString().slice(0, 10);
  localStorage.setItem("tuole_subs", JSON.stringify(subscriptions));
  if (typeof save === "function") save();
  rSubscriptions();
  toast("✅ 已续期：" + _subNormalizeText(s.name));
}

function _subSyncHdrCb() {
  var hdrCb = document.getElementById("subHdrCb");
  if (!hdrCb) return;

  var rows = document.querySelectorAll("#subList .sub-table-row[data-id]");
  if (!rows.length) {
    hdrCb.checked = false;
    hdrCb.indeterminate = false;
    return;
  }

  var selected = 0;
  rows.forEach(function (row) {
    if (_subSelected.has(+row.getAttribute("data-id"))) selected++;
  });

  if (selected === 0) {
    hdrCb.checked = false;
    hdrCb.indeterminate = false;
  } else if (selected === rows.length) {
    hdrCb.checked = true;
    hdrCb.indeterminate = false;
  } else {
    hdrCb.checked = false;
    hdrCb.indeterminate = true;
  }
}

function _subToggleOne(id, checked) {
  if (checked) _subSelected.add(id);
  else _subSelected.delete(id);
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

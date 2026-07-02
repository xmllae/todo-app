// 订阅页选择与批量操作
function _subUpdateBatchBar() {
  rSubList();
}

function _subBatchDel() {
  if (_subSelected.size === 0) return;

  var names = subscriptions
    .filter(function (s) {
      return _subSelected.has(s.id);
    })
    .map(function (s) {
      return _subNormalizeText(s.name) || "未命名";
    });

  if (!confirm("确认删除所选 " + _subSelected.size + " 条订阅？\n" + names.join("、"))) return;

  subscriptions = subscriptions.filter(function (s) {
    return !_subSelected.has(s.id);
  });

  writeSubscriptionsToStorage(subscriptions);
  _subSelected.clear();
  rSubscriptions();
  toast("🗑️ 已批量删除");
}

function _subBatchRenew() {
  if (_subSelected.size === 0) return;

  var updated = 0;
  subscriptions.forEach(function (s) {
    if (!_subSelected.has(s.id)) return;

    var base = new Date(s.expireDate);
    if (isNaN(base)) return;

    if (s.cycle === "month") base.setMonth(base.getMonth() + 1);
    else if (s.cycle === "year") base.setFullYear(base.getFullYear() + 1);
    else if (s.cycle === "quarter") base.setMonth(base.getMonth() + 3);
    else if (s.cycle === "custom" && s.customDays) base.setDate(base.getDate() + +s.customDays);
    else base.setMonth(base.getMonth() + 1);

    s.expireDate = base.toISOString().slice(0, 10);
    updated++;
  });

  writeSubscriptionsToStorage(subscriptions);
  _subSelected.clear();
  rSubscriptions();
  toast("✅ 已批量续期 " + updated + " 条订阅");
}

function _subHighlightRow(id) {
  var row = document.querySelector('.sub-table-row[data-id="' + id + '"]');

  if (!row) {
    var target = subscriptions.find(function (s) {
      return s.id === id;
    });
    if (target) {
      _subSearch = _subNormalizeText(target.name);
      _subTabFilter = "all";
      _subLabelFilter = "all";
      _subPage = 1;
      rSubList();
      row = document.querySelector('.sub-table-row[data-id="' + id + '"]');
    }
  }

  if (!row) return;

  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.classList.remove("is-flash");
  row.offsetWidth;
  row.classList.add("is-flash");
}

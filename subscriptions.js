let subscriptions = [];
let _subCycle = 'month';
var _subSearch = '';
var _subSort = 'days';
var _subBannerDismissed = false;
var _subSelected = new Set();

(function(){
  if (document.getElementById('subShakeStyle')) return;
  var st = document.createElement('style');
  st.id = 'subShakeStyle';
  var css = '';
  css += '@keyframes subShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}';
  css += '.sub-shake{animation:subShake .5s ease infinite;}';
  css += '.sub-act-btns{opacity:0;transition:opacity .15s;}';
  css += '.sub-row:hover .sub-act-btns{opacity:1;}';
  css += '@media(max-width:640px){';
  css += '#subStats{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;}';
  css += '.sub-table-wrap{display:none!important;}';
  css += '.sub-card-list{display:flex!important;flex-direction:column;gap:10px;}';
  css += '.sub-toolbar{flex-direction:column!important;gap:8px!important;}';
  css += '.sub-toolbar select,.sub-toolbar input{width:100%!important;box-sizing:border-box!important;}';
  css += '}';
  css += '@media(min-width:641px){.sub-card-list{display:none!important;}.sub-table-wrap{display:block!important;}}';
  st.textContent = css;
  document.head.appendChild(st);
})()

function ensureSubMode() {
  if (document.getElementById('subscriptionsMode')) return;
  var d = document.createElement('div');
  d.id = 'subscriptionsMode';
  d.className = 'hidden';
  var h = '';
  h += '<div class="task-card">';
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px">';
  h += '<h3 style="margin:0;font-size:1.2rem;font-weight:700">⏰ 订阅管理</h3>';
  h += '<button onclick="openSubModal()" style="background:var(--acc);border:none;color:#fff;padding:9px 18px;border-radius:10px;cursor:pointer;font-size:.9rem;font-weight:600;white-space:nowrap">＋ 添加</button>';
  h += '</div>';
  h += '<div id="subStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px"></div>';
  h += '<div id="subBanner"></div>';
  h += '<div id="subList"></div>';
  h += '</div>';
  d.innerHTML = h;
  document.getElementById('appMain').appendChild(d);
}

window.addEventListener('load', function() {
  window.applyMode = function(mode) {
    ['taskMode','kanbanMode','settingsMode','statsMode','subscriptionsMode'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    if (mode === 'task') document.getElementById('taskMode').classList.remove('hidden');
    else if (mode === 'kanban') document.getElementById('kanbanMode').classList.remove('hidden');
    else if (mode === 'settings') document.getElementById('settingsMode').classList.remove('hidden');
    else if (mode === 'stats') document.getElementById('statsMode').classList.remove('hidden');
    else if (mode === 'subscriptions') {
      ensureSubMode();
      document.getElementById('subscriptionsMode').classList.remove('hidden');
      rSubscriptions();
    }
    if (mode !== 'subscriptions') rAll();
  };
});

function getSubColor(days) {
  if (days <= 7)  return { bg: '#fef2f2', border: '#fca5a5', text: '#ef4444' };
  if (days <= 30) return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' };
  return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
}

function calcDaysLeft(d) {
  var e = new Date(d), t = new Date();
  t.setHours(0,0,0,0); e.setHours(0,0,0,0);
  return Math.ceil((e - t) / 864e5);
}

function _subNextStatus(cur) {
  if (cur === 'active')  return 'paused';
  if (cur === 'paused')  return 'cancelled';
  return 'active';
}

function _subStatusInfo(st) {
  if (st === 'paused')    return { dot: '#94a3b8', label: '已暂停' };
  if (st === 'cancelled') return { dot: '#ef4444', label: '已取消' };
  return { dot: '#22c55e', label: '激活中' };
}

function subToggleStatus(id) {
  subscriptions = JSON.parse(localStorage.getItem('tuole_subs') || '[]');
  var s = subscriptions.find(function(x){ return x.id === id; });
  if (!s) return;
  s.status = _subNextStatus(s.status || 'active');
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  rSubscriptions();
}

function _subSetSearch(v) { _subSearch = v; rSubList(); }
function _subSetSort(v)   { _subSort = v;   rSubList(); }

function _subToggleAll(checked) {
  subscriptions.forEach(function(s){ if (checked) _subSelected.add(s.id); else _subSelected.delete(s.id); });
  rSubList();
}

function _subToggleOne(id, checked) {
  if (checked) _subSelected.add(id); else _subSelected.delete(id);
  rSubList();
}

function _subBatchDel() {
  if (!_subSelected.size) return;
  subscriptions = JSON.parse(localStorage.getItem('tuole_subs') || '[]');
  var names = subscriptions.filter(function(s){ return _subSelected.has(s.id); }).map(function(s){ return s.name; });
  if (!confirm('确认删除 ' + _subSelected.size + ' 项？
' + names.join('、'))) return;
  subscriptions = subscriptions.filter(function(s){ return !_subSelected.has(s.id); });
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  _subSelected.clear();
  rSubscriptions();
  toast('🗑️ 已删除');
}

function delSub(id) {
  subscriptions = JSON.parse(localStorage.getItem('tuole_subs') || '[]');
  var s = subscriptions.find(function(x){ return x.id === id; });
  var name = s ? s.name : '';
  if (!confirm('确认删除「' + name + '」？')) return;
  subscriptions = subscriptions.filter(function(x){ return x.id !== id; });
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  _subSelected.delete(id);
  rSubscriptions();
  toast('🗑️ 已删除');
}

function editSub(id) { openSubModal(id); }
function rSubscriptions() {
  subscriptions = JSON.parse(localStorage.getItem('tuole_subs') || '[]');
  var stats = document.getElementById('subStats');
  if (!stats) return;
  var total = subscriptions.length;
  var now2 = new Date();
  var thisMonth = subscriptions.filter(function(s) {
    var d = new Date(s.expireDate);
    return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
  }).length;
  var monthCost = subscriptions.reduce(function(sum, s) {
    var v = +s.cost || 0;
    if (s.cycle === 'month')   return sum + v;
    if (s.cycle === 'year')    return sum + v / 12;
    if (s.cycle === 'quarter') return sum + v / 3;
    return sum;
  }, 0);
  var yearCost = monthCost * 12;

  function mk(bg, accent, em, label, val) {
    var h = '';
    h += '<div style="background:' + bg + ';border-left:4px solid ' + accent + ';border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">';
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    h += '<span style="font-size:1.3rem;flex-shrink:0">' + em + '</span>';
    h += '<span style="font-size:.78rem;color:var(--text3);font-weight:600">' + label + '</span>';
    h += '</div>';
    h += '<div style="font-size:1.6rem;font-weight:700;color:' + accent + '">' + val + '</div>';
    h += '</div>';
    return h;
  }

  stats.innerHTML =
    mk('#eef2ff','#818cf8','📦','订阅总数', total) +
    mk('#fff7ed','#f97316','🔔','本月到期', thisMonth) +
    mk('#f0fdf4','#22c55e','💰','月均花费', '¥' + monthCost.toFixed(2)) +
    mk('#eff6ff','#3b82f6','📅','年度花费', '¥' + yearCost.toFixed(2));

  var banner = document.getElementById('subBanner');
  if (banner && !_subBannerDismissed) {
    var expiring = subscriptions.filter(function(s){ return calcDaysLeft(s.expireDate) <= 7; });
    if (expiring.length) {
      var bnames = expiring.map(function(s){ return s.name; }).join('、');
      var bh = '';
      bh += '<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px">';
      bh += '<span style="flex-shrink:0">⚠️</span>';
      bh += '<span style="flex:1;font-size:.88rem;color:#92400e"><strong>即将到期：</strong> ' + esc(bnames) + ' — 请及时处理</span>';
      bh += '<button onclick="_subBannerDismissed=true;document.getElementById(\'subBanner\').innerHTML=\'\';" style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:#92400e;flex-shrink:0">×</button>';
      bh += '</div>';
      banner.innerHTML = bh;
    } else { banner.innerHTML = ''; }
  }
  rSubList();
}

function _clb(c) {
  if (c === 'month')   return '月付';
  if (c === 'year')    return '年付';
  if (c === 'quarter') return '季付';
  return '一次性';
}
  tbl += ' onchange="_subToggleAll(this.checked)" style="cursor:pointer;width:14px;height:14px"></div>';
  tbl += '<div>服务名称</div>';
  tbl += '<div style="text-align:center">到期日期</div>';
  tbl += '<div style="text-align:center">剩余天数</div>';
  tbl += '<div style="text-align:center">周期</div>';
  tbl += '<div style="text-align:right">费用</div>';
  tbl += '<div style="text-align:center">状态</div>';
  tbl += '<div style="text-align:center">操作</div>';
  tbl += '</div>';

  if (!filtered.length) {
    tbl += '<div style="padding:32px;text-align:center;color:var(--text3);font-size:.9rem">未找到匹配的订阅</div>';
  } else {
    filtered.forEach(function(s, i) {
      var dl = calcDaysLeft(s.expireDate);
      var c  = getSubColor(dl);
      var al = dl <= 7;
      var sel = _subSelected.has(s.id);
      var st  = _subStatusInfo(s.status || 'active');
      var bt = i === 0 ? '' : 'border-top:1px solid var(--task-bd);';
      var nm = (s.icon ? s.icon + ' ' : '') + esc(s.name);
      tbl += '<div class="sub-row" style="display:grid;grid-template-columns:' + COL + ';align-items:center;padding:0 14px;min-height:52px;' + bt + (sel ? 'background:rgba(99,102,241,.07);' : '') + '">';
      tbl += '<div><input type="checkbox" ' + (sel ? 'checked' : '') + ' onchange="_subToggleOne(' + s.id + ',this.checked)" style="cursor:pointer;width:14px;height:14px"></div>';
      tbl += '<div style="min-width:0;padding-right:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.9rem;font-weight:600;color:var(--text)">' + nm + '</div>';
      tbl += '<div style="text-align:center;font-size:.81rem;color:var(--text2)">' + s.expireDate + '</div>';
      tbl += '<div style="text-align:center"><span class="' + (al ? 'sub-shake' : '') + '" style="display:inline-block;padding:2px 9px;border-radius:20px;background:' + c.bg + ';color:' + c.text + ';font-size:.77rem;font-weight:700;border:1px solid ' + c.border + '">' + (al ? '⚠️ ' : '') + dl + '</span></div>';
      tbl += '<div style="text-align:center;font-size:.81rem;color:var(--text2)">' + _clb(s.cycle) + '</div>';
      tbl += '<div style="text-align:right;font-size:.86rem;font-weight:600;color:var(--text)">¥' + (+s.cost).toFixed(2) + '</div>';
      tbl += '<div style="text-align:center"><button onclick="subToggleStatus(' + s.id + ')" style="display:inline-flex;align-items:center;gap:5px;background:var(--hov);border:1.5px solid var(--inp-bd);border-radius:20px;padding:3px 10px;cursor:pointer;font-size:.75rem;color:var(--text2)"><span style="width:7px;height:7px;border-radius:50%;background:' + st.dot + ';display:inline-block"></span>' + st.label + '</button></div>';
      tbl += '<div class="sub-act-btns" style="display:flex;gap:5px;justify-content:center">';
      tbl += '<button onclick="editSub(' + s.id + ')" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:4px 10px;border-radius:7px;cursor:pointer;font-size:.76rem;font-weight:500">编辑</button>';
      tbl += '<button onclick="delSub(' + s.id + ')" style="background:#fef2f2;border:1.5px solid #fca5a5;color:#ef4444;padding:4px 10px;border-radius:7px;cursor:pointer;font-size:.76rem;font-weight:500">删除</button>';
      tbl += '</div></div>';
    });
  }
  tbl += '</div>';
  // ---- MOBILE CARDS ----
  var cards = '';
  cards += '<div class="sub-card-list">';
  if (!filtered.length) {
    cards += '<div style="padding:20px;text-align:center;color:var(--text3);font-size:.9rem">未找到匹配的订阅</div>';
  } else {
    filtered.forEach(function(s) {
      var dl = calcDaysLeft(s.expireDate);
      var c  = getSubColor(dl);
      var al = dl <= 7;
      var sel = _subSelected.has(s.id);
      var st  = _subStatusInfo(s.status || 'active');
      var nm = (s.icon ? s.icon + ' ' : '') + esc(s.name);
      cards += '<div style="background:var(--task-bg);border:1.5px solid var(--task-bd);border-radius:14px;padding:14px 16px;' + (sel ? 'background:rgba(99,102,241,.07);' : '') + '">';
      cards += '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">';
      cards += '<input type="checkbox" ' + (sel ? 'checked' : '') + ' onchange="_subToggleOne(' + s.id + ',this.checked)" style="margin-top:3px;cursor:pointer;width:15px;height:15px;flex-shrink:0">';
      cards += '<div style="flex:1;min-width:0">';
      cards += '<div style="font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + nm + '</div>';
      cards += '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">';
      cards += '<span style="font-size:.78rem;color:var(--text3)">' + s.expireDate + '</span>';
      cards += '<span style="font-size:.78rem;color:var(--text3)">· ' + _clb(s.cycle) + '</span>';
      cards += '<span style="font-size:.82rem;font-weight:600;color:var(--text)">· ¥' + (+s.cost).toFixed(2) + '</span>';
      cards += '</div></div>';
      cards += '<span class="' + (al ? 'sub-shake' : '') + '" style="display:inline-block;padding:2px 9px;border-radius:20px;background:' + c.bg + ';color:' + c.text + ';font-size:.77rem;font-weight:700;border:1px solid ' + c.border + '">' + (al ? '⚠️ ' : '') + dl + '天</span>';
      cards += '</div>';
      cards += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--task-bd)">';
      cards += '<button onclick="subToggleStatus(' + s.id + ')" style="display:inline-flex;align-items:center;gap:5px;background:var(--hov);border:1.5px solid var(--inp-bd);border-radius:20px;padding:4px 12px;cursor:pointer;font-size:.78rem;color:var(--text2)"><span style="width:7px;height:7px;border-radius:50%;background:' + st.dot + ';display:inline-block"></span>' + st.label + '</button>';
      cards += '<div style="display:flex;gap:6px">';
      cards += '<button onclick="editSub(' + s.id + ')" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:500">编辑</button>';
      cards += '<button onclick="delSub(' + s.id + ')" style="background:#fef2f2;border:1.5px solid #fca5a5;color:#ef4444;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:500">删除</button>';
      cards += '</div></div></div>';
    });
  }
  cards += '</div>';

  var batchBar = '';
  if (_subSelected.size > 0) {
    batchBar += '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;padding:10px 16px;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;flex-wrap:wrap">';
    batchBar += '<span style="flex:1;font-size:.88rem;color:#b91c1c;font-weight:500">已选 ' + _subSelected.size + ' 项</span>';
    batchBar += '<button onclick="_subBatchDel()" style="background:#ef4444;border:none;color:#fff;padding:7px 18px;border-radius:8px;cursor:pointer;font-size:.84rem;font-weight:600">🗑️ 批量删除</button>';
    batchBar += '<button onclick="_subSelected.clear();rSubList()" style="background:var(--hov);border:1.5px solid var(--inp-bd);color:var(--text2);padding:7px 14px;border-radius:8px;cursor:pointer;font-size:.84rem">取消</button>';
    batchBar += '</div>';
  }

  list.innerHTML = toolbar + tbl + cards + batchBar;
}

let subscriptions = [];
let _subCycle = 'month';
var _subSearch = '';
var _subSort = 'days';
var _subBannerDismissed = false;
var _subMonthFilter = false;
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
  css += '.sub-row{overflow:hidden;}';
  css += '.sub-renew-badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:.74rem;font-weight:600;}';
  css += '.sub-row td,.sub-row>div{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}';
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
  h += '<h3 style="margin:0;font-size:1.2rem;font-weight:700">\u23f0 \u8ba2\u9605\u7ba1\u7406</h3>';
  h += '<button onclick="openSubModal()" style="background:var(--acc);border:none;color:#fff;padding:9px 18px;border-radius:10px;cursor:pointer;font-size:.9rem;font-weight:600;white-space:nowrap;box-shadow:0 4px 12px rgba(99,102,241,0.35);transition:all 150ms ease" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 6px 18px rgba(99,102,241,0.45)\'" onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'0 4px 12px rgba(99,102,241,0.35)\'">+ \u6dfb\u52a0</button>';
  h += '</div>';
  h += '<div id="subStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px"></div>';
  h += '<div id="subBanner"></div>';
  h += '<div id="subList"></div>';
  h += '</div>';
  d.innerHTML = h;
  document.getElementById('appMain').appendChild(d);
}

// applyMode is defined in index.html and already handles the subscriptions mode.
// subscriptions.js exposes ensureSubMode and rSubscriptions globally.


function getSubColor(days) {
  if (days <= 0)  return { bg: '#fef2f2', border: '#fca5a5', text: '#ef4444' };
  if (days <= 30) return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' };
  return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
}

function calcDaysLeft(d) {
  var e = new Date(d), t = new Date();
  t.setHours(0,0,0,0); e.setHours(0,0,0,0);
  return Math.ceil((e - t) / 864e5);
}

function _subHighlightRow(id) {
  var row = document.querySelector('.sub-row[data-id="'+id+'"]');
  if (!row) return;
  row.scrollIntoView({behavior:'smooth', block:'center'});
  row.style.transition = 'background .3s';
  row.style.background = 'rgba(251,191,36,.18)';
  setTimeout(function(){ row.style.background = ''; }, 1500);
}

function _subSetSearch(v) { _subSearch = v; rSubList(); }
function _subSetSort(v)   { _subSort = v;   rSubList(); }
function _subToggleMonthFilter() { _subMonthFilter = !_subMonthFilter; rSubscriptions(); }

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
  if (!confirm('\u786e\u8ba4\u5220\u9664 ' + _subSelected.size + ' \u9879\uff1f\n' + names.join('\u3001'))) return;
  subscriptions = subscriptions.filter(function(s){ return !_subSelected.has(s.id); });
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  _subSelected.clear();
  rSubscriptions();
  toast('\ud83d\uddd1\ufe0f \u5df2\u5220\u9664');
}

function delSub(id) {
  subscriptions = JSON.parse(localStorage.getItem('tuole_subs') || '[]');
  var s = subscriptions.find(function(x){ return x.id === id; });
  var name = s ? s.name : '';
  if (!confirm('\u786e\u8ba4\u5220\u9664\u300c' + name + '\u300d\uff1f')) return;
  subscriptions = subscriptions.filter(function(x){ return x.id !== id; });
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  _subSelected.delete(id);
  rSubscriptions();
  toast('\ud83d\uddd1\ufe0f \u5df2\u5220\u9664');
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

  function mk(bg, topColor, svgIcon, label, val, clickFn, isActive) {
    var h = '';
    var extra = clickFn ? 'cursor:pointer;' : '';
    var border = isActive ? 'box-shadow:0 0 0 2.5px ' + topColor + ';' : '';
    h += '<div onclick="' + (clickFn||'') + '" style="background:' + bg + ';border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden;position:relative;' + extra + border + 'transition:box-shadow .15s">';
    h += '<div style="height:3px;background:' + topColor + ';border-radius:3px 3px 0 0;position:absolute;top:0;left:0;right:0"></div>';
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;margin-top:4px">';
    h += '<span style="color:' + topColor + ';flex-shrink:0">' + svgIcon + '</span>';
    h += '<span style="font-size:.78rem;color:var(--text3);font-weight:600">' + label + '</span>';
    h += '</div>';
    h += '<div style="font-size:32px;font-weight:700;color:' + topColor + ';line-height:1">' + val + '</div>';
    h += '</div>';
    return h;
  }
  var calSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var bellSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  var coinSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m-4-4h8"/></svg>';
  var chartSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
  var monthCostColor = monthCost > 0 ? '#22c55e' : '#999';
  var yearCostColor = yearCost > 0 ? '#3b82f6' : '#999';
  stats.innerHTML =
    mk('#EEF0FF','#6366f1', calSvg, '\u8ba2\u9605\u603b\u6570', total, '', false) +
    mk('#FFF4EC','#f97316', bellSvg, '\u672c\u6708\u5230\u671f', thisMonth, '_subToggleMonthFilter()', _subMonthFilter) +
    mk('#F0FFF4', monthCostColor, coinSvg, '\u6708\u5747\u82b1\u8d39', monthCost > 0 ? '\u00a5' + monthCost.toFixed(2) : '\u2014\u2014', '', false) +
    mk('#EEF6FF', yearCostColor, chartSvg, '\u5e74\u5ea6\u82b1\u8d39', yearCost > 0 ? '\u00a5' + yearCost.toFixed(2) : '\u2014\u2014', '', false);

  var banner = document.getElementById('subBanner');
  if (banner && !_subBannerDismissed) {
    var expiring = subscriptions.filter(function(s){ return calcDaysLeft(s.expireDate) <= 7; });
    if (expiring.length) {
      var bnames = expiring.map(function(s){ return '<span onclick="_subHighlightRow('+s.id+')" style="cursor:pointer;text-decoration:underline;color:#92400e;font-weight:700">'+esc(s.name)+'</span>'; }).join('\u3001');
      var bh = '';
      bh += '<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px">';
      bh += '<span style="flex-shrink:0">\u26a0\ufe0f</span>';
      bh += '<span style="flex:1;font-size:.88rem;color:#92400e"><strong>\u5373\u5c06\u5230\u671f\uff1a</strong> ' + bnames + ' \u2014 \u8bf7\u53ca\u65f6\u5904\u7406</span>';
      bh += '<button onclick="_subBannerDismissed=true;document.getElementById(\'subBanner\').innerHTML=\'\'" style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:#92400e;flex-shrink:0">\u00d7</button>';
      bh += '</div>';
      banner.innerHTML = bh;
    } else { banner.innerHTML = ''; }
  }
  rSubList();
}

function _clb(c, customDays) {
  if (c === 'month')   return '\u6708\u4ed8';
  if (c === 'year')    return '\u5e74\u4ed8';
  if (c === 'quarter') return '\u5b63\u4ed8';
  if (c === 'custom')  return customDays ? customDays + '\u5929' : '\u81ea\u5b9a\u4e49';
  return '\u81ea\u5b9a\u4e49';
}

function rSubList() {
  var list = document.getElementById('subList');
  if (!list) return;
  var COL = '30% 20% 12% 12% 12% 8% 6%';

  var toolbar = '<div class="sub-toolbar" style="display:flex;gap:12px;margin-bottom:12px;align-items:center;flex-wrap:wrap">';
  toolbar += '<div style="position:relative;flex:1;max-width:65%;min-width:140px">';
  toolbar += '<input type="text" id="subSearchInp" placeholder="\u641c\u7d22\u8ba2\u9605\u2026" value="' + esc(_subSearch) + '" oninput="_subSetSearch(this.value);var c=document.getElementById(\'subSearchClear\');if(c)c.style.display=this.value?\'flex\':\'none\';" style="width:100%;border:1.5px solid var(--inp-bd);border-radius:9px;padding:8px 32px 8px 12px;font-size:.88rem;color:var(--text);background:var(--inp-bg);outline:0;box-sizing:border-box">';
  toolbar += '<span id="subSearchClear" onclick="document.getElementById(\'subSearchInp\').value=\'\';_subSetSearch(\'\');this.style.display=\'none\';" style="display:' + (_subSearch ? 'flex' : 'none') + ';position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3);width:18px;height:18px;align-items:center;justify-content:center;font-size:.8rem;border-radius:50%;background:var(--hov)">\u00d7</span>';
  toolbar += '</div>';
  toolbar += '<select onchange="_subSetSort(this.value)" style="width:140px;flex-shrink:0;border:1.5px solid var(--inp-bd);border-radius:9px;padding:8px 10px;font-size:.85rem;color:var(--text2);background:var(--inp-bg);outline:0;cursor:pointer">';
  toolbar += '<option value="days"' + (_subSort==='days'?' selected':'') + '>\u6309\u5269\u4f59\u5929\u6570</option>';
  toolbar += '<option value="name"' + (_subSort==='name'?' selected':'') + '>\u6309\u540d\u79f0</option>';
  toolbar += '<option value="cost"' + (_subSort==='cost'?' selected':'') + '>\u6309\u8d39\u7528</option>';
  toolbar += '</select>';
  toolbar += '</div>';

  var filtered = subscriptions.slice();
  if (_subMonthFilter) {
    var _now = new Date();
    filtered = filtered.filter(function(s){
      var d = new Date(s.expireDate);
      return d.getMonth() === _now.getMonth() && d.getFullYear() === _now.getFullYear();
    });
  }
  if (_subSearch) {
    var q = _subSearch.toLowerCase();
    filtered = filtered.filter(function(s){ return s.name.toLowerCase().indexOf(q) >= 0; });
  }
  filtered.sort(function(a, b) {
    if (_subSort === 'name') return (a.name||'').localeCompare(b.name||'');
    if (_subSort === 'cost') return (+b.cost||0) - (+a.cost||0);
    return calcDaysLeft(a.expireDate) - calcDaysLeft(b.expireDate);
  });

  var tbl = '';
  tbl += '<div class="sub-table-wrap" style="border:1.5px solid var(--task-bd);border-radius:14px;overflow:hidden">';
  tbl += '<div style="display:grid;grid-template-columns:' + COL + ';align-items:center;padding:0 14px;min-height:42px;background:var(--hov);font-size:.77rem;font-weight:600;color:var(--text3)">';
  tbl += '<div style="display:flex;align-items:center;gap:8px">' + (filtered.length ? '<input type="checkbox" onchange="_subToggleAll(this.checked)" style="cursor:pointer;width:14px;height:14px;flex-shrink:0">' : '') + '\u670d\u52a1\u540d\u79f0</div>';
  tbl += '<div style="text-align:right">\u5230\u671f\u65e5\u671f</div>';
  tbl += '<div style="text-align:right">\u5269\u4f59\u5929\u6570</div>';
  tbl += '<div style="text-align:center">\u5468\u671f</div>';
  tbl += '<div style="text-align:right">\u8d39\u7528</div>';
  tbl += '<div style="text-align:center">\u7eed\u671f</div>';
  tbl += '</div>';

  if (!filtered.length && subscriptions.length === 0) {
    tbl += '<div style="min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px">';
    tbl += '<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="12" y1="2" x2="12" y2="3"/></svg>';
    tbl += '<div style="font-size:15px;color:#666;font-weight:500">\u6682\u65e0\u8ba2\u9605\u8bb0\u5f55</div>';
    tbl += '<div style="font-size:13px;color:#999">\u70b9\u51fb\u53f3\u4e0a\u89d2 + \u6dfb\u52a0 \u5f00\u59cb\u8bb0\u5f55</div>';
    tbl += '<button onclick="openSubModal()" style="margin-top:4px;background:transparent;border:1.5px solid #818cf8;color:#6366f1;padding:8px 20px;border-radius:10px;cursor:pointer;font-size:.88rem;font-weight:600;transition:all 150ms ease" onmouseenter="this.style.background=\'#eef2ff\'" onmouseleave="this.style.background=\'transparent\'">+ \u6dfb\u52a0\u8ba2\u9605</button>';
    tbl += '</div>';
  } else if (!filtered.length) {
    tbl += '<div style="padding:32px;text-align:center;color:var(--text3);font-size:.9rem">\u672a\u627e\u5230\u5339\u914d\u7684\u8ba2\u9605</div>';
  } else {
    filtered.forEach(function(s, i) {
      var dl = calcDaysLeft(s.expireDate);
      var c  = getSubColor(dl);
      var al = dl <= 7;
      var sel = _subSelected.has(s.id);
      var bt = i === 0 ? '' : 'border-top:1px solid var(--task-bd);';
      var nm = (s.icon ? s.icon + ' ' : '') + esc(s.name);
      var costDisp = (+s.cost) > 0 ? '<span style="font-size:.86rem;font-weight:600;color:var(--text)">\u00a5' + (+s.cost).toFixed(2) + '</span>' : '<span style="color:#bbb">\u2014\u2014</span>';
      var dateDisp = s.expireDate + (s.expireTime ? ' <span style="font-size:12px;color:#94a3b8">' + s.expireTime + '</span>' : '');
      var alIcon = dl <= 0 ? '\u26a0\ufe0f ' : (dl <= 30 ? '\u26a0\ufe0f ' : '');
      tbl += '<div class="sub-row" data-id="' + s.id + '" style="display:grid;grid-template-columns:' + COL + ';align-items:center;padding:0 14px;height:56px;' + bt + (sel ? 'background:rgba(99,102,241,.07);' : '') + '">';
      tbl += '<div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden"><input type="checkbox" ' + (sel ? 'checked' : '') + ' onchange="_subToggleOne(' + s.id + ',this.checked)" style="cursor:pointer;width:14px;height:14px;flex-shrink:0"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.9rem;font-weight:600;color:var(--text)">' + nm + '</span></div>';
      tbl += '<div style="text-align:right;font-size:.81rem;color:var(--text2);overflow:hidden;white-space:nowrap">' + dateDisp + '</div>';
      tbl += '<div style="text-align:right"><span class="' + (al ? 'sub-shake' : '') + '" style="display:inline-block;padding:2px 7px;border-radius:20px;background:' + c.bg + ';color:' + c.text + ';font-size:.77rem;font-weight:700;border:1px solid ' + c.border + '">' + alIcon + dl + '</span></div>';
      tbl += '<div style="text-align:center;font-size:.81rem;color:var(--text2)">' + _clb(s.cycle, s.customDays) + '</div>';
      tbl += '<div style="text-align:right">' + costDisp + '</div>';
      tbl += '<div style="text-align:center"><span class="sub-renew-badge" style="background:' + (s.renewal==='auto'?'#eff6ff':'#f0fdf4') + ';color:' + (s.renewal==='auto'?'#3b82f6':'#16a34a') + ';border:1px solid ' + (s.renewal==='auto'?'#bfdbfe':'#bbf7d0') + '">' + (s.renewal==='auto'?'\u81ea\u52a8':'\u624b\u52a8') + '</span></div>';
      tbl += '<div class="sub-act-btns" style="display:flex;gap:3px;justify-content:flex-end">';
      tbl += '<button onclick="editSub(' + s.id + ')" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:3px 6px;border-radius:6px;cursor:pointer;font-size:.7rem;font-weight:500">\u7f16\u8f91</button>';
      tbl += '<button onclick="delSub(' + s.id + ')" style="background:#fef2f2;border:1.5px solid #fca5a5;color:#ef4444;padding:3px 6px;border-radius:6px;cursor:pointer;font-size:.7rem;font-weight:500">\u5220\u9664</button>';
      tbl += '</div></div>';
    });
  }
  tbl += '</div>';

  var cards = '';
  cards += '<div class="sub-card-list">';
  if (!filtered.length) {
    cards += '<div style="padding:20px;text-align:center;color:var(--text3);font-size:.9rem">\u672a\u627e\u5230\u5339\u914d\u7684\u8ba2\u9605</div>';
  } else {
    filtered.forEach(function(s) {
      var dl = calcDaysLeft(s.expireDate);
      var c  = getSubColor(dl);
      var al = dl <= 7;
      var sel = _subSelected.has(s.id);
      var nm = (s.icon ? s.icon + ' ' : '') + esc(s.name);
      cards += '<div style="background:var(--task-bg);border:1.5px solid var(--task-bd);border-radius:14px;padding:14px 16px;' + (sel ? 'background:rgba(99,102,241,.07);' : '') + '">';
      cards += '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">';
      cards += '<input type="checkbox" ' + (sel ? 'checked' : '') + ' onchange="_subToggleOne(' + s.id + ',this.checked)" style="margin-top:3px;cursor:pointer;width:15px;height:15px;flex-shrink:0">';
      cards += '<div style="flex:1;min-width:0">';
      cards += '<div style="font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + nm + '</div>';
      cards += '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">';
      cards += '<span style="font-size:.78rem;color:var(--text3)">' + s.expireDate + (s.expireTime ? ' <span style="color:#94a3b8">' + s.expireTime + '</span>' : '') + '</span>';
      cards += '<span style="font-size:.78rem;color:var(--text3)">\u00b7 ' + _clb(s.cycle, s.customDays) + '</span>';
      cards += '<span style="font-size:.82rem;font-weight:600;color:var(--text)">\u00b7 \u00a5' + (+s.cost).toFixed(2) + '</span>';
      cards += '</div></div>';
      cards += '<span class="' + (al ? 'sub-shake' : '') + '" style="display:inline-block;padding:2px 9px;border-radius:20px;background:' + c.bg + ';color:' + c.text + ';font-size:.77rem;font-weight:700;border:1px solid ' + c.border + '">' + (al ? '\u26a0\ufe0f ' : '') + dl + '\u5929</span>';
      cards += '</div>';
      cards += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--task-bd)">';
      cards += '<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.74rem;font-weight:600;background:' + (s.renewal==='auto'?'#eff6ff':'#f0fdf4') + ';color:' + (s.renewal==='auto'?'#3b82f6':'#16a34a') + ';border:1px solid ' + (s.renewal==='auto'?'#bfdbfe':'#bbf7d0') + '">' + (s.renewal==='auto'?'自动续期':'手动续期') + '</span>';
      cards += '<div style="display:flex;gap:6px">';
      cards += '<button onclick="editSub(' + s.id + ')" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:500">\u7f16\u8f91</button>';
      cards += '<button onclick="delSub(' + s.id + ')" style="background:#fef2f2;border:1.5px solid #fca5a5;color:#ef4444;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:500">\u5220\u9664</button>';
      cards += '</div></div></div>';
    });
  }
  cards += '</div>';

  var batchBar = '';
  if (_subSelected.size > 0) {
    batchBar += '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;padding:10px 16px;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;flex-wrap:wrap">';
    batchBar += '<span style="flex:1;font-size:.88rem;color:#b91c1c;font-weight:500">\u5df2\u9009 ' + _subSelected.size + ' \u9879</span>';
    batchBar += '<button onclick="_subBatchDel()" style="background:#ef4444;border:none;color:#fff;padding:7px 18px;border-radius:8px;cursor:pointer;font-size:.84rem;font-weight:600">\ud83d\uddd1\ufe0f \u6279\u91cf\u5220\u9664</button>';
    batchBar += '<button onclick="_subSelected.clear();rSubList()" style="background:var(--hov);border:1.5px solid var(--inp-bd);color:var(--text2);padding:7px 14px;border-radius:8px;cursor:pointer;font-size:.84rem">\u53d6\u6d88</button>';
    batchBar += '</div>';
  }

  list.innerHTML = toolbar + tbl + cards + batchBar;
}

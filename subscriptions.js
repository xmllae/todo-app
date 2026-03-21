let subscriptions = [];
let _subCycle = 'month';
var _subSearch = '';
var _subSort = 'days';
var _subBannerDismissed = false;
var _subMonthFilter = false;
var _subTabFilter = 'all'; // all | expired | soon | normal
var _subSelected = new Set();

(function(){
  if (document.getElementById('subShakeStyle')) return;
  var st = document.createElement('style');
  st.id = 'subShakeStyle';
  var css = '';
  css += '@keyframes subShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}';
  css += '.sub-shake{animation:subShake .5s ease infinite;}';
  css += '.sub-act-btns{opacity:0;transition:opacity .15s ease;display:flex;gap:5px;justify-content:center;align-items:center;}';
  css += '.sub-row:hover .sub-act-btns{opacity:1;}';
  css += '.sub-row{position:relative;overflow:visible;}';
  css += '.sub-renew-badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:.74rem;font-weight:600;}';
  css += '.sub-act-btns button{min-width:44px;overflow:visible;white-space:nowrap;}';
  css += '@keyframes subSlideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}';
  css += '.sub-batch-bar{animation:subSlideDown .18s ease;}';
  css += '.sub-tab{display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:none;background:transparent;cursor:pointer;font-size:.85rem;color:var(--text3);border-bottom:2px solid transparent;transition:all .15s;position:relative;font-family:inherit;}';
  css += '.sub-tab.active{color:#6366f1;font-weight:700;border-bottom-color:#6366f1;}';
  css += '.sub-tab:hover:not(.active){color:var(--text);}';
  css += '.sub-tab-badge{display:inline-block;min-width:16px;height:16px;border-radius:8px;background:#e0e7ff;color:#6366f1;font-size:.6rem;font-weight:700;text-align:center;line-height:16px;padding:0 4px;}';
  css += '.sub-tab.active .sub-tab-badge{background:#6366f1;color:#fff;}';
  css += '.sub-row-actions{display:none;}';
  css += '.sub-row-actions.open{display:flex!important;}';
  css += '.sub-tooltip-wrap .sub-tip{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#1e293b;color:#f1f5f9;font-size:.72rem;padding:5px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s;z-index:50;line-height:1.4;text-align:center;max-width:200px;white-space:normal;width:max-content;}';
  css += '.sub-tooltip-wrap:hover .sub-tip{opacity:1;}';
  css += '@media(max-width:640px){';
  css += '#subStats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;margin-bottom:12px!important;}';
  css += '.sub-stats-card{padding:12px!important;border-radius:10px!important;border-top:3px solid!important;}';
  css += '.sub-stats-card h4{font-size:.75rem!important;margin-bottom:4px!important;font-weight:600!important;opacity:.8;}';
  css += '.sub-stats-card .value{font-size:1.6rem!important;font-weight:700!important;}';
  css += '.sub-table-wrap{display:none!important;}';
  css += '.sub-card-list{display:flex!important;flex-direction:column;gap:8px;}';
  css += '.sub-toolbar{flex-direction:row!important;gap:6px!important;padding:8px 0!important;flex-wrap:wrap;align-items:center;}';
  css += '.sub-toolbar input{flex:1;min-width:150px;padding:7px 10px!important;font-size:.8rem!important;border-radius:8px!important;}';
  css += '.sub-toolbar select{flex:1;min-width:120px;padding:7px 10px!important;font-size:.8rem!important;border-radius:8px!important;}';
  css += '.sub-tab-bar{display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:10px;padding-bottom:2px;flex-wrap:nowrap;}';
  css += '.sub-tab{padding:6px 10px!important;font-size:.75rem!important;border-radius:6px!important;background:var(--hov);border:none!important;white-space:nowrap;flex-shrink:0;}';
  css += '.sub-tab.active{background:var(--acc);color:#fff!important;border-bottom:none!important;font-weight:700;}';
  css += '.sub-tab-badge{font-size:.6rem!important;min-width:16px!important;height:16px!important;line-height:16px!important;margin-left:2px;}';
  css += '.sub-card{padding:10px!important;border-radius:10px!important;margin-bottom:0;}';
  css += '.sub-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;}';
  css += '.sub-card-title{font-size:.9rem!important;font-weight:600!important;}';
  css += '.sub-card-days{font-size:.75rem!important;font-weight:700!important;}';
  css += '.sub-card-meta{font-size:.7rem!important;color:var(--text3);margin-bottom:6px;}';
  css += '.sub-card-actions{display:flex;gap:4px;flex-wrap:wrap;}';
  css += '.sub-card-actions button{padding:4px 8px!important;font-size:.7rem!important;border-radius:6px!important;}';
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
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">';
  h += '<h3 style="margin:0;font-size:1.1rem;font-weight:700"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:6px"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>\u8ba2\u9605\u7ba1\u7406</h3>';
  h += '<button onclick="openSubModal()" style="background:var(--acc);border:none;color:#fff;padding:8px 16px;border-radius:10px;cursor:pointer;font-size:.85rem;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(99,102,241,0.3);transition:all 150ms ease" onmouseenter="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 12px rgba(99,102,241,0.4)\'" onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'0 2px 8px rgba(99,102,241,0.3)\'">+ \u6dfb\u52a0</button>';
  h += '</div>';
  h += '<div id="subStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px"></div>';
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
function _subSetTab(v) { _subTabFilter = v; rSubList(); }

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
  if (typeof save === 'function') save();
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
  if (typeof save === 'function') save();
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

  function mk(bg, topColor, svgIcon, label, val, clickFn, isActive, tip) {
    var h = '';
    var extra = clickFn ? 'cursor:pointer;' : '';
    var border = isActive ? 'box-shadow:0 0 0 2.5px ' + topColor + ';' : '';
    h += '<div class="sub-tooltip-wrap" onclick="' + (clickFn||'') + '" style="background:' + bg + ';border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:visible;position:relative;' + extra + border + 'transition:box-shadow .15s">';
    h += '<div style="height:3px;background:' + topColor + ';border-radius:3px 3px 0 0;position:absolute;top:0;left:0;right:0"></div>';
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;margin-top:4px">';
    h += '<span style="color:' + topColor + ';flex-shrink:0">' + svgIcon + '</span>';
    h += '<span style="font-size:.78rem;color:var(--text3);font-weight:600">' + label + '</span>';
    h += '</div>';
    h += '<div style="font-size:32px;font-weight:700;color:' + topColor + ';line-height:1">' + val + '</div>';
    if (tip) h += '<div class="sub-tip">' + tip + '</div>';
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
    mk('#EEF0FF','#6366f1', calSvg, '\u8ba2\u9605\u603b\u6570', total, '', false, '\u5f53\u524d\u5171 ' + total + ' \u6761\u8ba2\u9605\u8bb0\u5f55') +
    mk('#FFF4EC','#f97316', bellSvg, '\u672c\u6708\u5230\u671f', thisMonth, '_subToggleMonthFilter()', _subMonthFilter, '\u672c\u6708\u5171 ' + thisMonth + ' \u6761\u8ba2\u9605\u5373\u5c06\u6216\u5df2\u5230\u671f\uff0c\u70b9\u51fb\u7b5b\u9009') +
    mk('#F0FFF4', monthCostColor, coinSvg, '\u6708\u5747\u82b1\u8d39', monthCost > 0 ? '\u00a5' + monthCost.toFixed(2) : '\u2014\u2014', '', false, '\u6240\u6709\u4ed8\u8d39\u8ba2\u9605\u8d39\u7528\u4e4b\u548c \u00f7 \u8ba2\u9605\u6570') +
    mk('#EEF6FF', yearCostColor, chartSvg, '\u5e74\u5ea6\u82b1\u8d39', yearCost > 0 ? '\u00a5' + yearCost.toFixed(2) : '\u2014\u2014', '', false, '\u6708\u5747\u82b1\u8d39 \u00d7 12\uff0c\u514d\u8d39\u8ba2\u9605\u4e0d\u8ba1\u5165');

  var banner = document.getElementById('subBanner');
  var _shouldShow = typeof _subAlertShouldShow === 'function' ? _subAlertShouldShow() : !_subBannerDismissed;
  if (banner && !_shouldShow) { banner.innerHTML = ''; }
  if (banner && _shouldShow) {
    var expiring = subscriptions.filter(function(s){ return calcDaysLeft(s.expireDate) <= 7; });
    if (expiring.length) {
      var today = new Date(); today.setHours(0,0,0,0);
      var bnames = expiring.map(function(s){
        var ed = new Date(s.expireDate); ed.setHours(0,0,0,0);
        var diff = Math.ceil((ed-today)/864e5);
        var dateLabel = diff === 0 ? '<strong style="color:#ea580c">\u4eca\u5929</strong>' : (ed.getMonth()+1) + '-' + String(ed.getDate()).padStart(2,'0');
        return '<span onclick="_subHighlightRow('+s.id+')" style="cursor:pointer;text-decoration:underline;color:#92400e;font-weight:700">'+esc(s.name)+'\uff08'+dateLabel+'\uff09</span>';
      }).join('\u3001');
      var bh = '';
      bh += '<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px">';
      bh += '<span style="flex-shrink:0">\u26a0\ufe0f</span>';
      bh += '<span style="flex:1;font-size:.88rem;color:#92400e"><strong>\u5373\u5c06\u5230\u671f\uff1a</strong> ' + bnames + ' \u2014 \u8bf7\u53ca\u65f6\u5904\u7406</span>';
      bh += '<button onclick="_subAlertDismiss&&_subAlertDismiss();_subBannerDismissed=true;document.getElementById(\'subBanner\').innerHTML=\'\'" style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:#92400e;flex-shrink:0">\u00d7</button>';
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
  var COL = '26% 14% 10% 10% 10% 10% 20%';

  var toolbar = '';
  // Tab counts
  var _allSubs = subscriptions.slice();
  if (_subMonthFilter){var _mn=new Date();_allSubs=_allSubs.filter(function(s){var d=new Date(s.expireDate);return d.getMonth()===_mn.getMonth()&&d.getFullYear()===_mn.getFullYear();});}
  var cntAll=_allSubs.length,cntExp=0,cntSoon=0,cntNorm=0;
  _allSubs.forEach(function(s){var d=calcDaysLeft(s.expireDate);if(d<=0)cntExp++;else if(d<=7)cntSoon++;else cntNorm++;});
  // Batch bar rendered inside table after header row
  // Tabs
  toolbar+='<div style="display:flex;border-bottom:1.5px solid var(--task-bd);margin-bottom:10px">';
  var tabs=[['all','\u5168\u90e8',cntAll],['expired','\u5df2\u5230\u671f',cntExp],['soon','\u5373\u5c06\u5230\u671f',cntSoon],['normal','\u6b63\u5e38',cntNorm]];
  tabs.forEach(function(t){toolbar+='<button class="sub-tab' + (t[0]===_subTabFilter?' active':'') + '" onclick="_subSetTab(\''+t[0]+'\')"\u003e'+t[1]+' <span class="sub-tab-badge">'+t[2]+'</span></button>';});
  toolbar+='</div>';
  // Search + sort
  toolbar+='<div class="sub-toolbar" style="display:flex;gap:12px;margin-bottom:12px;align-items:center;width:100%">';
  toolbar += '<div style="position:relative;flex:1;min-width:0">';
  toolbar += '<input type="text" id="subSearchInp" placeholder="\u641c\u7d22\u8ba2\u9605\u2026" value="' + esc(_subSearch) + '" oninput="_subSetSearch(this.value);var c=document.getElementById(\'subSearchClear\');if(c)c.style.display=this.value?\'flex\':\'none\';" style="width:100%;border:1.5px solid var(--inp-bd);border-radius:9px;padding:8px 32px 8px 12px;font-size:.88rem;color:var(--text);background:var(--inp-bg);outline:0;box-sizing:border-box">';
  toolbar += '<span id="subSearchClear" onclick="document.getElementById(\'subSearchInp\').value=\'\';_subSetSearch(\'\');this.style.display=\'none\';" style="display:' + (_subSearch ? 'flex' : 'none') + ';position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3);width:18px;height:18px;align-items:center;justify-content:center;font-size:.8rem;border-radius:50%;background:var(--hov)">\u00d7</span>';
  toolbar += '</div>';
  toolbar += '<select onchange="_subSetSort(this.value)" style="width:180px;flex-shrink:0;border:1.5px solid var(--inp-bd);border-radius:9px;padding:8px 10px;font-size:.85rem;color:var(--text2);background:var(--inp-bg);outline:0;cursor:pointer">';
  toolbar += '<option value="days"' + (_subSort==='days'?' selected':'') + '>\u6309\u5269\u4f59\u5929\u6570\uff08\u5347\u5e8f\uff09</option>';
  toolbar += '<option value="days_desc"' + (_subSort==='days_desc'?' selected':'') + '>\u6309\u5269\u4f59\u5929\u6570\uff08\u964d\u5e8f\uff09</option>';
  toolbar += '<option value="expire"' + (_subSort==='expire'?' selected':'') + '>\u6309\u5230\u671f\u65e5\u671f</option>';
  toolbar += '<option value="cost"' + (_subSort==='cost'?' selected':'') + '>\u6309\u8d39\u7528\u9ad8\u4f4e</option>';
  toolbar += '<option value="name"' + (_subSort==='name'?' selected':'') + '>\u6309\u540d\u79f0 A-Z</option>';
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
  if (_subTabFilter === 'expired') filtered = filtered.filter(function(s){ return calcDaysLeft(s.expireDate) <= 0; });
  else if (_subTabFilter === 'soon') filtered = filtered.filter(function(s){ var d=calcDaysLeft(s.expireDate); return d>0&&d<=7; });
  else if (_subTabFilter === 'normal') filtered = filtered.filter(function(s){ return calcDaysLeft(s.expireDate) > 7; });
  if (_subSearch) {
    var q = _subSearch.toLowerCase();
    filtered = filtered.filter(function(s){ return s.name.toLowerCase().indexOf(q) >= 0; });
  }
  filtered.sort(function(a, b) {
    if (_subSort === 'name') return (a.name||'').localeCompare(b.name||'');
    if (_subSort === 'cost') return (+b.cost||0) - (+a.cost||0);
    if (_subSort === 'days_desc') return calcDaysLeft(b.expireDate) - calcDaysLeft(a.expireDate);
    if (_subSort === 'expire') return new Date(a.expireDate) - new Date(b.expireDate);
    return calcDaysLeft(a.expireDate) - calcDaysLeft(b.expireDate);
  });

  var tbl = '';
  tbl += '<div class="sub-table-wrap" style="border:1.5px solid var(--task-bd);border-radius:14px;overflow:hidden">';
  tbl += '<div style="display:grid;grid-template-columns:' + COL + ';align-items:center;padding:0 14px;min-height:42px;background:var(--hov);font-size:.77rem;font-weight:600;color:var(--text3)">';
  tbl += '<div style="display:flex;align-items:center;gap:8px">' + (filtered.length ? '<label style="display:inline-flex;align-items:center;cursor:pointer;min-width:20px;min-height:20px;flex-shrink:0"><input type="checkbox" id="subHdrCb" onclick="_subToggleAll(this.checked)" style="cursor:pointer;width:16px;height:16px;accent-color:#6366f1"></label>' : '') + '\u670d\u52a1\u540d\u79f0</div>';
  tbl += '<div style="text-align:center">\u5230\u671f\u65e5\u671f</div>';
  tbl += '<div style="text-align:center">\u5269\u4f59\u5929\u6570</div>';
  tbl += '<div style="text-align:center">\u5468\u671f</div>';
  tbl += '<div style="text-align:center">\u8d39\u7528</div>';
  tbl += '<div style="text-align:center">\u7eed\u671f</div>';
  tbl += '<div style="text-align:center">\u64cd\u4f5c</div>';
  tbl += '</div>';
  // Batch bar inside table, below header
  if (_subSelected.size > 0) {
    tbl += '<div class="sub-batch-bar" style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#eef2ff;border-bottom:1.5px solid #c7d2fe;flex-wrap:wrap">';
    tbl += '<span style="flex:1;font-size:.85rem;color:#4338ca;font-weight:600">\u5df2\u9009 ' + _subSelected.size + ' \u9879</span>';
    tbl += '<button onclick="_subBatchDel()" style="background:#ef4444;border:none;color:#fff;padding:5px 12px;border-radius:7px;cursor:pointer;font-size:.8rem;font-weight:600">\u6279\u91cf\u5220\u9664</button>';
    tbl += '<button onclick="_subBatchRenew()" style="background:#3b82f6;border:none;color:#fff;padding:5px 12px;border-radius:7px;cursor:pointer;font-size:.8rem;font-weight:600">\u6279\u91cf\u7eed\u671f</button>';
    tbl += '<button onclick="_subSelected.clear();rSubList()" style="background:transparent;border:1.5px solid #a5b4fc;color:#4338ca;padding:5px 10px;border-radius:7px;cursor:pointer;font-size:.8rem">\u53d6\u6d88\u9009\u62e9</button>';
    tbl += '</div>';
  }

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
      var rowBg = sel ? 'background:rgba(99,102,241,.07);' : (dl <= 0 ? 'background:rgba(239,68,68,.06);' : (dl <= 7 ? 'background:rgba(249,115,22,.06);' : ''));
      var costDisp = (+s.cost) > 0 ? '<span style="font-size:.86rem;font-weight:600;color:var(--text)">\u00a5' + (+s.cost).toFixed(2) + '</span>' : '<span style="color:#bbb">\u2014\u2014</span>';
      var dateDisp = s.expireDate + (s.expireTime ? ' <span style="font-size:12px;color:#94a3b8">' + s.expireTime + '</span>' : '');
      var alIcon = dl <= 0 ? '\u26a0\ufe0f ' : (dl <= 30 ? '\u26a0\ufe0f ' : '');
      var statusBadge = dl <= 0 ? '<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:.65rem;font-weight:700;background:#fef2f2;color:#ef4444;border:1px solid #fca5a5;margin-left:5px;vertical-align:middle;flex-shrink:0">\u5df2\u5230\u671f</span>' : (dl <= 7 ? '<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:.65rem;font-weight:700;background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;margin-left:5px;vertical-align:middle;flex-shrink:0">\u5373\u5c06\u5230\u671f</span>' : '');
      tbl += '<div class="sub-row" data-id="' + s.id + '" style="display:grid;grid-template-columns:' + COL + ';align-items:center;padding:0 14px;height:56px;' + bt + rowBg + '">';
      tbl += '<div style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden"><input type="checkbox" ' + (sel ? 'checked' : '') + ' onclick="event.stopPropagation();_subToggleOne(' + s.id + ',this.checked)" style="cursor:pointer;width:14px;height:14px;flex-shrink:0"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.9rem;font-weight:600;color:var(--text)">' + nm + '</span>' + statusBadge + '</div>';
      tbl += '<div style="text-align:center;font-size:.81rem;color:var(--text2);overflow:hidden;white-space:nowrap">' + dateDisp + '</div>';
      tbl += '<div style="text-align:center"><span class="' + (al ? 'sub-shake' : '') + '" style="display:inline-block;padding:2px 7px;border-radius:20px;background:' + c.bg + ';color:' + c.text + ';font-size:.77rem;font-weight:700;border:1px solid ' + c.border + '">' + alIcon + dl + '</span></div>';
      tbl += '<div style="text-align:center;font-size:.81rem;color:var(--text2)">' + _clb(s.cycle, s.customDays) + '</div>';
      tbl += '<div style="text-align:center">' + costDisp + '</div>';
      tbl += '<div style="text-align:center"><span class="sub-renew-badge" style="background:' + (s.renewal==='auto'?'#eff6ff':'#f0fdf4') + ';color:' + (s.renewal==='auto'?'#3b82f6':'#16a34a') + ';border:1px solid ' + (s.renewal==='auto'?'#bfdbfe':'#bbf7d0') + '">' + (s.renewal==='auto'?'\u81ea\u52a8':'\u624b\u52a8') + '</span></div>';
      tbl += '<div class="sub-act-btns" style="display:flex;gap:4px;justify-content:center;align-items:center">';
      tbl += '<button onclick="editSub(' + s.id + ')" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:3px 8px;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:500;white-space:nowrap">\u7f16\u8f91</button>';
      tbl += '<button onclick="_subRenewOne(' + s.id + ')" style="background:#eff6ff;border:1.5px solid #bfdbfe;color:#3b82f6;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:500;white-space:nowrap">\u7eed\u671f</button>';
      tbl += '<button onclick="delSub(' + s.id + ')" style="background:#fef2f2;border:1.5px solid #fca5a5;color:#ef4444;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:500;white-space:nowrap">\u5220\u9664</button>';
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
      var sel = _subSelected.has(s.id);
      var nm = (s.icon ? s.icon + ' ' : '') + esc(s.name);
      var cardBg = sel ? 'rgba(99,102,241,.07)' : (dl <= 0 ? 'rgba(239,68,68,.04)' : (dl <= 7 ? 'rgba(249,115,22,.04)' : 'var(--task-bg)'));
      var costDisp = (+s.cost) > 0 ? '\u00a5' + (+s.cost).toFixed(2) : '\u2014\u2014';
      var costColor = (+s.cost) > 0 ? 'color:var(--text);font-weight:600' : 'color:#bbb';
      var alIcon = dl <= 0 ? '\u26a0\ufe0f ' : (dl <= 30 ? '\u26a0\ufe0f ' : '');
      var statusBadge = dl <= 0
        ? '<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:.65rem;font-weight:700;background:#fef2f2;color:#ef4444;border:1px solid #fca5a5;margin-left:5px">\u5df2\u5230\u671f</span>'
        : (dl <= 7 ? '<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:.65rem;font-weight:700;background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;margin-left:5px">\u5373\u5c06\u5230\u671f</span>' : '');
      cards += '<div style="background:' + cardBg + ';border:1.5px solid var(--task-bd);border-radius:14px;padding:14px 16px;">';
      cards += '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">';
      cards += '<input type="checkbox" ' + (sel ? 'checked' : '') + ' onclick="_subToggleOne(' + s.id + ',this.checked)" style="margin-top:3px;cursor:pointer;width:15px;height:15px;flex-shrink:0">';
      cards += '<div style="flex:1;min-width:0">';
      cards += '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:4px"><span style="font-size:.95rem;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + nm + '</span>' + statusBadge + '</div>';
      cards += '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">';
      cards += '<span style="font-size:.78rem;color:var(--text3)">' + s.expireDate + (s.expireTime ? ' <span style="color:#94a3b8">' + s.expireTime + '</span>' : '') + '</span>';
      cards += '<span style="font-size:.78rem;color:var(--text3)">\u00b7 ' + _clb(s.cycle, s.customDays) + '</span>';
      cards += '<span style="font-size:.82rem;' + costColor + '">\u00b7 ' + costDisp + '</span>';
      cards += '</div></div>';
      cards += '<span class="' + (dl <= 7 ? 'sub-shake' : '') + '" style="display:inline-block;padding:2px 9px;border-radius:20px;background:' + c.bg + ';color:' + c.text + ';font-size:.77rem;font-weight:700;border:1px solid ' + c.border + '">' + alIcon + dl + '\u5929</span>';
      cards += '</div>';
      cards += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--task-bd)">';
      cards += '<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.74rem;font-weight:600;background:' + (s.renewal==='auto'?'#eff6ff':'#f0fdf4') + ';color:' + (s.renewal==='auto'?'#3b82f6':'#16a34a') + ';border:1px solid ' + (s.renewal==='auto'?'#bfdbfe':'#bbf7d0') + '">' + (s.renewal==='auto'?'\u81ea\u52a8\u7eed\u671f':'\u624b\u52a8\u7eed\u671f') + '</span>';
      cards += '<div style="display:flex;gap:6px">';
      cards += '<button onclick="editSub(' + s.id + ')" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:500">\u7f16\u8f91</button>';
      cards += '<button onclick="_subRenewOne(' + s.id + ')" style="background:#eff6ff;border:1.5px solid #bfdbfe;color:#3b82f6;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:500">\u7eed\u671f</button>';
      cards += '<button onclick="delSub(' + s.id + ')" style="background:#fef2f2;border:1.5px solid #fca5a5;color:#ef4444;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:500">\u5220\u9664</button>';
      cards += '</div></div></div>';
    });
  }
  cards += '</div>';

  list.innerHTML = toolbar + tbl + cards;
}

function _subRowClick(e, id) {
  // Close all other open panels
  document.querySelectorAll('.sub-row-actions.open').forEach(function(el){
    if (+el.getAttribute('data-for') !== id) { el.classList.remove('open'); el.style.display = 'none'; }
  });
  var panel = document.querySelector('.sub-row-actions[data-for="'+id+'"]');
  if (!panel) return;
  var isOpen = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  panel.style.display = isOpen ? 'none' : 'flex';
}

function _subRenewOne(id) {
  var s = subscriptions.find(function(x){return x.id===id;});
  if (!s) return;
  var base = new Date(s.expireDate);
  if (isNaN(base)) { toast('\u65e0\u6548\u5230\u671f\u65e5\u671f'); return; }
  if (s.cycle === 'month') base.setMonth(base.getMonth() + 1);
  else if (s.cycle === 'year') base.setFullYear(base.getFullYear() + 1);
  else if (s.cycle === 'quarter') base.setMonth(base.getMonth() + 3);
  else if (s.cycle === 'custom' && s.customDays) base.setDate(base.getDate() + (+s.customDays));
  else base.setMonth(base.getMonth() + 1);
  s.expireDate = base.toISOString().slice(0, 10);
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  if (typeof save === 'function') save();
  rSubscriptions();
  toast('\u2705 \u5df2\u7eed\u671f\uff1a' + esc(s.name));
}

function _subSyncHdrCb() {
  var hdrCb = document.getElementById('subHdrCb');
  if (!hdrCb) return;
  var rows = document.querySelectorAll('#subList .sub-row[data-id]');
  if (!rows.length) return;
  var selCount = 0;
  rows.forEach(function(r){ if(_subSelected.has(+r.getAttribute('data-id'))) selCount++; });
  if (selCount === 0) { hdrCb.checked = false; hdrCb.indeterminate = false; }
  else if (selCount === rows.length) { hdrCb.checked = true; hdrCb.indeterminate = false; }
  else { hdrCb.checked = false; hdrCb.indeterminate = true; }
}

function _subToggleOne(id, checked) {
  if (checked) _subSelected.add(id); else _subSelected.delete(id);
  var row = document.querySelector('#subList .sub-row[data-id="'+id+'"]');
  if (row) {
    var s = subscriptions.find(function(x){return x.id===id;});
    var dl = s ? calcDaysLeft(s.expireDate) : 99;
    var nat = dl<=0?'rgba(239,68,68,.06)':(dl<=7?'rgba(249,115,22,.06)':'');
    row.style.background = checked ? 'rgba(99,102,241,.07)' : nat;
    var cb = row.querySelector('input[type=checkbox]'); if(cb) cb.checked = checked;
  }
  _subSyncHdrCb();
  _subUpdateBatchBar();
}

function _subToggleAll(checked) {
  // Get all currently filtered row IDs from DOM
  var list = document.getElementById('subList');
  if (!list) return;
  var rows = list.querySelectorAll('.sub-row[data-id]');
  rows.forEach(function(row){
    var id = +row.getAttribute('data-id');
    if (checked) _subSelected.add(id); else _subSelected.delete(id);
  });
  // Update header checkbox visual state
  var hdrCb = document.getElementById('subHdrCb');
  if (hdrCb) { hdrCb.checked = checked; hdrCb.indeterminate = false; }
  // Update each row checkbox and background
  rows.forEach(function(row){
    var id = +row.getAttribute('data-id');
    var cb = row.querySelector('input[type=checkbox]'); if(cb) cb.checked = checked;
    var s = subscriptions.find(function(x){return x.id===id;});
    var dl = s ? calcDaysLeft(s.expireDate) : 99;
    var nat = dl<=0?'rgba(239,68,68,.06)':(dl<=7?'rgba(249,115,22,.06)':'');
    row.style.background = checked ? 'rgba(99,102,241,.07)' : nat;
  });
  // Update batch bar without full re-render to preserve checkbox state
  _subUpdateBatchBar();
}

function _subUpdateBatchBar() {
  var list = document.getElementById('subList');
  if (!list) return;
  var bar = list.querySelector('.sub-batch-bar');
  if (_subSelected.size > 0) {
    var html = '<span style="flex:1;font-size:.85rem;color:#4338ca;font-weight:600">\u5df2\u9009 '+_subSelected.size+' \u9879</span>';
    html += '<button onclick="_subBatchDel()" style="background:#ef4444;border:none;color:#fff;padding:5px 12px;border-radius:7px;cursor:pointer;font-size:.8rem;font-weight:600">\u6279\u91cf\u5220\u9664</button>';
    html += '<button onclick="_subBatchRenew()" style="background:#3b82f6;border:none;color:#fff;padding:5px 12px;border-radius:7px;cursor:pointer;font-size:.8rem;font-weight:600">\u6279\u91cf\u7eed\u671f</button>';
    html += '<button onclick="_subSelected.clear();_subUpdateBatchBar();rSubList()" style="background:transparent;border:1.5px solid #a5b4fc;color:#4338ca;padding:5px 10px;border-radius:7px;cursor:pointer;font-size:.8rem">\u53d6\u6d88\u9009\u62e9</button>';
    if (bar) {
      bar.innerHTML = html;
    } else {
      var newBar = document.createElement('div');
      newBar.className = 'sub-batch-bar';
      newBar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 14px;background:#eef2ff;border-bottom:1.5px solid #c7d2fe;flex-wrap:wrap';
      newBar.innerHTML = html;
      var wrap = list.querySelector('.sub-table-wrap');
      var hdrRow = wrap && wrap.querySelector('div');
      if (hdrRow) hdrRow.insertAdjacentElement('afterend', newBar);
    }
  } else {
    if (bar) bar.remove();
  }
}

function _subBatchDel() {
  if (_subSelected.size === 0) return;
  var names = subscriptions.filter(function(s){ return _subSelected.has(s.id); }).map(function(s){ return s.name; });
  if (!confirm('\u786e\u8ba4\u5220\u9664\u6240\u9009 ' + _subSelected.size + ' \u6761\u8ba2\u9605\uff1f\n' + names.join('\u3001'))) return;
  subscriptions = subscriptions.filter(function(s){ return !_subSelected.has(s.id); });
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  if (typeof save === 'function') save();
  _subSelected.clear();
  rSubscriptions();
  toast('\ud83d\uddd1\ufe0f \u5df2\u6279\u91cf\u5220\u9664');
}

function _subBatchRenew() {
  if (_subSelected.size === 0) return;
  var updated = 0;
  subscriptions.forEach(function(s) {
    if (!_subSelected.has(s.id)) return;
    var base = new Date(s.expireDate);
    if (isNaN(base)) return;
    if (s.cycle === 'month') base.setMonth(base.getMonth() + 1);
    else if (s.cycle === 'year') base.setFullYear(base.getFullYear() + 1);
    else if (s.cycle === 'quarter') base.setMonth(base.getMonth() + 3);
    else if (s.cycle === 'custom' && s.customDays) base.setDate(base.getDate() + (+s.customDays));
    else base.setMonth(base.getMonth() + 1);
    s.expireDate = base.toISOString().slice(0, 10);
    updated++;
  });
  localStorage.setItem('tuole_subs', JSON.stringify(subscriptions));
  if (typeof save === 'function') save();
  _subSelected.clear();
  rSubscriptions();
  toast('\u2705 \u5df2\u6279\u91cf\u7eed\u671f ' + updated + ' \u6761\u8ba2\u9605');
}

function _subHighlightRow(id) {
  var row = document.querySelector('.sub-row[data-id="'+id+'"]');
  if (!row) return;
  row.scrollIntoView({behavior:'smooth', block:'center'});
  var s = subscriptions.find(function(x){return x.id===id;});
  var dl = s ? calcDaysLeft(s.expireDate) : 99;
  var sel = _subSelected.has(id);
  var naturalBg = sel ? 'rgba(99,102,241,.07)' : (dl<=0?'rgba(239,68,68,.06)':(dl<=7?'rgba(249,115,22,.06)':''));
  row.style.transition = 'background .3s';
  row.style.background = 'rgba(251,191,36,.28)';
  setTimeout(function(){
    row.style.background = naturalBg;
  }, 1500);
}

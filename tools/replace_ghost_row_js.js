/**
 * Replace old ghost row JS functions with new ones.
 * Run: node tools/replace_ghost_row_js.js
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

const oldFns = [
  // 1. resetAddTaskFormOnly
  `function resetAddTaskFormOnly(){var _as=document.querySelector('.add-split');if(_as)_as.classList.remove('add-split-form-open');var w=document.getElementById('addEmbedWrap'),r=document.getElementById('addBoxRow2'),inp=document.getElementById('tIn'),tt=document.getElementById('tTime'),dur=document.getElementById('durIn'),ps=document.getElementById('pSel');if(inp)inp.value='';if(tt)tt.value='';if(dur)dur.value='';if(ps)ps.value='medium';if(r)r.classList.remove('expanded');if(w)w.classList.remove('add-embed-active');if(inp)try{inp.blur();}catch(e){}refreshAddEmbedPrioArc()}`,
  // 2. showAddTaskRow
  `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');var h=document.getElementById('addTaskInlineHold');if(h)h.classList.remove('hidden');var inp=document.getElementById('tIn'),tt=document.getElementById('tTime'),dur=document.getElementById('durIn'),ps=document.getElementById('pSel');if(inp)inp.value='';if(tt)tt.value='';if(dur)dur.value='';if(ps)ps.value='medium';var w=document.getElementById('addEmbedWrap'),r=document.getElementById('addBoxRow2');if(w)w.classList.add('add-embed-active');if(r)r.classList.add('expanded');refreshAddEmbedPrioArc();setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}`,
  // 3. hideAddTaskInline
  `function hideAddTaskInline(){var h=document.getElementById('addTaskInlineHold');if(h)h.classList.add('hidden');resetAddTaskFormOnly();}`,
  // 4. openAddTaskUI
  `function openAddTaskUI(){showAddTaskRow();}`,
  // 5. cancelAddTask
  `function cancelAddTask(){hideAddTaskInline()}`,
  // 6. addT (the full old function)
  `function addT(){const inp=document.getElementById('tIn'),txt=inp.value.trim();if(!txt)return;if(!T[sel])T[sel]=[];const dur=parseInt(document.getElementById('durIn').value)||0;T[sel].push(mkTask(txt,document.getElementById('pSel').value,document.getElementById('tTime').value,dur));inp.value='';document.getElementById('tTime').value='';document.getElementById('durIn').value='';rCal();rT();rTagDropdownContent();save();toast('✅ 已添加');hideAddTaskInline()}`,
];

const newFns = [
  // 1. ghost state vars + helpers
  `// Ghost row state
let ghostPriority = 'medium';
let ghostTime = '';
let ghostDuration = 0;

function toggleGhostPriority() {
  ghostPriority = ghostPriority === 'high' ? 'medium' : 'high';
  const btn = document.getElementById('tgPrioBtn');
  const label = document.getElementById('tgPrioLabel');
  const icon = document.getElementById('tgPrioIcon');
  if (!btn) return;
  if (ghostPriority === 'high') {
    btn.classList.add('tg-prio-high');
    label.textContent = '优先级 高';
    if (icon) icon.style.stroke = '#ef4444';
  } else {
    btn.classList.remove('tg-prio-high');
    label.textContent = '优先级 正常';
    if (icon) icon.style.stroke = 'currentColor';
  }
}

function openGhostTimePicker() {
  const label = document.getElementById('tgTimeLabel');
  if (!label) return;
  const t = prompt('输入执行时间 (HH:MM)：', ghostTime || '');
  if (t !== null && t !== '') {
    if (/^\\d{1,2}:\\d{2}$/.test(t)) {
      ghostTime = t;
      label.textContent = '执行时间 ' + t;
    } else {
      toast('⚠️ 时间格式错误，请输入 HH:MM');
    }
  }
}

function openGhostDurationPicker() {
  const t = prompt('输入预计耗时（分钟）：', ghostDuration > 0 ? String(ghostDuration) : '');
  if (t !== null && t !== '') {
    const n = parseInt(t);
    if (!isNaN(n) && n >= 0) {
      ghostDuration = n;
      toast('⏱ 预计耗时：' + (n > 0 ? fmtDs(n) : '未设置'));
    } else {
      toast('⚠️ 请输入有效的分钟数');
    }
  }
}

function resetGhostForm() {
  ghostPriority = 'medium';
  ghostTime = '';
  ghostDuration = 0;
  var inp = document.getElementById('tIn');
  if (inp) inp.value = '';
  var prioBtn = document.getElementById('tgPrioBtn');
  var prioLbl = document.getElementById('tgPrioLabel');
  var prioIcon = document.getElementById('tgPrioIcon');
  if (prioBtn) prioBtn.classList.remove('tg-prio-high');
  if (prioLbl) prioLbl.textContent = '优先级 正常';
  if (prioIcon) prioIcon.style.stroke = 'currentColor';
  var timeLbl = document.getElementById('tgTimeLabel');
  if (timeLbl) timeLbl.textContent = '执行时间 --:--';
  var _as = document.querySelector('.add-split');
  if (_as) _as.classList.remove('add-split-form-open');
  if (inp) { try { inp.blur(); } catch(e) {} }
}

function resetAddTaskFormOnly(){resetGhostForm()}`,
  // 2. showAddTaskRow
  `function showAddTaskRow(){closeAddSplitMenu();var _as=document.querySelector('.add-split');if(_as)_as.classList.add('add-split-form-open');var qib=document.getElementById('quickImportBox');if(qib)qib.classList.add('hidden');resetGhostForm();var inp=document.getElementById('tIn');setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},16.);}`,
  // 3. hideAddTaskInline (no longer needed, just calls reset)
  `function hideAddTaskInline(){resetGhostForm()}`,
  // 4. openAddTaskUI
  `function openAddTaskUI(){showAddTaskRow();}`,
  // 5. cancelAddTask
  `function cancelAddTask(){resetGhostForm();toast('已取消')}`,
  // 6. addT
  `function addT(){const inp=document.getElementById('tIn');if(!inp)return;const txt=inp.value.trim();if(!txt){toast('⚠️ 请输入任务名称');return;}if(!T[sel])T[sel]=[];T[sel].push(mkTask(txt,ghostPriority,ghostTime,ghostDuration));rCal();rT();rTagDropdownContent();save();toast('✅ 已添加');resetGhostForm();setTimeout(function(){try{if(inp)inp.focus();}catch(e){}},50.);}`,
];

let replaced = 0;
for (let i = 0; i < oldFns.length; i++) {
  if (s.includes(oldFns[i])) {
    s = s.replace(oldFns[i], newFns[i]);
    replaced++;
    console.log('Replaced:', i + 1);
  } else {
    console.warn('Not found:', i + 1, '-', oldFns[i].substring(0, 60));
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('Done. Replaced', replaced, '/', oldFns.length, 'functions.');

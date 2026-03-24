/**
 * Apply "tap to add task" UI to index.html (UTF-8 safe, single write).
 * Run from repo root: node tools/apply_add_task_feature.js
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// 1) HTML: add-embed block
const start =
  '<div class="add-embed-wrap"><div class="add-embed"><span class="add-embed-plus" aria-hidden="true">';
const end = '<div class="add-box-row2" id="addBoxRow2">';
const i0 = s.indexOf(start);
const i1 = s.indexOf(end, i0);
if (i0 < 0 || i1 < 0) {
  console.error('add-embed HTML markers not found');
  process.exit(1);
}
const newBlock =
  '<div class="add-embed-wrap" id="addEmbedWrap">' +
  '<button type="button" class="add-embed-trigger" id="addEmbedTrigger" onclick="openAddTaskUI()" aria-label="添加任务">' +
  '<span class="add-embed-plus" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>' +
  '<span class="add-embed-trigger-txt">点击添加任务…</span></button>' +
  '<div class="add-embed add-embed-editor">' +
  '<span class="add-embed-plus" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>' +
  '<input type="text" id="tIn" class="add-embed-input" placeholder="输入任务名称…" autocomplete="off" onkeydown="if(event.key===\'Enter\'){event.preventDefault();addT();}if(event.key===\'Escape\'){event.preventDefault();cancelAddTask();}">' +
  '<div class="add-embed-actions">' +
  '<button type="button" class="ae-add-btn" onclick="addT()">添加</button>' +
  '<button type="button" class="ae-cancel-btn" onclick="cancelAddTask()">取消</button>' +
  '</div></div>';
s = s.slice(0, i0) + newBlock + s.slice(i1);

// 2) CSS: replace hints block
const oldCss =
  '.add-embed-hints{display:flex;align-items:center;gap:5px;flex-shrink:0;margin-left:auto;padding-left:4px;opacity:0;transform:translateX(6px);transition:opacity .2s ease,transform .2s ease;pointer-events:none}.add-embed:hover .add-embed-hints,.add-embed:focus-within .add-embed-hints{opacity:1;transform:translateX(0)}.add-embed-hint{display:inline-flex;align-items:center;gap:3px;font-size:.65rem;font-weight:600;color:var(--acc);white-space:nowrap;padding:3px 8px;border-radius:8px;background:color-mix(in srgb,var(--acc-bg) 88%,var(--card));border:1px solid color-mix(in srgb,var(--acc-bd) 55%,transparent);line-height:1.2}.dark .add-embed-hint{background:color-mix(in srgb,var(--acc) 14%,transparent);color:var(--acc2);border-color:color-mix(in srgb,var(--acc2) 28%,transparent)}';
const newCss =
  '.add-embed-editor{display:none;flex-direction:row;align-items:center;gap:8px;padding:6px 8px 6px 17px;min-height:42px;background:transparent;border-bottom:1px solid var(--task-bd);border-left:none;box-sizing:border-box;transition:background .18s ease,box-shadow .18s ease}' +
  '.add-embed-wrap.add-embed-active .add-embed-editor{display:flex}' +
  '.add-embed-trigger{width:100%;display:flex;flex-direction:row;align-items:center;gap:8px;padding:6px 8px 6px 17px;min-height:42px;background:transparent;border:none;border-bottom:1px solid var(--task-bd);box-sizing:border-box;cursor:pointer;font:inherit;text-align:left;-webkit-tap-highlight-color:transparent;transition:background .18s ease}' +
  '.add-embed-wrap.add-embed-active .add-embed-trigger{display:none}' +
  '.add-embed-trigger:hover,.add-embed-trigger:focus-visible{background:color-mix(in srgb,var(--acc-bg) 40%,transparent);outline:none}' +
  '.dark .add-embed-trigger:hover,.dark .add-embed-trigger:focus-visible{background:color-mix(in srgb,var(--acc) 10%,transparent)}' +
  '.add-embed-trigger-txt{flex:1;min-width:0;font-size:.88rem;font-weight:600;color:var(--text3);letter-spacing:-.01em}' +
  '.add-embed-trigger:hover .add-embed-trigger-txt,.add-embed-trigger:focus-visible .add-embed-trigger-txt{color:var(--text2)}' +
  '.add-embed-trigger:hover .add-embed-plus,.add-embed-trigger:focus-visible .add-embed-plus{background:var(--acc);border-color:var(--acc);color:#fff;transform:scale(1.03)}' +
  '.add-embed-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:auto;padding-left:6px}' +
  '.ae-add-btn{border:none;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;padding:8px 18px;border-radius:999px;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap;box-shadow:0 2px 10px rgba(99,102,241,.35);transition:transform .15s ease,box-shadow .2s ease,opacity .2s;font-family:inherit;-webkit-tap-highlight-color:transparent}' +
  '.ae-add-btn:hover{opacity:.95;transform:translateY(-1px);box-shadow:0 4px 14px rgba(99,102,241,.4)}' +
  '.ae-add-btn:active{transform:translateY(0)}' +
  '.dark .ae-add-btn{box-shadow:0 2px 12px rgba(0,0,0,.35)}' +
  '.ae-cancel-btn{border:1.5px solid var(--task-bd);background:var(--hov);color:var(--text2);padding:7px 17px;border-radius:999px;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,color .15s;font-family:inherit;-webkit-tap-highlight-color:transparent}' +
  '.ae-cancel-btn:hover{background:var(--card);border-color:var(--inp-bd);color:var(--text)}' +
  '.add-embed-wrap:not(.add-embed-active) #addBoxRow2{max-height:0!important;opacity:0!important;margin-top:0!important;pointer-events:none}';
if (!s.includes(oldCss)) {
  console.error('CSS block (add-embed-hints) not found');
  process.exit(1);
}
s = s.replace(oldCss, newCss);

// 3) Remove orphaned .add-embed-hint .ae-kbd
s = s.replace(
  '.add-embed-hint .ae-kbd{font-size:.62rem;font-weight:700;opacity:.85;font-family:inherit}',
  ''
);

// 4) JS before addT
const addTNeedle = 'function addT(){const inp=document.getElementById(\'tIn\')';
const addTIdx = s.indexOf(addTNeedle);
if (addTIdx < 0) {
  console.error('function addT not found');
  process.exit(1);
}
const jsInsert =
  'function openAddTaskUI(){var w=document.getElementById(\'addEmbedWrap\'),r=document.getElementById(\'addBoxRow2\'),inp=document.getElementById(\'tIn\');if(!w||!inp)return;w.classList.add(\'add-embed-active\');if(r)r.classList.add(\'expanded\');setTimeout(function(){try{inp.focus();}catch(e){}},16);}\n' +
  'function cancelAddTask(){var w=document.getElementById(\'addEmbedWrap\'),r=document.getElementById(\'addBoxRow2\'),inp=document.getElementById(\'tIn\'),tt=document.getElementById(\'tTime\'),dur=document.getElementById(\'durIn\'),ps=document.getElementById(\'pSel\');if(inp)inp.value=\'\';if(tt)tt.value=\'\';if(dur)dur.value=\'\';if(ps)ps.value=\'medium\';if(r)r.classList.remove(\'expanded\');if(w)w.classList.remove(\'add-embed-active\');if(inp)try{inp.blur();}catch(e){}}\n';
s = s.slice(0, addTIdx) + jsInsert + s.slice(addTIdx);

// 5) focusout: remove add-embed-active (file may use CRLF)
const focusOld =
  '    if (!inAddBox && !tIn.value.trim()) {\r\n      row2.classList.remove(\'expanded\');\r\n    }';
const focusNew =
  '    if (!inAddBox && !tIn.value.trim()) {\r\n      row2.classList.remove(\'expanded\');\r\n      var wrap = document.getElementById(\'addEmbedWrap\');\r\n      if (wrap) wrap.classList.remove(\'add-embed-active\');\r\n    }';
if (!s.includes(focusOld)) {
  const focusOldLf =
    '    if (!inAddBox && !tIn.value.trim()) {\n      row2.classList.remove(\'expanded\');\n    }';
  const focusNewLf =
    '    if (!inAddBox && !tIn.value.trim()) {\n      row2.classList.remove(\'expanded\');\n      var wrap = document.getElementById(\'addEmbedWrap\');\n      if (wrap) wrap.classList.remove(\'add-embed-active\');\n    }';
  if (!s.includes(focusOldLf)) {
    console.error('focusout block not found');
    process.exit(1);
  }
  s = s.replace(focusOldLf, focusNewLf);
} else {
  s = s.replace(focusOld, focusNew);
}

fs.writeFileSync(file, s, 'utf8');
console.log('OK: apply_add_task_feature.js wrote index.html (UTF-8)');

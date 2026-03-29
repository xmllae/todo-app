/**
 * Replace the add-embed ghost row UI with the new TaskGhostRow UI.
 * Run: node tools/replace_ghost_row.js
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');

// Old block to replace: starts after </div> of batch-bar and ends before overdueArea
// The add-embed-wrap div starts right after the closing of batch-bar div
const markerOpen = '<div class="add-embed-wrap" id="addEmbedWrap">';
const markerClose = '<div id="overdueArea"></div>';

const i0 = s.indexOf(markerOpen);
const i1 = s.indexOf(markerClose, i0);

if (i0 < 0 || i1 < 0) {
  console.error('Could not find ghost row markers.');
  console.error('markerOpen found:', i0 >= 0);
  console.error('markerClose found:', i1 >= 0);
  process.exit(1);
}

// The new ghost row HTML
const newBlock = `<div class="task-ghost-wrap" id="taskGhostWrap"><div class="task-ghost-card"><div class="task-ghost-input-row"><div class="task-ghost-ck" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg></div><input type="text" id="tIn" class="task-ghost-input" placeholder="输入任务名称…" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();addT();}if(event.key==='Escape'){event.preventDefault();cancelAddTask();}"></div><div class="task-ghost-footer"><div class="task-ghost-attrs"><button type="button" class="task-ghost-attr-btn" id="tgTimeBtn" onclick="openGhostTimePicker()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span id="tgTimeLabel">执行时间 --:--</span></button><button type="button" class="task-ghost-attr-btn" id="tgPrioBtn" onclick="toggleGhostPriority()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="tgPrioIcon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span id="tgPrioLabel">优先级 正常</span></button><button type="button" class="task-ghost-attr-btn" onclick="openGhostDurationPicker()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>预计耗时</span></button></div><div class="task-ghost-actions"><button type="button" class="tg-cancel-btn" onclick="cancelAddTask()"><span class="tg-kbd">Esc</span>取消</button><button type="button" class="tg-save-btn" onclick="addT()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>保存</button></div></div></div></div>`;

s = s.slice(0, i0) + newBlock + s.slice(i1);

fs.writeFileSync(file, s, 'utf8');
console.log('OK: replaced ghost row UI');

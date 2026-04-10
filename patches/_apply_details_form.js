const fs = require('fs');
const path = 'd:/todo-app-main/index.html';
let s = fs.readFileSync(path, 'utf8');
const start = 'let noteS=`';
const end = 'let postponeS=`';
const i = s.indexOf(start);
const j = s.indexOf(end, i);
if (i < 0 || j < 0) {
  console.error('markers missing', i, j);
  process.exit(1);
}
const mid = `const _tp=t.priority||'normal';const _prioHi=_tp==='high';const _prioMid=_tp==='medium'||_tp==='normal';const _prioLo=_tp==='low';let detailsFormS=\`<div class="task-detail-card" onclick="event.stopPropagation()"><div class="task-detail-sect task-detail-sect--note"><div class="task-detail-hd">\${icSub}<span>备注</span></div><textarea class="task-detail-textarea" id="note_\${t.id}" placeholder="添加任务备注…" onblur="saveNote(\${t.id})">\${esc(t.note||'')}</textarea></div><div class="task-detail-split"><div class="task-detail-col"><div class="task-detail-hd">\${icTag}<span>标签</span></div><div class="task-detail-tags">\${customTags.map(tg=>{const on=(t.tags||[]).includes(tg.id);return\`<button type="button" class="task-detail-tag\${on?' task-detail-tag--on':''}" style="\${on?'background:color-mix(in srgb,'+tg.color+' 22%,var(--card));color:var(--text);border-color:color-mix(in srgb,'+tg.color+' 48%,var(--inp-bd))':'border:1.5px dashed var(--inp-bd);background:var(--card);color:var(--text3)'}" onclick="event.stopPropagation();toggleTaskTag(\${t.id},'\${tg.id}')">\${tg.name}</button>\`}).join('')}<button type="button" class="task-detail-tag-add" onclick="event.stopPropagation();navigate('/settings')" title="管理标签">+ 添加</button></div></div><div class="task-detail-col"><div class="task-detail-hd">\${icPrio}<span>优先级</span></div><div class="task-detail-prio-row"><button type="button" class="task-detail-prio-btn\${_prioHi?' task-detail-prio-btn--on task-detail-prio-btn--hi':''}" onclick="event.stopPropagation();setTaskPriorityFromPanel(\${t.id},'high')">高</button><button type="button" class="task-detail-prio-btn\${_prioMid?' task-detail-prio-btn--on task-detail-prio-btn--mid':''}" onclick="event.stopPropagation();setTaskPriorityFromPanel(\${t.id},'medium')">中</button><button type="button" class="task-detail-prio-btn\${_prioLo?' task-detail-prio-btn--on task-detail-prio-btn--lo':''}" onclick="event.stopPropagation();setTaskPriorityFromPanel(\${t.id},'low')">低</button></div></div></div><div class="task-detail-sect task-detail-sect--color"><div class="task-detail-hd">\${icPalette}<span>颜色标记</span></div><div class="task-detail-swatches"><button type="button" class="task-detail-swatch task-detail-swatch--clear\${!t.color?' task-detail-swatch--on':''}" title="无标记" aria-label="清除颜色" onclick="event.stopPropagation();setTaskColor(\${t.id},'')"></button>\${COLORS.slice(1,8).map(c=>\`<button type="button" class="task-detail-swatch\${t.color===c?' task-detail-swatch--on':''}" style="--td-sw:\${c}" onclick="event.stopPropagation();setTaskColor(\${t.id},'\${c}')" aria-label="颜色"></button>\`).join('')}</div></div></div>\`;let durS=\`<div class="task-detail-extras"><div class="exp-meta-row task-detail-dur-row"><div class="exp-meta-lbl">\${icClock}<span>耗时</span></div><div class="exp-meta-val exp-meta-val--dur"><input type="number" id="dur_\${t.id}" value="\${t.duration||''}" min="0" max="480" placeholder="0" onchange="saveDuration(\${t.id})"><span class="exp-unit">分钟</span></div></div></div>\`;`;

s = s.slice(0, i) + mid + s.slice(j);

const oldBundle = 'const detailsBundle=noteS+tagS+durS+colorS+prioS+postponeS+recurS+freezeS';
const newBundle = 'const detailsBundle=detailsFormS+durS+postponeS+recurS+freezeS';
if (!s.includes(oldBundle)) {
  console.error('detailsBundle pattern missing');
  process.exit(1);
}
s = s.split(oldBundle).join(newBundle);

fs.writeFileSync(path, s, 'utf8');
console.log('ok');

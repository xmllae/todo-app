// ????????????????????
function taskRowCornersHTML(){return '<div class="task-row-corners" aria-hidden="true"><div class="task-row-corner task-row-corner--tl"></div><div class="task-row-corner task-row-corner--tr"></div><div class="task-row-corner task-row-corner--bl"></div><div class="task-row-corner task-row-corner--br"></div></div>'}
function taskRowParseTimeMinutes(value){const m=String(value||"").trim().match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;const h=+m[1],mi=+m[2];if(h<0||h>23||mi<0||mi>59)return null;return h*60+mi}
function taskRowFormatTimeMinutes(total){const n=((Math.trunc(total)%1440)+1440)%1440;const h=Math.floor(n/60),m=n%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")}
function taskRowDurationMinutes(t){const n=parseInt(t&&t.duration,10);if(!Number.isFinite(n)||n<=0)return 0;return Math.min(1440,Math.trunc(n))}
function taskRowPlainTimeText(t,fallback){const raw=t&&t.planTime?String(t.planTime).trim():"";const start=raw?(typeof formatPlanTimeDisp==="function"?formatPlanTimeDisp(raw):raw):fallback;const startMin=taskRowParseTimeMinutes(raw);const dur=taskRowDurationMinutes(t);if(startMin===null||!dur)return start;const endTotal=startMin+dur;return start+" - "+taskRowFormatTimeMinutes(endTotal)+(endTotal>=1440?" \u6b21\u65e5":"")}
function taskRowTimePlainHtml(t,fallback,showTitle){const title=showTitle?' title="\u8ba1\u5212\u65f6\u95f4\uff08\u5728\u4efb\u52a1\u8be6\u60c5\u4e2d\u4fee\u6539\uff09"':"";return `<span class="time-plain time-disp task-time-range"${title}>${esc(taskRowPlainTimeText(t,fallback))}</span>`}
let _subtaskGeometryResizeBound=false;
let _subtaskGeometryResizeTimer=null;
function measureFirstVisibleCharCenterX(textEl){
if(!textEl)return null;
try{
const walker=document.createTreeWalker(textEl,NodeFilter.SHOW_TEXT,{acceptNode:function(node){return node&&node.nodeValue&&node.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});
const n=walker.nextNode();
if(n&&n.nodeValue){
const i=n.nodeValue.search(/\S/);
if(i>=0){
const r=document.createRange();
r.setStart(n,i);
r.setEnd(n,Math.min(i+1,n.nodeValue.length));
const rect=r.getBoundingClientRect();
if(rect&&rect.width>0)return rect.left+rect.width/2
}
}
}catch(e){}
const fallbackRect=textEl.getBoundingClientRect();
if(!fallbackRect||fallbackRect.width<=0)return null;
const half=Math.min(10,Math.max(4,fallbackRect.width*.5));
return fallbackRect.left+half
}
function syncSubtaskGeometry(){
const root=document.getElementById("tList");
if(!root)return;
const blocks=root.querySelectorAll(".task-item .task-exp-sub-bg");
if(!blocks.length)return;
blocks.forEach(function(block){
const item=block.closest(".task-item");
if(!item)return;
const blockRect=block.getBoundingClientRect();
if(!blockRect||blockRect.width<=0)return;
const mainRingSlot=item.querySelector(".task-row > .task-ck-slot");
if(mainRingSlot){
const ringRect=mainRingSlot.getBoundingClientRect();
if(ringRect&&ringRect.width>0){
const ringCenterX=ringRect.left+ringRect.width/2;
const guideX=Math.max(-96,Math.min(blockRect.width+96,ringCenterX-blockRect.left));
block.style.setProperty("--subtask-guide-x",guideX.toFixed(2)+"px")
}
}
const title=item.querySelector(".task-row-center > .txt-line .txt");
if(title){
const firstCharCenterAbs=measureFirstVisibleCharCenterX(title);
if(Number.isFinite(firstCharCenterAbs)){
const subRingX=Math.max(12,Math.min(blockRect.width-12,firstCharCenterAbs-blockRect.left));
block.style.setProperty("--subtask-ring-x",subRingX.toFixed(2)+"px")
}
}
})
}
function ensureSubtaskGeometryResizeSync(){
if(_subtaskGeometryResizeBound)return;
_subtaskGeometryResizeBound=true;
window.addEventListener("resize",function(){
if(_subtaskGeometryResizeTimer)clearTimeout(_subtaskGeometryResizeTimer);
_subtaskGeometryResizeTimer=setTimeout(function(){_subtaskGeometryResizeTimer=null;syncSubtaskGeometry()},80)
})
}
const subtaskStrikeStateByTaskId=new Map();
const completedSubtaskCollapseStateById=new Map();
const SUBTASK_COMPLETED_COLLAPSE_LS_KEY="tuole_subtasks_completed_collapsed_v1";
const todoSubtaskCollapseStateById=new Map();
const SUBTASK_TODO_COLLAPSE_LS_KEY="tuole_subtasks_todo_collapsed_v1";
let _subtaskCompletedCollapseHydrated=false;
let _subtaskTodoCollapseHydrated=false;
function hydrateCompletedSubtaskCollapseState(){
if(_subtaskCompletedCollapseHydrated)return;
_subtaskCompletedCollapseHydrated=true;
try{
const raw=localStorage.getItem(SUBTASK_COMPLETED_COLLAPSE_LS_KEY);
if(!raw)return;
const data=JSON.parse(raw);
if(Array.isArray(data)){
// Backward compatibility: old array means collapsed=true
data.forEach(function(id){if(id!=null)completedSubtaskCollapseStateById.set(+id,true)});
return;
}
if(!data||typeof data!=="object")return;
Object.keys(data).forEach(function(id){
const v=data[id];
if(v===true||v===false)completedSubtaskCollapseStateById.set(+id,!!v)
});
}catch(e){}
}
function persistCompletedSubtaskCollapseState(){
try{
const obj={};
completedSubtaskCollapseStateById.forEach(function(v,k){obj[String(k)]=!!v});
localStorage.setItem(SUBTASK_COMPLETED_COLLAPSE_LS_KEY,JSON.stringify(obj));
}catch(e){}
}
function shouldCollapseCompletedSubtasks(taskId,doneCount,totalCount){
if(doneCount<=0||totalCount<=0)return false;
const id=+taskId;
if(completedSubtaskCollapseStateById.has(id))return !!completedSubtaskCollapseStateById.get(id);
return false
}
function toggleCompletedSubtasksCollapse(taskId){
if(taskId==null)return;
const id=+taskId;
const current=shouldCollapseCompletedSubtasks(id,1,1);
completedSubtaskCollapseStateById.set(id,!current);
persistCompletedSubtaskCollapseState();
rT()
}
function hydrateTodoSubtaskCollapseState(){
if(_subtaskTodoCollapseHydrated)return;
_subtaskTodoCollapseHydrated=true;
try{
const raw=localStorage.getItem(SUBTASK_TODO_COLLAPSE_LS_KEY);
if(!raw)return;
const data=JSON.parse(raw);
if(!data||typeof data!=="object")return;
Object.keys(data).forEach(function(id){
const v=data[id];
if(v===true||v===false)todoSubtaskCollapseStateById.set(+id,!!v)
});
}catch(e){}
}
function persistTodoSubtaskCollapseState(){
try{
const obj={};
todoSubtaskCollapseStateById.forEach(function(v,k){obj[String(k)]=!!v});
localStorage.setItem(SUBTASK_TODO_COLLAPSE_LS_KEY,JSON.stringify(obj));
}catch(e){}
}
function shouldCollapseTodoSubtasks(taskId,todoCount){
if(todoCount<=5)return false;
const id=+taskId;
if(todoSubtaskCollapseStateById.has(id))return !!todoSubtaskCollapseStateById.get(id);
return true
}
function toggleTodoSubtasksCollapse(taskId){
if(taskId==null)return;
const id=+taskId;
const current=shouldCollapseTodoSubtasks(id,6);
todoSubtaskCollapseStateById.set(id,!current);
persistTodoSubtaskCollapseState();
rT()
}
function subtaskStrikeShouldAnimate(taskId,hasSubtasks,isAllDone){const key=String(taskId);if(!hasSubtasks){subtaskStrikeStateByTaskId.delete(key);return false}const prev=subtaskStrikeStateByTaskId.has(key)?subtaskStrikeStateByTaskId.get(key):null;const next=!!isAllDone;subtaskStrikeStateByTaskId.set(key,next);return prev===false&&next===true}
function taskHTML(t,isArchived){
const pt=t.planTime||"";
const subs=t.subtasks||[];
const subD=subs.filter(s=>s.done).length;
const subT=subs.length;
const subTodo=subT-subD;
const subAllDone=subT===0||subD===subT;
const subPillAllDone=subT>0&&subD===subT;
const subStrikeAnimate=subtaskStrikeShouldAnimate(t.id,subT>0,subPillAllDone);
const collapseCompletedRows=shouldCollapseCompletedSubtasks(t.id,subD,subT);
const collapseTodoRows=shouldCollapseTodoSubtasks(t.id,subTodo);
const hasRecur=t.recurRuleId;
const showSubtasksByDefault=t.showSubtasksByDefault!==false;
const collapsedByUser=!!(collapsedSubtaskIds&&collapsedSubtaskIds.has&&collapsedSubtaskIds.has(t.id));
const isExp=(expandedId===t.id||showSubtasksByDefault&&subT>0)&&!collapsedByUser;
const taskMoreOpen=taskMoreMenuId===t.id;
const SVG_TM_ELL='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
const borderColor=t.frozen?"#38bdf8":isArchived?"#94a3b8":t.color||prioColor(t.priority);
const frozenCls=t.frozen?" frozen-item":"";
const prioHighRowCls=!t.frozen&&!isArchived&&(t.priority||"normal")==="high"?" task-prio-high":"";
const ftFocusCls=typeof _ftO!=="undefined"&&_ftO&&_ftO.task&&_ftO.task.d===sel&&+_ftO.task.id===+t.id?" ft-focus-task":"";
const ftAria=ftFocusCls?' aria-label="\u5f53\u524d\u4e13\u6ce8\u5173\u8054\u4efb\u52a1"':"";
const subTitleSuffix=subT>0?`<button type="button" class="sub-task-pill-btn sub-task-pill sub-task-pill--inline${subPillAllDone?" sub-task-pill--all-done":""}${isExp?" sub-task-pill--open":""}" title="\u5b50\u4efb\u52a1 ${subD}/${subT}" aria-expanded="${isExp?"true":"false"}" aria-label="\u5b50\u4efb\u52a1 ${subD}/${subT}" onclick="event.stopPropagation();toggleExpand(${t.id})">${subPillAllDone?`<span class="stp-strike-line" data-strike-animate="${subStrikeAnimate?"1":"0"}" aria-hidden="true"></span>`:""}<span class="stp-icon" aria-hidden="true"></span><span class="stp-n">${subD} / ${subT}</span></button>`:"";
const subTimeSep=subT>0?'<span class="task-time-sep" aria-hidden="true"></span>':"";
if(isArchived){
const accA=pt?taskTimeAccent(pt,sel):taskTimeAccent("",sel);
const archTimeInner=hasRecur?taskRowRecurTimeInnerHtml(t,pt):pt?`<span class="time-plain time-disp" style="opacity:.88">${pt}</span>`:`<span class="time-plain time-disp" style="opacity:.88">\u4eca\u5929</span>`;
const archTc=hasRecur?"var(--task-time-recur-fg)":accA.text;
const timeColArch=`<div class="task-time-col${subT>0?"":" task-time-col--no-sub"}" style="color:${archTc};--task-time-rail:${accA.rail}">${archTimeInner}${subTimeSep}${subTitleSuffix}</div>`;
return`<div class="task-item archived-item relative group" data-id="${t.id}" onclick="onTaskItemMultiBackdrop(event,${t.id})" style="--task-prio:${borderColor}"><div class="task-row">${taskRowCornersHTML()}${prioListRail(t,true)}<div class="task-rail" onclick="event.stopPropagation()"></div><div class="task-ck-slot" onclick="event.stopPropagation()">${taskListCkRing(t.id,true,t.priority,true,borderColor)}</div><div class="task-row-center" onclick="onTaskRowCenterClick(event,${t.id})"><div class="txt-line"><span class="txt">${esc(t.text)}</span></div>${timeColArch}</div><div class="task-actions" onclick="event.stopPropagation()"><button class="act-btn" onclick="event.stopPropagation();restoreArchived('${sel}',${t.id})" title="\u6062\u590d">↩</button></div></div></div>`
}
let timeH="";
let acc=taskTimeAccent("",sel);
if(editingTimeId===t.id){
const _teInp=`<input type="time" class="te-input te-input--pill" id="te_${t.id}" value="${pt}" onclick="event.stopPropagation()" onkeydown="if(event.key==='Enter'){event.preventDefault();saveTimeEdit(${t.id})}else if(event.key==='Escape'){event.preventDefault();cancelTimeEdit()}" title="Enter \u4fdd\u5b58 · \u5931\u7126\u4fdd\u5b58 · Esc \u53d6\u6d88" onblur="setTimeout(function(){if(editingTimeId===${t.id})saveTimeEdit(${t.id})},100)">`;
const _tePfx=hasRecur?`<span class="time-edit-pill-prefix">${esc(getRecurDesc(t.recurRuleId)||"\u91cd\u590d")}${pt?" ":""}</span>`:"";
const _teMid=hasRecur?`<span class="te-pill-time-core">${_tePfx}${_teInp}</span>`:_teInp;
timeH=`<div class="time-edit time-edit--inline time-edit--pill" onclick="event.stopPropagation()">${hasRecur?taskRecurRowBadgeSvg():""}${_teMid}<button type="button" class="te-pill-clock-btn" aria-label="\u9009\u62e9\u65f6\u95f4" title="\u9009\u62e9\u65f6\u95f4" onmousedown="event.preventDefault()" onclick="event.stopPropagation();openTimePillPicker(${t.id})"><svg class="te-pill-clock-ico" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button></div>`;
acc=pt?taskTimeAccent(pt,sel):taskTimeAccent("",sel)
}else if(hasRecur){
timeH=taskRowRecurTimeInnerHtml(t,pt);
acc=pt?taskTimeAccent(pt,sel):taskTimeAccent("",sel)
}else if(pt){
timeH=taskRowTimePlainHtml(t,pt);
acc=taskTimeAccent(pt,sel)
}else{
timeH=taskRowTimePlainHtml(t,"\u4eca\u5929",true);
acc=taskTimeAccent("",sel)
}
const tcColor=editingTimeId===t.id?acc.text:t.frozen?acc.text:hasRecur?"var(--task-time-recur-fg)":"var(--text3)";
const tcRail=editingTimeId===t.id?acc.rail:!t.frozen?"var(--task-bd)":acc.rail;
const timeColH=`<div class="task-time-col${subT>0?"":" task-time-col--no-sub"}${editingTimeId===t.id?" task-time-col--editing task-time-col--pill-edit":""}" style="color:${tcColor};--task-time-rail:${tcRail}">${timeH}${subTimeSep}${subTitleSuffix}</div>`;
let expandH="";
if(isExp&&subT>0){
let subRowsTodo=[];
let subRowsDone=[];
subs.forEach(s=>{
const subToggleAria=s.done?"\u53d6\u6d88\u5b50\u4efb\u52a1\u5b8c\u6210":"\u6807\u8bb0\u5b50\u4efb\u52a1\u5b8c\u6210";
const subStateH=s.done?'<span class="sub-state sub-state--done">\u5df2\u5b8c\u6210</span>':"";
if(editingSubId===s.id){
const rowEditing=`<div class="subtask-item subtask-item--editing"><button type="button" class="sub-ck ${s.done?"checked":""}" aria-label="${subToggleAria}" onclick="event.stopPropagation();toggleSubtask(${t.id},${s.id})"></button><input class="sub-text-edit" id="subEdit_${s.id}" value="${esc(s.text)}" onkeydown="if(event.key==='Enter')saveEditSub(${t.id},${s.id})" onblur="setTimeout(()=>saveEditSub(${t.id},${s.id}),120)"><div class="sub-tail"><button type="button" class="sub-del" title="\u5220\u9664\u5b50\u4efb\u52a1" aria-label="\u5220\u9664\u5b50\u4efb\u52a1" onclick="event.stopPropagation();deleteSubtask(${t.id},${s.id})">&times;</button></div></div>`;
if(s.done)subRowsDone.push(rowEditing);else subRowsTodo.push(rowEditing)
}else{
const rowNormal=`<div class="subtask-item${s.done?" subtask-item--done":""}" onclick="event.stopPropagation();toggleSubtask(${t.id},${s.id})"><button type="button" class="sub-ck ${s.done?"checked":""}" aria-label="${subToggleAria}" onclick="event.stopPropagation();toggleSubtask(${t.id},${s.id})"></button><div class="sub-main"><span class="sub-text ${s.done?"sub-done":""}" ondblclick="event.stopPropagation()">${esc(s.text)}</span></div><div class="sub-tail">${subStateH}<button type="button" class="sub-del" title="\u5220\u9664\u5b50\u4efb\u52a1" aria-label="\u5220\u9664\u5b50\u4efb\u52a1" onclick="event.stopPropagation();deleteSubtask(${t.id},${s.id})">&times;</button></div></div>`;
if(s.done)subRowsDone.push(rowNormal);else subRowsTodo.push(rowNormal)
}
});
const hasOverflowTodoRows=subTodo>5;
const todoVisibleRows=hasOverflowTodoRows?subRowsTodo.slice(0,5):subRowsTodo;
const todoOverflowRows=hasOverflowTodoRows?subRowsTodo.slice(5):[];
const todoRowsHtml=todoVisibleRows.join("");
const todoOverflowCount=todoOverflowRows.length;
const todoOverflowHtml=hasOverflowTodoRows&&todoOverflowCount>0?`<div class="subtask-todo-wrap${collapseTodoRows?" is-collapsed":""}">${todoOverflowRows.join("")}</div>`:"";
const todoHintAction=collapseTodoRows?`\u5c55\u5f00\u5269\u4f59 ${todoOverflowCount} \u4e2a`:`\u6536\u8d77\u989d\u5916 ${todoOverflowCount} \u4e2a`;
const todoExpandHint=hasOverflowTodoRows&&todoOverflowCount>0?`<button type="button" class="subtask-todo-expand-hint${collapseTodoRows?"":" is-open"}" onclick="event.stopPropagation();toggleTodoSubtasksCollapse(${t.id})"><span class="subtask-todo-expand-hint-arrow" aria-hidden="true"></span><span class="subtask-todo-expand-hint-main"><span class="subtask-todo-expand-hint-action">${todoHintAction}</span><span class="subtask-todo-expand-hint-sep" aria-hidden="true">|</span><span class="subtask-todo-expand-hint-target">\u672a\u5b8c\u6210\u4efb\u52a1</span></span></button>`:"";
const hasDoneRows=subD>0;
const doneRowsHtml=hasDoneRows?`<div class="subtask-completed-wrap${collapseCompletedRows?" is-collapsed":""}">${subRowsDone.join("")}</div>`:"";
const doneHiddenHint=hasDoneRows&&collapseCompletedRows?`<div class="subtask-completed-hidden-hint">\u5df2\u6709${subD}\u4e2a\u5b50\u4efb\u52a1\u5b8c\u6210\u540e\u88ab\u6298\u53e0</div>`:"";
expandH=`<div class="task-expand-area task-expand-area--tabbed task-expand-area--open"><div class="task-expand-drop"><div class="task-exp-sub-bg"><div class="exp-block exp-block--sub"><div class="subtask-list">${todoRowsHtml}${todoOverflowHtml}${todoExpandHint}${doneRowsHtml}${doneHiddenHint}</div></div></div></div></div>`}
return`<div class="task-item${t.done&&subAllDone?" done":""}${t.done?" task-main-checked task-row-done":""}${frozenCls}${prioHighRowCls}${ftFocusCls}${taskMoreOpen?" task-item--menu-open":""} relative group"${ftAria} data-id="${t.id}" onclick="onTaskItemMultiBackdrop(event,${t.id})" style="--task-prio:${borderColor}"><div class="task-row${prioListRowTierClass(t)}">${taskRowCornersHTML()}${prioListRail(t,false)}<div class="task-rail" onclick="event.stopPropagation()"><div class="drag-handle dh-head" onmousedown="sDrag(event,${t.id})" ontouchstart="sDrag(event,${t.id})" title="\u62d6\u52a8\u6392\u5e8f" onclick="event.stopPropagation()"></div>${multiSelect?`<div class="ms-ck${selectedIds.has(t.id)?" checked":""}" onclick="event.stopPropagation();toggleMSel(${t.id})">${selectedIds.has(t.id)?"&#10003;":""}</div>`:""}</div><div class="task-ck-slot" onclick="event.stopPropagation()">${taskListCkRing(t.id,taskRingAppearsDone(t),t.priority,false,borderColor)}</div><div class="task-strike-wrap" onclick="onTaskStrikeWrapPaddingClick(event,${t.id})"><div class="task-strike-content"><div class="task-row-center" onclick="onTaskRowCenterClick(event,${t.id})"><div class="txt-line"><span class="txt">${esc(t.text)}</span></div>${timeColH}</div></div></div><div class="task-actions" style="position:relative" onclick="event.stopPropagation()"><div class="task-more-wrap"><button type="button" class="act-btn task-more-btn${taskMoreOpen?" is-open":""}" title="\u66f4\u591a\u64cd\u4f5c" aria-label="\u66f4\u591a\u64cd\u4f5c" aria-expanded="${taskMoreOpen?"true":"false"}" aria-haspopup="true" onclick="event.stopPropagation();toggleTaskMoreMenu(${t.id})">${SVG_TM_ELL}</button></div><button type="button" class="act-btn del" title="\u5220\u9664" aria-label="\u5220\u9664" onclick="event.stopPropagation();del(${t.id})"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>${subT>0?`<div class="exp-bg-wrap">${expandH}</div>`:expandH}</div>`
}

function initTaskDashReorder(){var root=document.getElementById("taskDashCol");if(!root||root._dashReorderInit)return;root._dashReorderInit=1;function saveOrd(){var ids=[];root.querySelectorAll(".dash-card[data-dash-id]").forEach(function(c){ids.push(c.getAttribute("data-dash-id"))});try{localStorage.setItem("tuole_dash_order",JSON.stringify(ids))}catch(e){}}function applyOrd(){var cards=[].slice.call(root.querySelectorAll(".dash-card[data-dash-id]"));if(!cards.length)return;var map={};cards.forEach(function(c){map[c.getAttribute("data-dash-id")]=c});var def=cards.map(function(c){return c.getAttribute("data-dash-id")});var order;try{order=JSON.parse(localStorage.getItem("tuole_dash_order")||"null")}catch(e){order=null}if(!Array.isArray(order)||!order.length)return;var seen=new Set,merged=[];order.forEach(function(id){if(map[id]&&!seen.has(id)){seen.add(id);merged.push(id)}});def.forEach(function(id){if(!seen.has(id)){seen.add(id);merged.push(id)}});merged.forEach(function(id){var el=map[id];if(el)root.appendChild(el)})}applyOrd();var allowD=0,dragId=null;root.addEventListener("mousedown",function(e){allowD=e.target.closest(".dash-drag-handle")?1:0});root.addEventListener("mouseup",function(){allowD=0});[].forEach.call(root.querySelectorAll(".dash-card[data-dash-id]"),function(card){card.setAttribute("draggable","true");card.addEventListener("dragstart",function(e){if(!allowD){e.preventDefault();return}allowD=0;dragId=card.getAttribute("data-dash-id");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",dragId);card.classList.add("dash-dragging")});card.addEventListener("dragend",function(){card.classList.remove("dash-dragging");[].forEach.call(root.querySelectorAll(".dash-card.drag-dash-over"),function(c){c.classList.remove("drag-dash-over")});dragId=null});card.addEventListener("dragover",function(e){e.preventDefault();if(!dragId||dragId===card.getAttribute("data-dash-id"))return;e.dataTransfer.dropEffect="move";[].forEach.call(root.querySelectorAll(".dash-card.drag-dash-over"),function(c){c.classList.remove("drag-dash-over")});card.classList.add("drag-dash-over")});card.addEventListener("dragleave",function(e){if(!card.contains(e.relatedTarget))card.classList.remove("drag-dash-over")});card.addEventListener("drop",function(e){e.preventDefault();card.classList.remove("drag-dash-over");var fromId=e.dataTransfer.getData("text/plain"),toId=card.getAttribute("data-dash-id");if(!fromId||fromId===toId)return;var fromEl=root.querySelector('.dash-card[data-dash-id="'+fromId+'"]');if(!fromEl)return;var rect=card.getBoundingClientRect(),before=e.clientY<rect.top+rect.height/2;if(before)root.insertBefore(fromEl,card);else root.insertBefore(fromEl,card.nextSibling);saveOrd()})})}
function renderTaskDash(pct,totalForProg,doneForProg,nonArchived,fl,selStr){const root=document.getElementById("taskDashCol");if(!root)return;const p=selStr.split("-");const shortDate=`${+p[1]}月${+p[2]}日`;const sdEl=document.getElementById("dashShortDate");if(sdEl)sdEl.textContent=shortDate;const pctEl=document.getElementById("dashProgPct");if(pctEl)pctEl.textContent=pct+"%";const C=2*Math.PI*52;const ring=document.getElementById("dashRingProg");if(ring){ring.style.strokeDasharray=String(C);ring.style.strokeDashoffset=String(C*(1-pct/100))}const dEl=document.getElementById("dashDone"),tEl=document.getElementById("dashTotal");if(dEl)dEl.textContent=String(doneForProg);if(tEl)tEl.textContent=String(totalForProg);const hiP=nonArchived.filter(t=>t.priority==="high"),hiCol=typeof priorityColors!=="undefined"&&priorityColors.high||"#ef4444",hiN=hiP.length,hiDone=hiP.filter(t=>t.done).length;const elHi=document.getElementById("dashOvHiCnt");if(elHi)elHi.textContent=String(hiN);const bMain=document.getElementById("dashMainBar"),bHi=document.getElementById("dashOvHiBar");const mainW=totalForProg?Math.round(doneForProg/totalForProg*100):0;if(bMain)bMain.style.width=mainW+"%";const hiW=hiN?Math.round(hiDone/hiN*100):0;if(bHi)bHi.style.width=hiW+"%";const cardH=document.querySelector(".dash-ov-prio-card--high");if(cardH){cardH.style.setProperty("--ov-prio",hiCol);if(bHi)bHi.style.background=hiCol}const wdBase=parseDS(selStr);const mondayOff=wdBase.getDay()===0?-6:1-wdBase.getDay();const start=new Date(wdBase);start.setDate(wdBase.getDate()+mondayOff);const labels=["一","二","三","四","五","六","日"];const strip=document.getElementById("dashWeekStrip");const wtitle=document.getElementById("dashWeekTitle");if(wtitle)wtitle.textContent=wdBase.getFullYear()+"年"+(wdBase.getMonth()+1)+"月";if(strip){const todayStr=fd(now);let h="",wkTot=0,wkDone=0;for(let i=0;i<7;i++){const dd=new Date(start);dd.setDate(start.getDate()+i);const ds=fd(dd);const isWkSel=ds===selStr,isToday=ds===todayStr;let wcls="dash-wd"+(isWkSel?" dash-wd-sel":"")+(isToday?" dash-wd-today":"");const arr=T[ds]?T[ds].filter(function(x){return!x.archived}):[];const n=arr.length;if(n){wkTot+=n;wkDone+=arr.filter(function(x){return x.done}).length}let taskDot="";if(n){const allD=arr.every(function(x){return x.done});taskDot='<span class="dash-wd-dot dash-wd-dot--task'+(allD?" dash-wd-dot--done":"")+'" aria-hidden="true"></span>'}h+='<button type="button" class="'+wcls+'" onclick="pick(\''+ds+'\')"><span class="dash-wd-lab">'+labels[i]+'</span><span class="dash-wd-num">'+dd.getDate()+'</span><div class="dash-wd-dots" aria-hidden="true"><span class="dash-wd-dot dash-wd-dot--today"></span>'+taskDot+"</div></button>"}strip.innerHTML=h;const foot=document.getElementById("dashWeekFoot");if(foot){if(!wkTot)foot.innerHTML='<div class="dash-week-foot-inner dash-week-foot--empty">本周暂无任务</div>';else foot.innerHTML='<div class="dash-week-foot-inner"><div class="dwf-line"><span class="dwf-k">本周</span> <strong class="dwf-num">'+wkTot+'</strong><span class="dwf-u">项</span><span class="dwf-dotsep">·</span><span class="dwf-k">已完成</span> <strong class="dwf-num dwf-done">'+wkDone+'</strong><span class="dwf-dotsep">·</span><span class="dwf-k">待办</span> <strong class="dwf-num dwf-pend">'+(wkTot-wkDone)+"</strong></div></div>"}}}
var _ftInited=false,_ftIv=null,_ftO=null;
function focusTimerYesterday(){var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-1);return fd(d)}
function focusTimerDefaults(){return{F:25,S:5,L:15,mode:"focus",run:0,p:0,rem:1500,end:0,round:1,streak:0,lastDay:"",byDay:{},task:null}}
function focusTimerLoad(){var o=focusTimerDefaults();try{var j=JSON.parse(localStorage.getItem("tuole_focus_v2")||"{}");if(+j.F>0)o.F=+j.F;if(+j.S>0)o.S=+j.S;if(+j.L>0)o.L=+j.L;if(["focus","short","long"].indexOf(j.mode)>=0)o.mode=j.mode;if(j.run)o.run=1;if(j.p)o.p=1;if(+j.rem>=0)o.rem=+j.rem;if(+j.end>0)o.end=+j.end;if(+j.round>=1&&+j.round<=4)o.round=+j.round;if(+j.streak>=0)o.streak=+j.streak;if(j.lastDay)o.lastDay=j.lastDay;if(j.byDay&&typeof j.byDay==="object")o.byDay=j.byDay;if(j.task&&j.task.d)o.task=j.task}catch(e){}_ftO=o;if(_ftO.run&&!_ftO.p&&_ftO.end)_ftO.rem=Math.max(0,Math.ceil((_ftO.end-Date.now())/1e3));if(!_ftO.rem)_ftO.rem=focusTimerTotalSec()}
function focusTimerSave(){try{localStorage.setItem("tuole_focus_v2",JSON.stringify(_ftO))}catch(e){}}
function focusTimerTotalSec(){var o=_ftO;return o.mode==="focus"?o.F*60:o.mode==="short"?o.S*60:o.L*60}
function focusTimerSyncEnd(){if(!_ftO.run||_ftO.p||!_ftO.end)return;var x=Math.ceil((_ftO.end-Date.now())/1e3);if(x<0)x=0;_ftO.rem=x}
function focusTimerTick(){if(!document.getElementById("ftRingProg")||!_ftO)return;if(_ftO.run&&!_ftO.p&&_ftO.end){focusTimerSyncEnd();if(_ftO.rem<=0){_ftO.rem=0;focusTimerSave();focusTimerOnPhaseEnd()}else focusTimerPaint()}}
function focusTimerVis(){if(document.visibilityState==="visible"&&_ftO&&_ftO.run&&!_ftO.p)focusTimerSyncEnd();focusTimerPaint()}
function focusTimerAfterRender(){if(!document.getElementById("ftRingProg"))return;if(!_ftInited){_ftInited=true;focusTimerLoad();_ftIv=setInterval(focusTimerTick,1e3);document.addEventListener("visibilitychange",focusTimerVis)}focusTimerSyncTaskLabel();focusTimerPaint()}
function focusTimerSyncTaskLabel(){var el=document.getElementById("ftTaskLabel");if(!el)return;var tk=_ftO&&_ftO.task;if(!tk){el.textContent="+ 关联任务（可选）";return}var arr=typeof T!=="undefined"&&T[tk.d]||[],x=arr.find(function(q){return q.id===tk.id});el.textContent=x&&x.text?x.text:"+ 关联任务（可选）"}
function focusTimerUpdateTabLabels(){var f=document.getElementById("ftLabF"),s=document.getElementById("ftLabS"),l=document.getElementById("ftLabL");if(f)f.textContent=String(_ftO.F);if(s)s.textContent=String(_ftO.S);if(l)l.textContent=String(_ftO.L)}
function focusTimerUpdateTabs(){var m=_ftO.mode,f=document.getElementById("ftTabFocus"),a=document.getElementById("ftTabShort"),b=document.getElementById("ftTabLong");if(f)f.classList.toggle("active",m==="focus");if(a)a.classList.toggle("active",m==="short");if(b)b.classList.toggle("active",m==="long")}
function focusTimerPaintDots(){var el=document.getElementById("ftDots"),dm=document.getElementById("ftDotsMeta");if(!el)return;var h="",o=_ftO;for(var i=1;i<=4;i++){var c="ft-dot";if(i<o.round)c+=" on";else if(i===o.round)c+=" on cur";h+='<div class="'+c+'"></div>'}el.innerHTML=h;if(dm)dm.textContent=o.mode==="focus"?"第 "+o.round+" 个":o.mode==="short"?"短休息":"长休息"}
function focusTimerPaint(){if(!_ftO)return;focusTimerUpdateTabLabels();focusTimerUpdateTabs();var o=_ftO,te=document.getElementById("ftTimeDisp"),st=document.getElementById("ftStatusDisp"),pb=document.getElementById("ftPlayBtn"),ring=document.getElementById("ftRingProg");if(!te||!ring)return;var mx=Math.floor(o.rem/60),sx=o.rem%60;te.textContent=(mx<10?"0":"")+mx+":"+(sx<10?"0":"")+sx;var lab=o.mode==="focus"?"专注中":o.mode==="short"?"短休中":"长休中";if(!o.run)st.textContent="就绪";else if(o.p)st.textContent="已暂停";else st.textContent=lab;var pip=pb&&pb.querySelector(".ft-ico-play"),pau=pb&&pb.querySelector(".ft-ico-pause");if(pip&&pau){if(o.run&&!o.p){pip.classList.add("hidden");pau.classList.remove("hidden")}else{pau.classList.add("hidden");pip.classList.remove("hidden")}}if(pb)pb.classList.toggle("ft-running",!!(o.run&&!o.p));var tot=Math.max(1,focusTimerTotalSec()),C=2*Math.PI*52;ring.style.strokeDasharray=String(C);ring.style.strokeDashoffset=String(C*(1-Math.min(1,o.rem/tot)));var td=fd(now),rec=o.byDay[td]||{p:0,m:0},sp=document.getElementById("ftStatPomo"),sm=document.getElementById("ftStatMin"),ss=document.getElementById("ftStatStreak");if(sp)sp.textContent=String(rec.p||0);if(sm)sm.textContent=String(rec.m||0);if(ss)ss.textContent=String(o.streak||0);focusTimerPaintDots()}
function focusTimerRecordPomo(){var o=_ftO,td=fd(now),n=Math.round(o.F);if(!o.byDay[td])o.byDay[td]={p:0,m:0};o.byDay[td].p=(o.byDay[td].p||0)+1;o.byDay[td].m=(o.byDay[td].m||0)+n;var yd=focusTimerYesterday();if(o.lastDay!==td){if(o.lastDay===yd)o.streak=(o.streak||0)+1;else o.streak=1;o.lastDay=td}}
function focusTimerAdvance(donePomo){var o=_ftO;if(o.mode==="focus"){if(donePomo)focusTimerRecordPomo();if(o.round===4){o.mode="long";o.round=1}else{o.mode="short";o.round=o.round+1}}else{o.mode="focus"}o.rem=focusTimerTotalSec()}
function focusTimerOnPhaseEnd(){if(!_ftO)return;_ftO.run=0;_ftO.p=0;_ftO.end=0;focusTimerAdvance(true);focusTimerSave();toast("⏱ 时间到");focusTimerPaint()}
function focusTimerSetMode(m){if(!_ftO)focusTimerLoad();if(m===_ftO.mode)return;_ftO.mode=m;_ftO.run=0;_ftO.p=0;_ftO.end=0;_ftO.rem=focusTimerTotalSec();focusTimerSave();focusTimerPaint()}
function focusTimerTogglePlay(){if(!_ftO)focusTimerLoad();if(_ftO.run&&!_ftO.p){_ftO.p=1;focusTimerSyncEnd();_ftO.end=0;focusTimerSave();focusTimerPaint()}else{_ftO.run=1;_ftO.p=0;if(_ftO.rem<=0)_ftO.rem=focusTimerTotalSec();_ftO.end=Date.now()+_ftO.rem*1e3;focusTimerSave();focusTimerPaint()}}
function focusTimerReset(){if(!_ftO)return;_ftO.run=0;_ftO.p=0;_ftO.end=0;_ftO.rem=focusTimerTotalSec();focusTimerSave();focusTimerPaint()}
function focusTimerSkip(){if(!_ftO)return;_ftO.run=0;_ftO.p=0;_ftO.end=0;focusTimerAdvance(false);focusTimerSave();focusTimerPaint()}
function focusTimerToggleSettings(){var sv=document.getElementById("ftSettingsView"),tv=document.getElementById("ftTimerView");if(!sv||!tv||!_ftO)return;var show=sv.classList.contains("hidden");if(show){sv.classList.remove("hidden");tv.classList.add("hidden");var f=document.getElementById("ftInF"),s=document.getElementById("ftInS"),l=document.getElementById("ftInL");if(f)f.value=_ftO.F;if(s)s.value=_ftO.S;if(l)l.value=_ftO.L;var tx=document.querySelector("#dashFocusCard .dash-focus-set-txt");if(tx)tx.textContent="返回";var b=document.querySelector("#dashFocusCard .dash-focus-set");if(b)b.title="返回"}else{sv.classList.add("hidden");tv.classList.remove("hidden");var tx=document.querySelector("#dashFocusCard .dash-focus-set-txt");if(tx)tx.textContent="设置";var b=document.querySelector("#dashFocusCard .dash-focus-set");if(b)b.title="设置"}}
function focusTimerSaveSettings(){if(!_ftO)return;var a=+document.getElementById("ftInF").value,b=+document.getElementById("ftInS").value,c=+document.getElementById("ftInL").value;if(a>=1&&a<=180)_ftO.F=Math.round(a);if(b>=1&&b<=60)_ftO.S=Math.round(b);if(c>=1&&c<=90)_ftO.L=Math.round(c);_ftO.run=0;_ftO.p=0;_ftO.end=0;_ftO.rem=focusTimerTotalSec();var sv=document.getElementById("ftSettingsView"),tv=document.getElementById("ftTimerView");if(sv)sv.classList.add("hidden");if(tv)tv.classList.remove("hidden");var tx=document.querySelector("#dashFocusCard .dash-focus-set-txt");if(tx)tx.textContent="设置";var b=document.querySelector("#dashFocusCard .dash-focus-set");if(b)b.title="设置";focusTimerSave();focusTimerPaint();toast("⚙ 已保存")}
function focusTimerOpenTaskPick(){var day=fd(now),tasks=(T[day]||[]).filter(function(t){return!t.done&&!t.archived&&!t.frozen});var body=document.getElementById("mBody"),bg=document.getElementById("mBg");if(!body||!bg)return;var h;if(!tasks.length)h='<div class="m-sheet-wrap"><p class="m-sheet-title">今日无可用任务</p><button type="button" class="m-sheet-btn m-sheet-btn--accent" onclick="clM()">关闭</button></div>';else h='<div class="m-sheet-wrap"><p class="m-sheet-title">选择专注任务</p><div class="ft-pick-list">'+tasks.map(function(t){return'<button type="button" class="ft-pick-item" onclick="focusTimerPickTask(\''+day+"',"+t.id+')">'+esc(t.text)+"</button>"}).join("")+'</div><div class="ft-pick-actions"><button type="button" class="m-sheet-btn m-sheet-btn--ghost" onclick="clM()">取消</button><button type="button" class="m-sheet-btn ft-pick-deselect" onclick="focusTimerClearPick()">取消选择</button></div></div>';body.innerHTML=h;bg.classList.add("show")}
function focusTimerPickTask(d,id){if(!_ftO)focusTimerLoad();_ftO.task={d:d,id:+id};focusTimerSave();clM();rT()}
function focusTimerClearPick(){if(!_ftO)focusTimerLoad();_ftO.task=null;focusTimerSave();clM();rT()}
function setTaskBackTodayBtn(ds){
const nav=document.querySelector("#taskMode .task-main-col > .task-card > .date-nav");
if(!nav)return;
let btn=nav.querySelector(".date-nav-return-today");
if(!btn){
btn=document.createElement("button");
btn.type="button";
btn.className="date-nav-return-today";
btn.setAttribute("aria-label","\u56de\u5230\u4eca\u5929");
btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span class="date-nav-return-today-main">\u56de\u5230\u4eca\u5929</span><span class="date-nav-return-today-divider" aria-hidden="true"></span><span class="date-nav-return-today-meta" aria-hidden="true"></span>';
btn.onclick=function(e){e.stopPropagation();if(typeof goToday==="function")goToday();else if(typeof quickGo==="function")quickGo(0)}
}
const arrows=nav.querySelectorAll(".nav-arrow");
const right=arrows&&arrows.length>1?arrows[1]:null;
if(right){if(right.nextSibling)nav.insertBefore(btn,right.nextSibling);else nav.appendChild(btn)}
const show=ds!==fd(now);
const metaEl=btn.querySelector(".date-nav-return-today-meta");
if(metaEl){
metaEl.textContent="";
metaEl.setAttribute("aria-hidden","true")
}
const dividerEl=btn.querySelector(".date-nav-return-today-divider");
if(dividerEl)dividerEl.setAttribute("aria-hidden","true");
btn.classList.remove("has-range");
btn.classList.toggle("is-visible",show);
btn.setAttribute("aria-hidden",show?"false":"true");
btn.tabIndex=show?0:-1;
btn.setAttribute("aria-label","\u56de\u5230\u4eca\u5929")
}
function setTaskDateTitle(ds){
const el=document.getElementById("dTitle");
if(!el)return;
let mainEl=el.querySelector(".date-nav-date-main"),subEl=el.querySelector(".date-nav-date-sub");
if(!mainEl||!subEl){
el.innerHTML='<span class="date-nav-date-main"></span><span class="date-nav-date-sub"></span>';
mainEl=el.querySelector(".date-nav-date-main");
subEl=el.querySelector(".date-nav-date-sub")
}
mainEl.style.display="block";
mainEl.style.fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
mainEl.style.fontSize="24px";
mainEl.style.fontWeight="700";
mainEl.style.lineHeight="1";
mainEl.style.letterSpacing="-0.025em";
mainEl.style.color="#0f172a";
mainEl.style.margin="0 0 4px 0";
subEl.style.display="block";
subEl.style.fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
subEl.style.fontSize="13px";
subEl.style.fontWeight="500";
subEl.style.lineHeight="1.5";
subEl.style.letterSpacing="0.025em";
subEl.style.color="#64748b";
subEl.style.margin="0";
if(!el.dataset.animBound){
el.dataset.animBound="1";
el.addEventListener("animationend",function(){
el.classList.remove("is-animating");
el.classList.remove("is-animating-prev");
el.classList.remove("is-animating-next")
})
}
const text=String(disp(ds)||"");
const splitIdx=text.lastIndexOf(" ");
const dateText=splitIdx>0?text.slice(0,splitIdx):text;
const weekText=splitIdx>0?text.slice(splitIdx+1):"";
let dayOffset=99;
try{
const base=parseDS(fd(now)),target=parseDS(ds);
if(base&&target){
const baseDate=new Date(base.getFullYear(),base.getMonth(),base.getDate());
const targetDate=new Date(target.getFullYear(),target.getMonth(),target.getDate());
dayOffset=Math.round((targetDate-baseDate)/86400000)
}
}catch(e){}
const abs=Math.abs(dayOffset);
let relativeText="";
if(dayOffset===0)relativeText="\u4eca\u5929";
else if(dayOffset===1)relativeText="\u660e\u5929";
else if(dayOffset===2)relativeText="\u540e\u5929";
else if(dayOffset===-1)relativeText="\u6628\u5929";
else if(dayOffset===-2)relativeText="\u524d\u5929";
const useRangeOffset=abs>=3;
const useRelative=!useRangeOffset&&!!relativeText;
const rangeText=dayOffset>0?"\u672a\u6765"+abs+"\u5929":"\u8fc7\u53bb"+abs+"\u5929";
const mainText=useRangeOffset?rangeText:(useRelative?relativeText:dateText);
const subText=useRangeOffset?`${dateText}${weekText?" "+weekText:""}`:(useRelative?`${dateText}${weekText?" "+weekText:""}`:weekText);
const modeKey=useRangeOffset?"range":(useRelative?"r":"d");
const renderKey=`${ds}|${modeKey}|${mainText}|${subText}`;
const prevKey=el.dataset.renderKey||"";
const prevDs=el.dataset.lastDs||"";
const shouldUpdate=prevKey!==renderKey;
if(shouldUpdate){
mainEl.textContent=mainText;
subEl.textContent=subText;
el.classList.toggle("is-range-offset",useRangeOffset);
el.classList.toggle("is-relative",useRelative);
el.classList.toggle("is-plain-date",!useRangeOffset&&!useRelative);
subEl.classList.toggle("is-empty",!subText);
const shouldAnimate=!!prevDs&&prevDs!==ds;
el.classList.remove("is-animating");
el.classList.remove("is-animating-prev");
el.classList.remove("is-animating-next");
if(shouldAnimate){
let dirCls="";
try{
const prevDate=parseDS(prevDs),nextDate=parseDS(ds);
if(prevDate&&nextDate){
const prevTime=new Date(prevDate.getFullYear(),prevDate.getMonth(),prevDate.getDate()).getTime();
const nextTime=new Date(nextDate.getFullYear(),nextDate.getMonth(),nextDate.getDate()).getTime();
if(nextTime>prevTime)dirCls="is-animating-next";
else if(nextTime<prevTime)dirCls="is-animating-prev"
}
}catch(e){}
if(dirCls)el.classList.add(dirCls);
void el.offsetWidth;
el.classList.add("is-animating")
}
el.dataset.renderKey=renderKey;
el.dataset.lastDs=ds
}else{
// Keep stable when route changes but date content does not.
el.classList.remove("is-animating");
el.classList.remove("is-animating-prev");
el.classList.remove("is-animating-next");
el.classList.toggle("is-range-offset",useRangeOffset);
el.classList.toggle("is-relative",useRelative);
el.classList.toggle("is-plain-date",!useRangeOffset&&!useRelative);
if(subEl.classList.contains("is-empty")===!!subText)subEl.classList.toggle("is-empty",!subText)
}
setTaskBackTodayBtn(ds)
}
function animateSubtaskStrikeLines(){const root=document.getElementById("tList");if(!root)return;const lines=root.querySelectorAll('.stp-strike-line[data-strike-animate="1"]:not([data-strike-animated="1"])');if(!lines.length)return;lines.forEach(function(line){line.dataset.strikeAnimated="1";line.style.transition="none";line.style.transform="translateY(-50%) scaleX(0)";line.style.opacity=".36";line.setAttribute("data-strike-animate","0");void line.offsetWidth;line.style.transition="transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms cubic-bezier(0.22, 1, 0.36, 1)";line.style.transform="translateY(-50%) scaleX(1)";line.style.opacity=".50"})}
function rT(){if(_togPendingDoneId!=null){flushPendingTogIfAny();return}hydrateCompletedSubtaskCollapseState();hydrateTodoSubtaskCollapseState();hydrateSortModes();generateRecurring(sel);checkUnfreeze();const list=document.getElementById("tList");setTaskDateTitle(sel);updateHeaderContext();const dt=T[sel]||[];const nonArchived=dt.filter(t=>!t.archived);const archivedTasks=dt.filter(t=>t.archived);const pn=nonArchived.filter(t=>!t.done&&!t.frozen).length;const dn=nonArchived.filter(t=>t.done).length;const archDn=archivedTasks.length;const tot=nonArchived.length;document.getElementById("batchBar").style.display="flex";updateSortUI();renderOverdue();let fl=nonArchived.filter(t=>passesFMulti(t));if(FTag)fl=fl.filter(t=>(t.tags||[]).includes(FTag));let archVisible=[];if(showArchivedInList&&archivedTasks.length>0){let af=archivedTasks;if(FTag)af=af.filter(t=>(t.tags||[]).includes(FTag));archVisible=af}const totalForProg=tot+archDn;const doneForProg=dn+archDn;const pct=totalForProg>0?Math.round(doneForProg/totalForProg*100):0;let displayList=fl;let activeSortMode="";if(sortStates&&sortStates[sel])activeSortMode=normalizeSortMode(sortStates[sel]);else if(autoSortEnabled)activeSortMode=normalizeSortMode(defaultSortMode||lastSort||"created");if(activeSortMode&&displayList.length>1){displayList=sortDisplayList([...displayList],activeSortMode)}if(!displayList.length&&!archVisible.length){const isZero=tot===0&&archDn===0;list.innerHTML=`<div class="empty"><div class="em">🎉</div><p class="empty-main">${isZero?"今天任务已全部完成":"没有匹配的任务"}</p><p class="empty-sub">${isZero?"休息一下，或添加新任务":"试试其他筛选条件"}</p></div>`;renderTaskDash(pct,totalForProg,doneForProg,nonArchived,fl,sel);focusTimerAfterRender();return}let h=displayList.map(t=>taskHTML(t,false)).join("");if(archVisible.length>0)h+=archVisible.map(t=>taskHTML(t,true)).join("");list.innerHTML=h;ensureSubtaskGeometryResizeSync();syncSubtaskGeometry();requestAnimationFrame(syncSubtaskGeometry);animateSubtaskStrikeLines();renderTaskDash(pct,totalForProg,doneForProg,nonArchived,fl,sel);focusTimerAfterRender()}

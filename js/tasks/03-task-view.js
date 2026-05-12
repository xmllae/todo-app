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
const completedSubtaskCollapseStateById=new Map();
const SUBTASK_COMPLETED_COLLAPSE_LS_KEY="tuole_subtasks_completed_collapsed_v1";
const todoSubtaskCollapseStateById=new Map();
const SUBTASK_TODO_COLLAPSE_LS_KEY="tuole_subtasks_todo_collapsed_v1";
const TODO_SUBTASK_WRAP_OPEN_MS=320;
const TODO_SUBTASK_WRAP_CLOSE_MS=280;
const TODO_SUBTASK_WRAP_ROW_MS=220;
const TODO_SUBTASK_WRAP_EASE="cubic-bezier(.22, 1, .36, 1)";
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
function getTodoSubtaskMeta(taskId){
const t=(T[sel]||[]).find(function(x){return+x.id===+taskId});
if(!t)return null;
const subs=Array.isArray(t.subtasks)?t.subtasks:[];
const subDone=subs.reduce(function(n,s){return n+(s&&s.done?1:0)},0);
const subTodo=Math.max(0,subs.length-subDone);
return{subTodo:subTodo,overflowCount:Math.max(0,subTodo-5)}
}
function updateTodoExpandHintState(hint,overflowCount,isOpen){
if(!hint)return;
hint.classList.toggle("is-open",!!isOpen);
hint.setAttribute("aria-expanded",isOpen?"true":"false");
const action=hint.querySelector(".subtask-todo-expand-hint-action");
if(action)action.textContent=isOpen?"\u6536\u8d77\u989d\u5916 "+overflowCount+" \u4e2a":"\u5c55\u5f00\u5269\u4f59 "+overflowCount+" \u4e2a"
}
function cleanupTodoSubtaskWrapMotion(wrap){
if(!wrap)return;
if(wrap.__todoMotionAnim){
try{wrap.__todoMotionAnim.cancel()}catch(e){}
wrap.__todoMotionAnim=null
}
if(wrap.__todoRowAnims&&wrap.__todoRowAnims.length){
wrap.__todoRowAnims.forEach(function(anim){try{anim.cancel()}catch(e){}});
wrap.__todoRowAnims=[]
}
}
function syncTodoSubtaskGeometry(){
if(typeof syncSubtaskGeometry!=="function")return;
syncSubtaskGeometry();
requestAnimationFrame(syncSubtaskGeometry);
setTimeout(function(){if(typeof syncSubtaskGeometry==="function")syncSubtaskGeometry()},TODO_SUBTASK_WRAP_OPEN_MS+40)
}
function animateTodoSubtaskRows(wrap,isOpen,reduceMotion){
if(!wrap||reduceMotion)return;
const rows=[].slice.call(wrap.querySelectorAll(".subtask-item"));
if(!rows.length)return;
const baseDelay=isOpen?18:0;
wrap.__todoRowAnims=rows.map(function(row,idx){
const delay=Math.min(110,baseDelay+idx*22);
const keyframes=isOpen
?[{opacity:.18,transform:"translateY(-2px)"},{opacity:1,transform:"translateY(0)"}]
:[{opacity:1,transform:"translateY(0)"},{opacity:.14,transform:"translateY(-2px)"}];
try{
return row.animate(keyframes,{duration:TODO_SUBTASK_WRAP_ROW_MS,easing:TODO_SUBTASK_WRAP_EASE,delay:delay,fill:"both"})
}catch(e){
return null
}
}).filter(Boolean)
}
function setTodoSubtaskWrapOpenState(wrap,isOpen){
if(!wrap)return;
cleanupTodoSubtaskWrapMotion(wrap);
const reduceMotion=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const openDur=reduceMotion?170:TODO_SUBTASK_WRAP_OPEN_MS;
const closeDur=reduceMotion?150:TODO_SUBTASK_WRAP_CLOSE_MS;
wrap.style.overflow="hidden";
wrap.style.willChange="height, opacity, transform";
if(isOpen){
wrap.classList.remove("is-collapsed");
wrap.removeAttribute("aria-hidden");
const targetH=Math.max(1,Math.ceil(wrap.scrollHeight||0));
wrap.style.height="0px";
wrap.style.opacity="0";
wrap.style.transform="translateY(-4px)";
void wrap.offsetHeight;
try{
wrap.__todoMotionAnim=wrap.animate([
{height:"0px",opacity:0,transform:"translateY(-4px)"},
{height:targetH+"px",opacity:1,transform:"translateY(0)"}
],{duration:openDur,easing:TODO_SUBTASK_WRAP_EASE,fill:"forwards"});
}catch(e){
wrap.style.height=targetH+"px";
wrap.style.opacity="1";
wrap.style.transform="translateY(0)";
wrap.style.willChange="";
wrap.style.overflow="";
return
}
animateTodoSubtaskRows(wrap,true,reduceMotion);
wrap.__todoMotionAnim.onfinish=function(){
wrap.__todoMotionAnim=null;
wrap.style.height="auto";
wrap.style.opacity="1";
wrap.style.transform="";
wrap.style.willChange="";
wrap.style.overflow=""
};
wrap.__todoMotionAnim.oncancel=function(){
wrap.__todoMotionAnim=null
};
return
}
const startH=Math.max(1,Math.ceil(wrap.getBoundingClientRect().height||wrap.scrollHeight||0));
wrap.style.height=startH+"px";
wrap.style.opacity="1";
wrap.style.transform="translateY(0)";
void wrap.offsetHeight;
try{
wrap.__todoMotionAnim=wrap.animate([
{height:startH+"px",opacity:1,transform:"translateY(0)"},
{height:"0px",opacity:0,transform:"translateY(-3px)"}
],{duration:closeDur,easing:TODO_SUBTASK_WRAP_EASE,fill:"forwards"});
}catch(e){
wrap.classList.add("is-collapsed");
wrap.setAttribute("aria-hidden","true");
wrap.style.willChange="";
wrap.style.overflow="";
wrap.style.height="";
wrap.style.opacity="";
wrap.style.transform="";
return
}
animateTodoSubtaskRows(wrap,false,reduceMotion);
wrap.__todoMotionAnim.onfinish=function(){
wrap.__todoMotionAnim=null;
wrap.classList.add("is-collapsed");
wrap.setAttribute("aria-hidden","true");
wrap.style.willChange="";
wrap.style.overflow="";
wrap.style.height="";
wrap.style.opacity="";
wrap.style.transform=""
};
wrap.__todoMotionAnim.oncancel=function(){
wrap.__todoMotionAnim=null
}
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
const meta=getTodoSubtaskMeta(id);
if(!meta||meta.overflowCount<=0){rT();return}
const current=shouldCollapseTodoSubtasks(id,meta.subTodo);
const nextCollapsed=!current;
todoSubtaskCollapseStateById.set(id,nextCollapsed);
persistTodoSubtaskCollapseState();
const item=document.querySelector('#tList .task-item[data-id="'+id+'"]');
const wrap=item&&item.querySelector(".subtask-todo-wrap");
const hint=item&&item.querySelector(".subtask-todo-expand-hint");
if(!wrap||!hint){rT();return}
const nextOpen=!nextCollapsed;
updateTodoExpandHintState(hint,meta.overflowCount,nextOpen);
setTodoSubtaskWrapOpenState(wrap,nextOpen);
syncTodoSubtaskGeometry()
}
function taskExpandAreaHTML(t){
const subs=t.subtasks||[];
const subT=subs.length;
if(!subT)return"";
const subD=subs.filter(s=>s.done).length;
const subTodo=subT-subD;
const collapseCompletedRows=shouldCollapseCompletedSubtasks(t.id,subD,subT);
const collapseTodoRows=shouldCollapseTodoSubtasks(t.id,subTodo);
let subRowsTodo=[];
let subRowsDone=[];
subs.forEach(s=>{
const subToggleAria=s.done?"\u53d6\u6d88\u5b50\u4efb\u52a1\u5b8c\u6210":"\u6807\u8bb0\u5b50\u4efb\u52a1\u5b8c\u6210";
const subStateH=s.done?'<span class="sub-state sub-state--done">\u5df2\u5b8c\u6210</span>':"";
if(editingSubId===s.id){
const rowEditing=`<div class="subtask-item subtask-item--editing" data-sub-id="${s.id}"><button type="button" class="sub-ck ${s.done?"checked":""}" aria-label="${subToggleAria}" onclick="event.stopPropagation();toggleSubtask(${t.id},${s.id})"></button><input class="sub-text-edit" id="subEdit_${s.id}" value="${esc(s.text)}" onkeydown="if(event.key==='Enter')saveEditSub(${t.id},${s.id})" onblur="setTimeout(()=>saveEditSub(${t.id},${s.id}),120)"><div class="sub-tail"><button type="button" class="sub-del" title="\u5220\u9664\u5b50\u4efb\u52a1" aria-label="\u5220\u9664\u5b50\u4efb\u52a1" onclick="event.stopPropagation();deleteSubtask(${t.id},${s.id})">&times;</button></div></div>`;
if(s.done)subRowsDone.push(rowEditing);else subRowsTodo.push(rowEditing)
}else{
const rowNormal=`<div class="subtask-item${s.done?" subtask-item--done":""}" data-sub-id="${s.id}" onclick="event.stopPropagation();toggleSubtask(${t.id},${s.id})"><button type="button" class="sub-ck ${s.done?"checked":""}" aria-label="${subToggleAria}" onclick="event.stopPropagation();toggleSubtask(${t.id},${s.id})"></button><div class="sub-main"><span class="sub-text ${s.done?"sub-done":""}" ondblclick="event.stopPropagation()">${esc(s.text)}</span></div><div class="sub-tail">${subStateH}<button type="button" class="sub-del" title="\u5220\u9664\u5b50\u4efb\u52a1" aria-label="\u5220\u9664\u5b50\u4efb\u52a1" onclick="event.stopPropagation();deleteSubtask(${t.id},${s.id})">&times;</button></div></div>`;
if(s.done)subRowsDone.push(rowNormal);else subRowsTodo.push(rowNormal)
}
});
const hasOverflowTodoRows=subTodo>5;
const todoVisibleRows=hasOverflowTodoRows?subRowsTodo.slice(0,5):subRowsTodo;
const todoOverflowRows=hasOverflowTodoRows?subRowsTodo.slice(5):[];
const todoRowsHtml=todoVisibleRows.join("");
const todoOverflowCount=todoOverflowRows.length;
const todoOverflowHtml=hasOverflowTodoRows&&todoOverflowCount>0?`<div class="subtask-todo-wrap${collapseTodoRows?" is-collapsed":""}" aria-hidden="${collapseTodoRows?"true":"false"}">${todoOverflowRows.join("")}</div>`:"";
const todoHintAction=collapseTodoRows?`\u5c55\u5f00\u5269\u4f59 ${todoOverflowCount} \u4e2a`:`\u6536\u8d77\u989d\u5916 ${todoOverflowCount} \u4e2a`;
const todoExpandHint=hasOverflowTodoRows&&todoOverflowCount>0?`<button type="button" class="subtask-todo-expand-hint${collapseTodoRows?"":" is-open"}" aria-expanded="${collapseTodoRows?"false":"true"}" onclick="event.stopPropagation();toggleTodoSubtasksCollapse(${t.id})"><span class="subtask-todo-expand-hint-arrow" aria-hidden="true"></span><span class="subtask-todo-expand-hint-main"><span class="subtask-todo-expand-hint-action">${todoHintAction}</span><span class="subtask-todo-expand-hint-sep" aria-hidden="true">|</span><span class="subtask-todo-expand-hint-target">\u672a\u5b8c\u6210\u4efb\u52a1</span></span></button>`:"";
const hasDoneRows=subD>0;
const doneRowsHtml=hasDoneRows?`<div class="subtask-completed-wrap${collapseCompletedRows?" is-collapsed":""}">${subRowsDone.join("")}</div>`:"";
const doneHiddenHint=hasDoneRows&&collapseCompletedRows?`<div class="subtask-completed-hidden-hint">\u5df2\u6709 ${subD} \u4e2a\u5b50\u4efb\u52a1\u5b8c\u6210\u540e\u88ab\u6298\u53e0</div>`:"";
return`<div class="task-expand-area task-expand-area--tabbed task-expand-area--open"><div class="task-expand-drop"><div class="task-exp-sub-bg"><div class="exp-block exp-block--sub"><div class="subtask-list">${todoRowsHtml}${todoOverflowHtml}${todoExpandHint}${doneRowsHtml}${doneHiddenHint}</div></div></div></div></div>`
}
function taskHTML(t,isArchived){
const pt=t.planTime||"";
const subs=t.subtasks||[];
const subD=subs.filter(s=>s.done).length;
const subT=subs.length;
const subAllDone=subT===0||subD===subT;
const subPillAllDone=subT>0&&subD===subT;
const hasRecur=t.recurRuleId;
const showSubtasksByDefault=t.showSubtasksByDefault!==false;
const collapsedByUser=!!(collapsedSubtaskIds&&collapsedSubtaskIds.has&&collapsedSubtaskIds.has(t.id));
const isExp=(expandedId===t.id||showSubtasksByDefault&&subT>0)&&!collapsedByUser;
const subtaskOpenAnim=isExp&&typeof window!=="undefined"&&window._subtaskOpenAnimTaskId===t.id;
const taskMoreOpen=taskMoreMenuId===t.id;
const SVG_TM_ELL='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
const borderColor=t.frozen?"#38bdf8":isArchived?"#94a3b8":t.color||prioColor(t.priority);
const frozenCls=t.frozen?" frozen-item":"";
const prioHighRowCls=!t.frozen&&!isArchived&&(t.priority||"normal")==="high"?" task-prio-high":"";
const ftFocusCls=typeof _ftO!=="undefined"&&_ftO&&_ftO.task&&_ftO.task.d===sel&&+_ftO.task.id===+t.id?" ft-focus-task":"";
const ftAria=ftFocusCls?' aria-label="\u5f53\u524d\u4e13\u6ce8\u5173\u8054\u4efb\u52a1"':"";
const subTitleSuffix=subT>0?`<button type="button" class="sub-task-pill-btn sub-task-pill sub-task-pill--inline${subPillAllDone?" sub-task-pill--all-done":""}${isExp?" sub-task-pill--open":""}" title="\u5b50\u4efb\u52a1 ${subD}/${subT}" aria-expanded="${isExp?"true":"false"}" aria-label="\u5b50\u4efb\u52a1 ${subD}/${subT}" onclick="event.stopPropagation();toggleExpand(${t.id})"><span class="stp-icon" aria-hidden="true"></span><span class="stp-n">${subD} / ${subT}</span></button>`:"";
const subTimeSep=subT>0?'<span class="task-time-sep" aria-hidden="true"></span>':"";
if(isArchived){
const accA=pt?taskTimeAccent(pt,sel):taskTimeAccent("",sel);
const archTimeInner=hasRecur?taskRowRecurTimeInnerHtml(t,pt):pt?`<span class="time-plain time-disp" style="opacity:.88">${pt}</span>`:`<span class="time-plain time-disp" style="opacity:.88">\u5168\u5929</span>`;
const archTc=hasRecur?"var(--task-time-recur-fg)":accA.text;
const timeColArch=`<div class="task-time-col${subT>0?"":" task-time-col--no-sub"}" style="color:${archTc};--task-time-rail:${accA.rail}">${archTimeInner}${subTimeSep}${subTitleSuffix}</div>`;
return`<div class="task-item archived-item relative group" data-id="${t.id}" onclick="onTaskItemMultiBackdrop(event,${t.id})" style="--task-prio:${borderColor}"><div class="task-row">${taskRowCornersHTML()}${prioListRail(t,true)}<div class="task-rail" onclick="event.stopPropagation()"></div><div class="task-ck-slot" onclick="event.stopPropagation()">${taskListCkRing(t.id,true,t.priority,true,borderColor)}</div><div class="task-row-center" onclick="onTaskRowCenterClick(event,${t.id})"><div class="txt-line"><span class="txt">${esc(t.text)}</span></div>${timeColArch}</div><div class="task-actions" onclick="event.stopPropagation()"><button class="act-btn" onclick="event.stopPropagation();restoreArchived('${sel}',${t.id})" title="\u6062\u590d">鈫?/button></div></div></div>`
}
let timeH="";
let acc=taskTimeAccent("",sel);
if(editingTimeId===t.id){
const _teInp=`<input type="time" class="te-input te-input--pill" id="te_${t.id}" value="${pt}" onclick="event.stopPropagation()" onkeydown="if(event.key==='Enter'){event.preventDefault();saveTimeEdit(${t.id})}else if(event.key==='Escape'){event.preventDefault();cancelTimeEdit()}" title="Enter \u4fdd\u5b58 路 \u5931\u7126\u4fdd\u5b58 路 Esc \u53d6\u6d88" onblur="setTimeout(function(){if(editingTimeId===${t.id})saveTimeEdit(${t.id})},100)">`;
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
timeH=taskRowTimePlainHtml(t,"\u5168\u5929",true);
acc=taskTimeAccent("",sel)
}
const tcColor=editingTimeId===t.id?acc.text:t.frozen?acc.text:hasRecur?"var(--task-time-recur-fg)":"var(--text3)";
const tcRail=editingTimeId===t.id?acc.rail:!t.frozen?"var(--task-bd)":acc.rail;
const timeColH=`<div class="task-time-col${subT>0?"":" task-time-col--no-sub"}${editingTimeId===t.id?" task-time-col--editing task-time-col--pill-edit":""}" style="color:${tcColor};--task-time-rail:${tcRail}">${timeH}${subTimeSep}${subTitleSuffix}</div>`;
const expandH=isExp&&subT>0?taskExpandAreaHTML(t):"";
const expandWrapInlineStyle=isExp?' style="height:auto"':"";
return`<div class="task-item${t.done&&subAllDone?" done":""}${t.done?" task-main-checked task-row-done":""}${frozenCls}${prioHighRowCls}${ftFocusCls}${taskMoreOpen?" task-item--menu-open":""}${subT>0?" task-item--has-subtasks":""} relative group"${ftAria} data-id="${t.id}" onclick="onTaskItemMultiBackdrop(event,${t.id})" style="--task-prio:${borderColor}"><div class="task-row${prioListRowTierClass(t)}">${taskRowCornersHTML()}${prioListRail(t,false)}<div class="task-rail" onclick="event.stopPropagation()"><div class="drag-handle dh-head" onmousedown="sDrag(event,${t.id})" ontouchstart="sDrag(event,${t.id})" title="\u62d6\u52a8\u6392\u5e8f" onclick="event.stopPropagation()"></div>${multiSelect?`<div class="ms-ck${selectedIds.has(t.id)?" checked":""}" onclick="event.stopPropagation();toggleMSel(${t.id})">${selectedIds.has(t.id)?"&#10003;":""}</div>`:""}</div><div class="task-ck-slot" onclick="event.stopPropagation()">${taskListCkRing(t.id,taskRingAppearsDone(t),t.priority,false,borderColor)}</div><div class="task-strike-wrap" onclick="onTaskStrikeWrapPaddingClick(event,${t.id})"><div class="task-strike-content"><div class="task-row-center" onclick="onTaskRowCenterClick(event,${t.id})"><div class="txt-line"><span class="txt">${esc(t.text)}</span></div>${timeColH}</div></div></div><div class="task-actions" style="position:relative" onclick="event.stopPropagation()"><button type="button" class="act-btn task-detail-trigger" title="\u67e5\u770b\u8be6\u60c5" aria-label="\u67e5\u770b\u8be6\u60c5" aria-pressed="false" onclick="event.stopPropagation();openTaskDrawer(${t.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h10"/><path d="M9 12h10"/><path d="M9 18h6"/><path d="M5 6h.01"/><path d="M5 12h.01"/><path d="M5 18h.01"/></svg></button><div class="task-more-wrap"><button type="button" class="act-btn task-more-btn${taskMoreOpen?" is-open":""}" title="\u66f4\u591a\u64cd\u4f5c" aria-label="\u66f4\u591a\u64cd\u4f5c" aria-expanded="${taskMoreOpen?"true":"false"}" aria-haspopup="true" onclick="event.stopPropagation();toggleTaskMoreMenu(${t.id})">${SVG_TM_ELL}</button></div><button type="button" class="act-btn del" title="\u5220\u9664" aria-label="\u5220\u9664" onclick="event.stopPropagation();del(${t.id})"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>${subT>0?`<div class="exp-bg-wrap${isExp?" is-subtask-open":""}${subtaskOpenAnim?" is-subtask-opening":""}" aria-hidden="${isExp?"false":"true"}"${expandWrapInlineStyle}>${expandH}</div>`:expandH}</div>`
}

function initTaskDashReorder(){var root=document.getElementById("taskDashCol");if(!root||root._dashReorderInit)return;root._dashReorderInit=1;function saveOrd(){var ids=[];root.querySelectorAll(".dash-card[data-dash-id]").forEach(function(c){ids.push(c.getAttribute("data-dash-id"))});try{localStorage.setItem("tuole_dash_order",JSON.stringify(ids))}catch(e){}}function applyOrd(){var cards=[].slice.call(root.querySelectorAll(".dash-card[data-dash-id]"));if(!cards.length)return;var map={};cards.forEach(function(c){map[c.getAttribute("data-dash-id")]=c});var def=cards.map(function(c){return c.getAttribute("data-dash-id")});var order;try{order=JSON.parse(localStorage.getItem("tuole_dash_order")||"null")}catch(e){order=null}if(!Array.isArray(order)||!order.length)return;var seen=new Set,merged=[];order.forEach(function(id){if(map[id]&&!seen.has(id)){seen.add(id);merged.push(id)}});def.forEach(function(id){if(!seen.has(id)){seen.add(id);merged.push(id)}});merged.forEach(function(id){var el=map[id];if(el)root.appendChild(el)})}applyOrd();var allowD=0,dragId=null;root.addEventListener("mousedown",function(e){allowD=e.target.closest(".dash-drag-handle")?1:0});root.addEventListener("mouseup",function(){allowD=0});[].forEach.call(root.querySelectorAll(".dash-card[data-dash-id]"),function(card){card.setAttribute("draggable","true");card.addEventListener("dragstart",function(e){if(!allowD){e.preventDefault();return}allowD=0;dragId=card.getAttribute("data-dash-id");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",dragId);card.classList.add("dash-dragging")});card.addEventListener("dragend",function(){card.classList.remove("dash-dragging");[].forEach.call(root.querySelectorAll(".dash-card.drag-dash-over"),function(c){c.classList.remove("drag-dash-over")});dragId=null});card.addEventListener("dragover",function(e){e.preventDefault();if(!dragId||dragId===card.getAttribute("data-dash-id"))return;e.dataTransfer.dropEffect="move";[].forEach.call(root.querySelectorAll(".dash-card.drag-dash-over"),function(c){c.classList.remove("drag-dash-over")});card.classList.add("drag-dash-over")});card.addEventListener("dragleave",function(e){if(!card.contains(e.relatedTarget))card.classList.remove("drag-dash-over")});card.addEventListener("drop",function(e){e.preventDefault();card.classList.remove("drag-dash-over");var fromId=e.dataTransfer.getData("text/plain"),toId=card.getAttribute("data-dash-id");if(!fromId||fromId===toId)return;var fromEl=root.querySelector('.dash-card[data-dash-id="'+fromId+'"]');if(!fromEl)return;var rect=card.getBoundingClientRect(),before=e.clientY<rect.top+rect.height/2;if(before)root.insertBefore(fromEl,card);else root.insertBefore(fromEl,card.nextSibling);saveOrd()})})}
function renderTaskDash(pct,totalForProg,doneForProg,nonArchived,fl,selStr){const root=document.getElementById("taskDashCol");if(!root)return;const p=selStr.split("-");const shortDate=`${+p[1]}月${+p[2]}日`;const sdEl=document.getElementById("dashShortDate");if(sdEl)sdEl.textContent=shortDate;const pctEl=document.getElementById("dashProgPct");if(pctEl)pctEl.textContent=pct+"%";const C=2*Math.PI*52;const ring=document.getElementById("dashRingProg");if(ring){ring.style.strokeDasharray=String(C);ring.style.strokeDashoffset=String(C*(1-pct/100))}const dEl=document.getElementById("dashDone"),tEl=document.getElementById("dashTotal");if(dEl)dEl.textContent=String(doneForProg);if(tEl)tEl.textContent=String(totalForProg);const hiP=nonArchived.filter(t=>t.priority==="high"),hiCol=typeof priorityColors!=="undefined"&&priorityColors.high||"#ef4444",hiN=hiP.length,hiDone=hiP.filter(t=>t.done).length;const elHi=document.getElementById("dashOvHiCnt");if(elHi)elHi.textContent=String(hiN);const bMain=document.getElementById("dashMainBar"),bHi=document.getElementById("dashOvHiBar");const mainW=totalForProg?Math.round(doneForProg/totalForProg*100):0;if(bMain)bMain.style.width=mainW+"%";const hiW=hiN?Math.round(hiDone/hiN*100):0;if(bHi)bHi.style.width=hiW+"%";const cardH=document.querySelector(".dash-ov-prio-card--high");if(cardH){cardH.style.setProperty("--ov-prio",hiCol);if(bHi)bHi.style.background=hiCol}const wdBase=parseDS(selStr);const mondayOff=wdBase.getDay()===0?-6:1-wdBase.getDay();const start=new Date(wdBase);start.setDate(wdBase.getDate()+mondayOff);const labels=["一","二","三","四","五","六","日"];const strip=document.getElementById("dashWeekStrip");const wtitle=document.getElementById("dashWeekTitle");if(wtitle)wtitle.textContent=wdBase.getFullYear()+"年"+(wdBase.getMonth()+1)+"月";if(strip){const todayStr=fd(now);let h="",wkTot=0,wkDone=0;for(let i=0;i<7;i++){const dd=new Date(start);dd.setDate(start.getDate()+i);const ds=fd(dd);const isWkSel=ds===selStr,isToday=ds===todayStr;let wcls="dash-wd"+(isWkSel?" dash-wd-sel":"")+(isToday?" dash-wd-today":"");const arr=T[ds]?T[ds].filter(function(x){return!x.archived}):[];const n=arr.length;if(n){wkTot+=n;wkDone+=arr.filter(function(x){return x.done}).length}let taskDot="";if(n){const allD=arr.every(function(x){return x.done});taskDot='<span class="dash-wd-dot dash-wd-dot--task'+(allD?" dash-wd-dot--done":"")+'" aria-hidden="true"></span>'}h+='<button type="button" class="'+wcls+'" onclick="pick(\''+ds+'\')"><span class="dash-wd-lab">'+labels[i]+'</span><span class="dash-wd-num">'+dd.getDate()+'</span><div class="dash-wd-dots" aria-hidden="true"><span class="dash-wd-dot dash-wd-dot--today"></span>'+taskDot+"</div></button>"}strip.innerHTML=h;const foot=document.getElementById("dashWeekFoot");if(foot){if(!wkTot)foot.innerHTML='<div class="dash-week-foot-inner dash-week-foot--empty">本周暂无任务</div>';else foot.innerHTML='<div class="dash-week-foot-inner"><div class="dwf-line"><span class="dwf-k">本周</span> <strong class="dwf-num">'+wkTot+'</strong><span class="dwf-u">项</span><span class="dwf-dotsep">·</span><span class="dwf-k">已完成</span> <strong class="dwf-num dwf-done">'+wkDone+'</strong><span class="dwf-dotsep">·</span><span class="dwf-k">待办</span> <strong class="dwf-num dwf-pend">'+(wkTot-wkDone)+"</strong></div></div>"}}}
function ensureWeekTaskOverviewShell(root){
  if(!root)return null;
  let shell=root.querySelector(".week-action-shell");
  if(!shell){
    shell=document.createElement("section");
    shell.className="week-action-shell week-task-overview";
    shell.setAttribute("aria-label","本周任务概览");
    root.appendChild(shell)
  }
  return shell
}
function weekOverviewMonthDay(ds){
  const d=parseDS(ds);
  return d?(d.getMonth()+1)+"/"+d.getDate():""
}
function weekOverviewRhythmStatus(day){
  if(day.pending)return day.pending+" 待办";
  if(day.total)return"已清空";
  return"空闲"
}
function getWeekOverviewData(selStr){
  const meta=getTaskWeekMeta(selStr),weekNames=["一","二","三","四","五","六","日"],allRows=[];
  const dayStats=meta.days.map(function(ds,idx){
    const raw=(T[ds]||[]).filter(function(t){return!t.archived});
    raw.forEach(function(t){allRows.push({task:t,ds:ds,idx:idx})});
    const done=raw.filter(function(t){return t.done}).length,pending=raw.filter(function(t){return!t.done&&!t.frozen}).length,high=raw.filter(function(t){return t.priority==="high"}).length;
    return{ds:ds,idx:idx,label:"周"+weekNames[idx],dateText:weekOverviewMonthDay(ds),total:raw.length,done:done,pending:pending,high:high,isFocus:ds===selStr,isToday:ds===fd(now)}
  });
  return{meta:meta,weekNames:weekNames,allRows:allRows,dayStats:dayStats}
}
function renderWeekTaskOverviewSidebar(pct,totalForProg,doneForProg,selStr){
  const root=document.getElementById("taskDashCol"),shell=ensureWeekTaskOverviewShell(root);
  if(!root||!shell)return;
  const data=getWeekOverviewData(selStr),rangeText=getTaskWeekRangeText(data.meta),total=data.allRows.length,done=data.allRows.filter(function(row){return row.task.done}).length,pending=data.allRows.filter(function(row){return!row.task.done&&!row.task.frozen}).length;
  const highPending=data.allRows.filter(function(row){return row.task.priority==="high"&&!row.task.done&&!row.task.frozen}).length;
  const busyDay=data.dayStats.reduce(function(best,day){return day.pending>best.pending?day:best},data.dayStats[0]);
  const pendingDayCount=data.dayStats.filter(function(day){return day.pending>0}).length;
  const emptyDays=data.dayStats.filter(function(day){return!day.total}).length;
  const rhythmLead=pending?(pendingDayCount===1?"待办集中在"+busyDay.label+" · "+busyDay.pending+" 项":busyDay.label+"待办最多 · "+busyDay.pending+" 项"):done?"本周已清空 · "+done+" 项完成":"本周暂无任务";
  const rhythmActiveDays=data.dayStats.filter(function(day){return day.total>0});
  const rhythmRows=rhythmActiveDays.length?rhythmActiveDays.map(function(day){
    const status=weekOverviewRhythmStatus(day),progress=day.total?Math.round(day.done/day.total*100):0,load=progress?Math.max(8,progress):0,cls="week-rhythm-day"+(day.isToday?" is-today":"")+(day.isFocus?" is-focus":"")+(day.pending?" has-pending":day.total?" is-clear":" is-empty");
    return'<button type="button" class="'+cls+'" style="--rhythm-load:'+load+'%" onclick="jumpWeekDay(\''+day.ds+'\')" aria-label="定位到'+day.label+' '+day.dateText+'，'+status+'"><span class="week-rhythm-label"><span>'+day.label+'</span><small>'+day.dateText+'</small></span><span class="week-rhythm-track" aria-hidden="true"><span class="week-rhythm-load"></span></span><span class="week-rhythm-state">'+status+'</span></button>'
  }).join(""):'<div class="week-rhythm-empty">暂无任务安排</div>';
  const rhythmNote=emptyDays?'<div class="week-rhythm-note">其余 '+emptyDays+' 天空闲</div>':"";
  shell.innerHTML='<div class="week-overview-head"><span class="week-overview-kicker">任务概览</span><span class="week-overview-range">'+rangeText+'</span></div><div class="week-overview-score"><div class="week-overview-ring" style="--week-pct:'+pct+'"><span>'+pct+'%</span><em>完成度</em></div><div class="week-overview-score-main"><div class="week-overview-count"><strong>'+done+'</strong><span>/</span><strong>'+total+'</strong></div><p>周任务已完成</p><div class="week-overview-progress" style="--week-progress:'+pct+'%"><span></span></div></div></div><div class="week-overview-metrics"><div><b>'+total+'</b><span>全部</span></div><div><b>'+pending+'</b><span>待办</span></div><div><b>'+done+'</b><span>完成</span></div><div><b>'+highPending+'</b><span>高优先</span></div></div><div class="week-overview-section week-overview-section--rhythm"><div class="week-overview-section-title"><span>本周节奏</span><small class="week-rhythm-title-note">'+rhythmLead+'</small></div><div class="week-rhythm-list">'+rhythmRows+'</div>'+rhythmNote+'</div>'
}
const renderTaskDashLegacy=renderTaskDash;
renderTaskDash=function(pct,totalForProg,doneForProg,nonArchived,fl,selStr){
  const root=document.getElementById("taskDashCol");
  if(!root)return;
  if(getTaskQuickMode()==="week"){
    root.classList.add("is-week-action");
    root.setAttribute("aria-label","本周任务概览");
    renderWeekTaskOverviewSidebar(pct,totalForProg,doneForProg,selStr);
    return
  }
  root.classList.remove("is-week-action");
  root.setAttribute("aria-label","今日概览");
  return renderTaskDashLegacy(pct,totalForProg,doneForProg,nonArchived,fl,selStr)
};
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
btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span class="date-nav-return-today-main"></span><span class="date-nav-return-today-divider" aria-hidden="true"></span><span class="date-nav-return-today-meta" aria-hidden="true"></span>';
btn.onclick=function(e){e.stopPropagation();const weekMode=getTaskQuickMode()==="week";if(typeof goToday==="function")goToday(weekMode);else if(typeof quickGo==="function")quickGo(0)}
}
const arrows=nav.querySelectorAll(".nav-arrow");
const right=arrows&&arrows.length>1?arrows[1]:null;
if(right){if(right.nextSibling)nav.insertBefore(btn,right.nextSibling);else nav.appendChild(btn)}
const weekMode=getTaskQuickMode()==="week";
const backText=weekMode?"\u56de\u5230\u672c\u5468":"\u56de\u5230\u4eca\u5929";
const show=weekMode?getTaskWeekOffset(ds)!==0:ds!==fd(now);
const mainEl=btn.querySelector(".date-nav-return-today-main");
if(mainEl)mainEl.textContent=backText;
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
btn.setAttribute("aria-label",backText)
}
function getTaskQuickMode(){return typeof getGlobalSideNavQuickMode==="function"?getGlobalSideNavQuickMode():(window.__gsnQuickMode||"")}
function getTaskWeekMeta(ds){const base=parseDS(ds),start=new Date(base),diff=start.getDay()===0?-6:1-start.getDay();start.setDate(start.getDate()+diff);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+6);const days=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(fd(d))}return{start:start,end:end,days:days}}
function getTaskWeekRangeText(meta){
  const sm=meta.start.getMonth()+1,sd=meta.start.getDate(),em=meta.end.getMonth()+1,ed=meta.end.getDate();
  return sm===em?sm+"\u6708"+sd+"\u65e5 - "+ed+"\u65e5":sm+"\u6708"+sd+"\u65e5 - "+em+"\u6708"+ed+"\u65e5"
}
function getTaskWeekOffset(ds){const targetStart=getTaskWeekMeta(ds).start,baseStart=getTaskWeekMeta(fd(now)).start,targetDate=new Date(targetStart.getFullYear(),targetStart.getMonth(),targetStart.getDate()),baseDate=new Date(baseStart.getFullYear(),baseStart.getMonth(),baseStart.getDate());return Math.round((targetDate-baseDate)/604800000)}
function getCnWeekNum(n){const d=["\u96f6","\u4e00","\u4e8c","\u4e09","\u56db","\u4e94","\u516d","\u4e03","\u516b","\u4e5d"],v=Math.max(0,Math.floor(Number(n)||0));if(v<10)return d[v];if(v===10)return"\u5341";if(v<20)return"\u5341"+d[v%10];const t=Math.floor(v/10),u=v%10;return d[t]+"\u5341"+(u?d[u]:"")}
function getTaskWeekScopeTitle(ds){const off=getTaskWeekOffset(ds);if(off===0)return"\u672c\u5468";if(off===1)return"\u4e0b\u5468";if(off===-1)return"\u4e0a\u5468";if(off>1)return"\u7b2c"+getCnWeekNum(off+1)+"\u5468";return"\u524d"+getCnWeekNum(-off+1)+"\u5468"}
function setTaskDashScope(scope,metaText){const titleEl=document.querySelector(".dash-overview .dash-hd-tit"),subEl=document.querySelector(".dash-overview .dash-ov-count-sub"),shortEl=document.getElementById("dashShortDate"),root=document.getElementById("taskDashCol");if(scope==="week"){if(titleEl)titleEl.textContent="\u672c\u5468\u603b\u89c8";if(subEl)subEl.textContent="\u5468\u4efb\u52a1\u5df2\u5b8c\u6210";if(shortEl&&metaText)shortEl.textContent=metaText;if(root)root.setAttribute("aria-label","\u672c\u5468\u6982\u89c8");return}if(titleEl)titleEl.textContent="\u4eca\u65e5\u603b\u89c8";if(subEl)subEl.textContent="\u4efb\u52a1\u5df2\u5b8c\u6210";if(root)root.setAttribute("aria-label","\u4eca\u65e5\u6982\u89c8")}
const weekDayExpandState=new Set();
const weekDoneDayRevealState=new Set();
const weekTaskTogglePendingIds=new Set();
const WEEK_DONE_COLLAPSE_LS_KEY="tuole_week_done_collapsed";
const WEEK_DONE_FOCUS_MIGRATION_KEY="tuole_week_done_focus_migrated";
const WEEK_DAY_PREVIEW_MAX=4;
const WEEK_TASK_DONE_ANIM_MS=520;
const WEEK_HEADER_ADD_ICON='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
const WEEK_HEADER_EXPAND_ICON='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="7 8 12 13 17 8"></polyline><polyline points="7 12 12 17 17 12"></polyline></svg>';
const WEEK_HEADER_COLLAPSE_ICON='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="7 16 12 11 17 16"></polyline><polyline points="7 12 12 7 17 12"></polyline></svg>';
const WEEK_HEADER_READY_ICON='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
let weekDoneCollapsed=true;
let weekQuietDaysExpanded=false;
try{
  if(localStorage.getItem(WEEK_DONE_FOCUS_MIGRATION_KEY)!=="1"){
    localStorage.setItem(WEEK_DONE_COLLAPSE_LS_KEY,"1");
    localStorage.setItem(WEEK_DONE_FOCUS_MIGRATION_KEY,"1")
  }else{
    const savedWeekDone=localStorage.getItem(WEEK_DONE_COLLAPSE_LS_KEY);
    weekDoneCollapsed=savedWeekDone==null?true:savedWeekDone==="1"
  }
}catch(e){weekDoneCollapsed=true}
let _weekAddMainLabelGuardPatched=false;
function ensureWeekAddMainLabelGuard(){
  if(_weekAddMainLabelGuardPatched||typeof syncAddTaskMainLabel!=="function")return;
  const rawSyncAddTaskMainLabel=syncAddTaskMainLabel;
  syncAddTaskMainLabel=function(isOpen){
    const addBtn=document.getElementById("btnAddTaskBar");
    if((addBtn&&addBtn.dataset.weekBulkToggle==="1")||getTaskQuickMode()==="week"){
      if(typeof syncWeekHeaderAction==="function")syncWeekHeaderAction(true);
      return
    }
    return rawSyncAddTaskMainLabel(isOpen)
  };
  _weekAddMainLabelGuardPatched=true
}
ensureWeekAddMainLabelGuard();
function isWeekDayExpanded(ds){return weekDayExpandState.has(ds)}
function isWeekDoneCollapsed(){return !!weekDoneCollapsed}
function isWeekDoneDayRevealed(ds){return weekDoneDayRevealState.has(ds)}
function isWeekDoneDayShown(ds){return weekDoneCollapsed?weekDoneDayRevealState.has(ds):!weekDoneDayRevealState.has(ds)}
function toggleWeekQuietDays(){
  weekQuietDaysExpanded=!weekQuietDaysExpanded;
  rT()
}
function syncWeekDoneInlineAction(){
  const root=document.querySelector("#tList .week-view"),btn=document.querySelector("#tList .week-done-inline-action");
  if(root)root.classList.toggle("is-done-collapsed",weekDoneCollapsed);
  if(!btn)return;
  const label=btn.querySelector(".week-done-inline-text"),tip=weekDoneCollapsed?"\u663e\u793a\u5df2\u5b8c\u6210":"\u6298\u53e0\u5df2\u5b8c\u6210";
  btn.classList.toggle("is-on",weekDoneCollapsed);
  btn.setAttribute("aria-pressed",weekDoneCollapsed?"true":"false");
  btn.setAttribute("aria-label",tip);
  btn.setAttribute("title",tip);
  if(label)label.textContent=weekDoneCollapsed?"\u663e\u793a":"\u6298\u53e0"
}
function toggleWeekDoneCollapse(){
  const list=document.getElementById("tList"),slides=list?Array.prototype.slice.call(list.querySelectorAll(".week-done-slide")):[];
  const nextCollapsed=!weekDoneCollapsed,showDone=!nextCollapsed;
  weekDoneCollapsed=nextCollapsed;
  weekDoneDayRevealState.clear();
  try{localStorage.setItem(WEEK_DONE_COLLAPSE_LS_KEY,weekDoneCollapsed?"1":"0")}catch(e){}
  if(!slides.length){rT();return}
  syncWeekDoneInlineAction();
  if(list)list.querySelectorAll(".week-done-count-toggle").forEach(function(btn){
    syncWeekDoneToggle(btn,showDone);
    btn.hidden=false
  });
  slides.forEach(function(slide){
    const card=slide.closest?slide.closest(".week-day-card"):null;
    if(card&&showDone){card.classList.add("is-done-open");void card.offsetHeight}
    const inner=slide.querySelector(".week-done-slide-inner"),height=inner?inner.scrollHeight:slide.scrollHeight;
    slide.setAttribute("aria-hidden",showDone?"false":"true");
    animateWeekDoneSlide(slide,showDone,height,function(){if(card&&!showDone)card.classList.remove("is-done-open")})
  })
}
function getWeekDayCard(ds){const list=document.getElementById("tList");return list?list.querySelector('.week-day-card[data-week-ds="'+ds+'"]'):null}
function jumpWeekDay(ds){
  const card=getWeekDayCard(ds);
  if(!card){
    pick(ds);
    return
  }
  card.scrollIntoView({behavior:"smooth",block:"center"});
  card.classList.remove("is-jump-highlight");
  void card.offsetWidth;
  card.classList.add("is-jump-highlight");
  setTimeout(function(){card.classList.remove("is-jump-highlight")},900)
}
function syncWeekDoneSlideHeights(root){
  const scope=root||document;
  if(!scope.querySelectorAll)return;
  scope.querySelectorAll(".week-done-slide").forEach(function(slide){
    const inner=slide.querySelector(".week-done-slide-inner"),height=inner?inner.scrollHeight:slide.scrollHeight;
    slide.style.setProperty("--week-done-slide-h",Math.max(0,height)+"px")
  })
}
function syncWeekExtraHeights(root){
  const scope=root||document;
  if(!scope.querySelectorAll)return;
  scope.querySelectorAll(".week-task-extra").forEach(function(extra){
    const inner=extra.querySelector(".week-task-extra-inner"),height=inner?inner.scrollHeight:extra.scrollHeight;
    extra.style.setProperty("--week-extra-h",Math.max(0,height)+"px")
  });
  syncWeekDoneSlideHeights(scope)
}
function syncWeekDoneToggle(btn,isOpen){
  if(!btn)return;
  const count=btn.getAttribute("data-done-count")||"0",dayLabel=btn.getAttribute("data-day-label")||"";
  const tip=(isOpen?"\u6536\u8d77":"\u67e5\u770b")+"\u5f53\u5929 "+count+" \u9879\u5df2\u5b8c\u6210\u4efb\u52a1";
  btn.classList.toggle("is-open",isOpen);
  btn.setAttribute("aria-expanded",isOpen?"true":"false");
  btn.setAttribute("title",tip);
  btn.setAttribute("aria-label",(isOpen?"\u6536\u8d77":"\u67e5\u770b")+dayLabel+" \u7684 "+count+" \u9879\u5df2\u5b8c\u6210\u4efb\u52a1")
}
function getWeekDoneSlideCurrentFrame(slide,isOpen){
  const cs=getComputedStyle(slide),rect=slide.getBoundingClientRect(),opacity=parseFloat(cs.opacity);
  return{
    height:Math.max(0,rect.height||0),
    opacity:Number.isFinite(opacity)?opacity:(isOpen?0:1),
    transform:cs.transform&&cs.transform!=="none"?cs.transform:(isOpen?"translateY(-6px)":"translateY(0)")
  }
}
function animateWeekDoneSlide(slide,isOpen,height,onDone){
  if(!slide)return;
  const current=getWeekDoneSlideCurrentFrame(slide,isOpen);
  if(slide.__weekDoneAnim){try{slide.__weekDoneAnim.cancel()}catch(e){}slide.__weekDoneAnim=null}
  const target=Math.max(0,height),from=current.height,to=isOpen?target:0,token={},toOpacity=isOpen?1:0,toTransform=isOpen?"translateY(0)":"translateY(-4px)";
  slide.__weekDoneToken=token;
  slide.style.setProperty("--week-done-slide-h",target+"px");
  slide.style.height=from+"px";
  slide.style.opacity=String(current.opacity);
  slide.style.transform=current.transform;
  slide.style.overflow="hidden";
  if(isOpen)slide.inert=false;
  void slide.offsetHeight;
  slide.classList.toggle("is-open",isOpen);
  if(!slide.animate||(Math.abs(from-to)<1&&Math.abs(current.opacity-toOpacity)<.02)){
    slide.style.height="";
    slide.style.opacity="";
    slide.style.transform="";
    slide.style.overflow="";
    if(!isOpen)slide.inert=true;
    if(onDone)onDone();
    return
  }
  const anim=slide.animate([{height:from+"px",opacity:current.opacity,transform:current.transform},{height:to+"px",opacity:toOpacity,transform:toTransform}],{duration:380,easing:"cubic-bezier(.22, 1, .36, 1)",fill:"forwards"});
  slide.__weekDoneAnim=anim;
  anim.onfinish=function(){
    if(slide.__weekDoneToken!==token)return;
    slide.__weekDoneAnim=null;
    slide.style.height="";
    slide.style.opacity="";
    slide.style.transform="";
    slide.style.overflow="";
    if(!isOpen)slide.inert=true;
    if(onDone)onDone()
  }
}
function setWeekDoneDayRevealed(ds,isOpen){
  if(weekDoneCollapsed){if(isOpen)weekDoneDayRevealState.add(ds);else weekDoneDayRevealState.delete(ds)}
  else{if(isOpen)weekDoneDayRevealState.delete(ds);else weekDoneDayRevealState.add(ds)}
  const card=getWeekDayCard(ds),slide=card?card.querySelector(".week-done-slide"):null,btn=card?card.querySelector(".week-done-count-toggle"):null;
  if(!card||!slide){rT();return}
  if(isOpen){card.classList.add("is-done-open");void card.offsetHeight}
  const inner=slide.querySelector(".week-done-slide-inner"),height=inner?inner.scrollHeight:slide.scrollHeight;
  slide.setAttribute("aria-hidden",isOpen?"false":"true");
  animateWeekDoneSlide(slide,isOpen,height,function(){if(!isOpen)card.classList.remove("is-done-open")});
  syncWeekDoneToggle(btn,isOpen)
}
function toggleWeekDoneForDay(ds){
  setWeekDoneDayRevealed(ds,!isWeekDoneDayShown(ds))
}
function animateWeekExtra(extra,isOpen,height){
  if(!extra)return;
  if(extra.__weekExtraAnim){try{extra.__weekExtraAnim.cancel()}catch(e){}}
  const from=isOpen?0:Math.max(0,extra.getBoundingClientRect().height||height),to=isOpen?height:0,token={};
  extra.__weekExtraToken=token;
  extra.style.height=from+"px";
  extra.style.opacity=isOpen?"0":"1";
  extra.style.overflow="hidden";
  void extra.offsetHeight;
  extra.classList.toggle("is-open",isOpen);
  if(!extra.animate){
    extra.style.height="";
    extra.style.opacity="";
    extra.style.overflow="";
    return
  }
  const anim=extra.animate([{height:from+"px",opacity:isOpen?0:1},{height:to+"px",opacity:isOpen?1:0}],{duration:420,easing:"cubic-bezier(.22, 1, .36, 1)",fill:"forwards"});
  extra.__weekExtraAnim=anim;
  anim.onfinish=function(){
    if(extra.__weekExtraToken!==token)return;
    extra.__weekExtraAnim=null;
    extra.style.height="";
    extra.style.opacity="";
    extra.style.overflow=""
  }
}
function setWeekDayExpanded(ds,isOpen){
  const card=getWeekDayCard(ds),extra=card?card.querySelector(".week-task-extra"):null,btn=card?card.querySelector(".week-todo-count-toggle"):null,moreBtn=card?card.querySelector(".week-task-more-inline"):null,taskList=card?card.querySelector(".week-task-list"):null,total=card?Number(card.getAttribute("data-week-task-count")||0):0;
  if(isOpen)weekDayExpandState.add(ds);else weekDayExpandState.delete(ds);
  if(extra){
    const inner=extra.querySelector(".week-task-extra-inner"),height=inner?inner.scrollHeight:extra.scrollHeight;
    extra.style.setProperty("--week-extra-h",Math.max(0,height)+"px");
    animateWeekExtra(extra,isOpen,Math.max(0,height));
    extra.setAttribute("aria-hidden",isOpen?"false":"true");
    extra.inert=!isOpen
  }
  if(taskList){
    taskList.classList.toggle("is-scroll",isOpen&&total>10);
    taskList.classList.toggle("has-more-collapsed",!isOpen&&!!extra)
  }
  if(btn){
    const hiddenCount=btn.getAttribute("data-hidden-count")||"0",countLabel=btn.getAttribute("data-count-label")||"",previewCount=Number(btn.getAttribute("data-preview-count")||0),todoCount=Number(btn.getAttribute("data-todo-count")||0),label=btn.querySelector(".week-task-expand-label")||btn.querySelector("span"),countValue=btn.querySelector(".week-day-count-line--todo b"),tip=(isOpen?"\u6536\u8d77 ":"\u67e5\u770b ")+hiddenCount+" \u9879\u5269\u4f59\u4efb\u52a1",fullTip=countLabel?countLabel+"\uff0c"+tip:tip;
    btn.classList.toggle("is-open",isOpen);
    btn.setAttribute("aria-expanded",isOpen?"true":"false");
    btn.setAttribute("aria-label",fullTip);
    btn.setAttribute("title",fullTip);
    if(countValue&&todoCount>previewCount)countValue.textContent=(isOpen?todoCount:previewCount)+"/"+todoCount;
    if(label&&!label.querySelector(".week-day-count-line"))label.textContent=tip
  }
  if(moreBtn){
    const moreHiddenCount=moreBtn.getAttribute("data-hidden-count")||"0",moreTip=isOpen?"\u6536\u8d77\u5f53\u5929\u5df2\u5c55\u5f00\u7684\u5f85\u529e":"\u5c55\u5f00\u5f53\u5929\u5269\u4f59 "+moreHiddenCount+" \u9879\u5f85\u529e",moreText=moreBtn.querySelector(".week-task-more-text"),moreAction=moreBtn.querySelector(".week-task-more-action");
    moreBtn.classList.toggle("is-open",isOpen);
    moreBtn.setAttribute("aria-expanded",isOpen?"true":"false");
    moreBtn.setAttribute("aria-label",moreTip);
    moreBtn.setAttribute("title",moreTip);
    if(moreText)moreText.textContent=isOpen?"\u5f53\u5929\u5df2\u5168\u90e8\u5c55\u5f00":"\u5f53\u5929\u5269\u4f59 "+moreHiddenCount+" \u9879";
    if(moreAction)moreAction.textContent=isOpen?"\u6536\u8d77":"\u5c55\u5f00"
  }
}
function toggleWeekDayExpand(ds){
  setWeekDayExpanded(ds,!isWeekDayExpanded(ds));
  syncWeekHeaderAction(true)
}
function getWeekBulkActionState(baseDs,days){
  const expandableDays=Array.isArray(days)?days:getWeekExpandableDays(baseDs);
  const allExpanded=expandableDays.length>0&&expandableDays.every(function(ds){return isWeekDayExpanded(ds)});
  const hiddenPendingCount=expandableDays.reduce(function(sum,ds){
    if(isWeekDayExpanded(ds))return sum;
    return sum+Math.max(0,getWeekRenderedRows(ds).length-WEEK_DAY_PREVIEW_MAX)
  },0);
  const hiddenPendingLabel=hiddenPendingCount>99?"99+":String(hiddenPendingCount);
  const label=allExpanded?"\u6536\u8d77":"\u5c55\u5f00 "+hiddenPendingLabel+" \u9879";
  const tip=allExpanded?"\u6536\u8d77\u672c\u5468\u5df2\u5c55\u5f00\u7684\u5f85\u529e\u4efb\u52a1":"\u5c55\u5f00\u672c\u5468\u5269\u4f59 "+hiddenPendingLabel+" \u9879\u672a\u5c55\u793a\u5f85\u529e";
  return{expandableDays:expandableDays,hasExpandable:expandableDays.length>0,allExpanded:allExpanded,hiddenPendingCount:hiddenPendingCount,label:label,tip:tip}
}
function syncWeekInlineAction(weekMeta){
  const state=getWeekBulkActionState(sel,weekMeta&&weekMeta.expandableDays);
  const btn=document.querySelector("#tList .week-view-inline-action");
  if(!btn)return;
  if(!state.hasExpandable){
    btn.remove();
    return
  }
  btn.classList.toggle("is-open",state.allExpanded);
  btn.setAttribute("aria-expanded",state.allExpanded?"true":"false");
  btn.setAttribute("aria-label",state.tip);
  btn.setAttribute("title",state.tip);
  btn.innerHTML=(state.allExpanded?WEEK_HEADER_COLLAPSE_ICON:WEEK_HEADER_EXPAND_ICON)+"<span>"+state.label+"</span>"
}
function playWeekTaskTitleDoneAnim(row,isDone){
  const title=row&&row.querySelector(".week-task-title"),text=title&&title.querySelector(".week-task-title-text"),strike=title&&title.querySelector(".week-task-title-strike");
  if(!title||!strike)return;
  if(strike.getAnimations)strike.getAnimations().forEach(function(anim){anim.cancel()});
  const width=Math.max(0,Math.ceil((text||title).getBoundingClientRect().width||title.scrollWidth||0));
  strike.style.right="auto";
  strike.style.transition="none";
  strike.style.transform="none";
  strike.style.width=(isDone?0:width)+"px";
  strike.style.opacity=".72";
  void strike.offsetWidth;
  strike.style.transition="width "+(isDone?520:180)+"ms cubic-bezier(.16, 1, .3, 1), opacity "+(isDone?160:140)+"ms ease";
  strike.style.opacity=isDone?".72":"0";
  strike.style.width=(isDone?width:0)+"px"
}
function toggleWeekTaskDone(ds,id){
  const task=(T[ds]||[]).find(function(x){return x.id===id});
  if(!task)return;
  const card=getWeekDayCard(ds),row=card?card.querySelector('.week-task-item[data-week-task-id="'+id+'"]'):null;
  if(!task.done&&weekTaskTogglePendingIds.has(id)){
    weekTaskTogglePendingIds.delete(id);
    if(window._chkRippleTaskId===id)window._chkRippleTaskId=null;
    if(row){
      const ring=row.querySelector(".chk-ring"),wrap=ring&&ring.closest(".task-ck-ring");
      row.classList.remove("is-done","task-toggle-anim");
      if(ring)ring.classList.remove("checked","chk-ring--ripple");
      if(wrap)wrap.classList.remove("task-ck-ring--done");
      playWeekTaskTitleDoneAnim(row,false)
    }
    try{if(typeof playCheckSound==="function")playCheckSound(false)}catch(e){}
    return
  }
  if(task.done){
    if(typeof pushUndo==="function")pushUndo("\u5207\u6362\u5b8c\u6210");
    task.done=false;
    task.status="todo";
    task.archived=false;
    if(window._chkRippleTaskId===id)window._chkRippleTaskId=null;
    try{if(typeof playCheckSound==="function")playCheckSound(false)}catch(e){}
    rCal();
    rT();
    if(typeof syncTaskDetailPanelIfNeeded==="function")syncTaskDetailPanelIfNeeded(id);
    if(typeof rKanban==="function")rKanban();
    save();
    return
  }
  if(typeof pushUndo==="function")pushUndo("\u5207\u6362\u5b8c\u6210");
  weekTaskTogglePendingIds.add(id);
  window._chkRippleTaskId=id;
  try{if(typeof playCheckSound==="function")playCheckSound(true)}catch(e){}
  if(row){
    const ring=row.querySelector(".chk-ring"),wrap=ring&&ring.closest(".task-ck-ring");
    row.classList.remove("task-toggle-anim");
    void row.offsetWidth;
    row.classList.add("is-done","task-toggle-anim");
    if(ring){
      ring.classList.remove("chk-ring--ripple");
      void ring.offsetHeight;
      ring.classList.add("checked","chk-ring--ripple")
    }
    if(wrap){
      wrap.classList.add("task-ck-ring--done");
      wrap.setAttribute("aria-pressed","true");
      wrap.setAttribute("aria-label","\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210")
    }
    playWeekTaskTitleDoneAnim(row,true)
  }
  window.setTimeout(function(){
    if(!weekTaskTogglePendingIds.has(id))return;
    weekTaskTogglePendingIds.delete(id);
    task.done=true;
    task.status="done";
    if(window._chkRippleTaskId===id)window._chkRippleTaskId=null;
    rCal();
    rT();
    if(typeof syncTaskDetailPanelIfNeeded==="function")syncTaskDetailPanelIfNeeded(id);
    if(typeof rKanban==="function")rKanban();
    save()
  },WEEK_TASK_DONE_ANIM_MS);
  if(typeof syncTaskDetailPanelIfNeeded==="function")syncTaskDetailPanelIfNeeded(id)
}
function getWeekVisibleRows(ds){
  let rows=(T[ds]||[]).filter(function(t){return!t.archived});
  if(FTag)rows=rows.filter(function(t){return(t.tags||[]).includes(FTag)});
  return rows
}
function getWeekRenderedRows(ds){
  const rows=getWeekVisibleRows(ds);
  return rows.filter(function(t){return!t.done})
}
function getWeekExpandableDays(baseDs){
  return getTaskWeekMeta(baseDs).days.filter(function(ds){
    return getWeekRenderedRows(ds).length>WEEK_DAY_PREVIEW_MAX
  })
}
function toggleWeekAllDays(baseDs){
  const expandableDays=getWeekExpandableDays(baseDs);
  if(!expandableDays.length)return;
  const shouldExpand=expandableDays.some(function(ds){return!isWeekDayExpanded(ds)});
  expandableDays.forEach(function(ds){setWeekDayExpanded(ds,shouldExpand)});
  syncWeekHeaderAction(true,{expandableDays:expandableDays})
}
function markWeekHeaderActionInstant(addSplit){
  if(!addSplit||!addSplit.classList)return;
  addSplit.classList.add("add-split--instant-restore");
  if(addSplit._weekHeaderActionInstantTimer)clearTimeout(addSplit._weekHeaderActionInstantTimer);
  addSplit._weekHeaderActionInstantTimer=setTimeout(function(){
    addSplit._weekHeaderActionInstantTimer=null;
    if(addSplit&&addSplit.classList)addSplit.classList.remove("add-split--instant-restore")
  },220)
}
function syncWeekHeaderAction(weekMode,weekMeta){
  const addBtn=document.getElementById("btnAddTaskBar");
  if(!addBtn)return;
  const addSplit=addBtn.closest(".add-split");
  const quickBtn=addSplit?addSplit.querySelector(".add-split-quick"):null;
  const restoreFromWeek=!weekMode&&!!(addSplit&&(addBtn.dataset.weekBulkToggle==="1"||addSplit.classList.contains("is-week-bulk-hidden")||addSplit.classList.contains("is-week-bulk-booting")));
  if(restoreFromWeek)markWeekHeaderActionInstant(addSplit);
  if(quickBtn){
    if(weekMode){
      quickBtn.style.display="none";
      quickBtn.setAttribute("aria-hidden","true");
      quickBtn.tabIndex=-1
    }else{
      quickBtn.style.display="";
      quickBtn.removeAttribute("aria-hidden");
      quickBtn.tabIndex=0
    }
  }
  if(weekMode){
    const state=getWeekBulkActionState(sel,weekMeta&&weekMeta.expandableDays);
    syncWeekInlineAction({expandableDays:state.expandableDays});
    if(addSplit){
      addSplit.classList.add("is-week-bulk-hidden");
      addSplit.classList.remove("is-week-bulk-booting");
      addSplit.setAttribute("aria-hidden","true")
    }
    addBtn.dataset.weekBulkToggle="1";
    addBtn.classList.toggle("is-week-bulk-idle",!state.hasExpandable);
    addBtn.setAttribute("title",state.hasExpandable?state.tip:"\u672c\u5468\u5f85\u529e\u5df2\u5168\u90e8\u663e\u793a");
    addBtn.setAttribute("aria-label",state.hasExpandable?state.tip:"\u672c\u5468\u5f85\u529e\u5df2\u5168\u90e8\u663e\u793a");
    addBtn.setAttribute("aria-disabled","true");
    addBtn.tabIndex=-1;
    addBtn.innerHTML=(state.hasExpandable?(state.allExpanded?WEEK_HEADER_COLLAPSE_ICON:WEEK_HEADER_EXPAND_ICON):WEEK_HEADER_READY_ICON)+(state.hasExpandable?state.label:"\u5168\u90e8\u663e\u793a");
    addBtn.onclick=function(e){
      if(e){e.preventDefault();e.stopPropagation()}
    };
    return
  }
  if(addSplit){
    addSplit.classList.remove("is-week-bulk-hidden","is-week-bulk-booting");
    addSplit.removeAttribute("aria-hidden")
  }
  addBtn.tabIndex=0;
  if(addBtn.dataset.weekBulkToggle==="1"){
    addBtn.innerHTML=WEEK_HEADER_ADD_ICON+"\u6dfb\u52a0\u4efb\u52a1";
    addBtn.onclick=showAddTaskRow;
    addBtn.dataset.weekBulkToggle="0"
    addBtn.classList.remove("is-week-bulk-idle");
    addBtn.removeAttribute("aria-disabled")
  }
  const hold=document.getElementById("addTaskInlineHold");
  const isOpen=!!(hold&&!hold.classList.contains("hidden")&&hold.classList.contains("task-add-inline-open"));
  if(typeof syncAddTaskMainLabel==="function")syncAddTaskMainLabel(isOpen)
}
function initWeekViewPressFeedback(list){
  if(!list||list.__weekViewPressBound)return;
  list.__weekViewPressBound=true;
  list.addEventListener("pointerdown",function(e){
    const target=e.target.closest(".week-task-item,.week-day-head,.week-task-expand,.week-day-empty");
    if(!target||!list.contains(target))return;
    const rect=target.getBoundingClientRect();
    target.style.setProperty("--press-x",(e.clientX-rect.left)+"px");
    target.style.setProperty("--press-y",(e.clientY-rect.top)+"px");
    target.classList.remove("is-pressing");
    void target.offsetWidth;
    target.classList.add("is-pressing");
    window.setTimeout(function(){target.classList.remove("is-pressing")},420)
  },{passive:true})
}
function weekTaskTimeMetaHtml(t){
  const pt=String(t&&t.planTime||"").trim();
  if(t&&t.recurRuleId){
    const desc=typeof getRecurDesc==="function"?getRecurDesc(t.recurRuleId)||"重复":"重复",formatted=pt?(typeof formatPlanTimeDisp==="function"?formatPlanTimeDisp(pt):pt):"",timeText=pt?taskRowPlainTimeText(t,formatted):"",label=timeText?desc+" "+timeText:desc,tip=timeText?desc+" · "+timeText:desc,recurIco=typeof taskRecurRowBadgeSvg==="function"?taskRecurRowBadgeSvg():"";
    return'<span class="task-recur-badge time-disp week-task-recur-meta" title="'+esc(tip)+'">'+recurIco+'<span class="task-recur-badge-txt">'+esc(label)+'</span></span>'
  }
  return taskRowTimePlainHtml(t,pt||"全天",false)
}
function weekTaskCheckRingHtml(t,ds){
  const pending=!!(t&&weekTaskTogglePendingIds.has(t.id)),done=!!(t&&t.done)||pending,high=t&&t.priority==="high",hex=high?(prioColor(t.priority)||"#ef4444"):"#94a3b8";
  const rip=done&&window._chkRippleTaskId==t.id?" chk-ring--ripple":"";
  const chk='<svg class="chk-ring-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.15 12.35 10.95 16.05 17.1 8.2" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return'<button type="button" class="week-task-marker task-ck-ring'+(done?" task-ck-ring--done":"")+(high?" task-ck-ring--prio-high":"")+'" style="--ck-prio:'+hex+'" aria-label="'+(done?"\u6807\u8bb0\u4e3a\u672a\u5b8c\u6210":"\u6807\u8bb0\u4e3a\u5b8c\u6210")+'" aria-pressed="'+(done?"true":"false")+'" onclick="event.stopPropagation();toggleWeekTaskDone(\''+ds+'\','+t.id+')"><span class="tc-check"><span class="chk-ring'+(done?" checked":"")+rip+'">'+chk+'</span></span></button>'
}
function renderWeekTaskScene(list,baseDs){
  const meta=getTaskWeekMeta(baseDs),rangeText=getTaskWeekRangeText(meta),todayDs=fd(now),weekAllTasks=[],weekFilteredTasks=[],expandableDays=[],doneCollapsed=isWeekDoneCollapsed();
  let doneAll=0,pendingAll=0;
  const dailyOverview=[];
  const weekNames=["\u4e00","\u4e8c","\u4e09","\u56db","\u4e94","\u516d","\u65e5"];
  const cardList=meta.days.map(function(ds,idx){
    const raw=(T[ds]||[]).filter(function(t){return!t.archived});
    raw.forEach(function(t){weekAllTasks.push(t)});
    const dayDone=raw.filter(function(t){return t.done}).length,dayPending=raw.filter(function(t){return!t.done&&!t.frozen}).length;
    doneAll+=dayDone;
    pendingAll+=dayPending;
    const isOverdueDay=ds<todayDs&&dayPending>0;
    dailyOverview.push({ds:ds,idx:idx,pending:dayPending,done:dayDone,total:raw.length,isToday:ds===todayDs,isFocus:ds===baseDs,isOverdue:isOverdueDay});
    const allRows=getWeekVisibleRows(ds),showDayDone=isWeekDoneDayShown(ds),dayDoneRows=allRows.filter(function(t){return t.done});
    let dayRows=allRows.filter(function(t){return!t.done});
    allRows.forEach(function(t){weekFilteredTasks.push(t)});
    const sortWeekRows=function(a,b){
      if(a.done!==b.done)return a.done?1:-1;
      if(!!a.frozen!==!!b.frozen)return a.frozen?1:-1;
      const ta=String(a.planTime||""),tb=String(b.planTime||"");
      if(ta&&tb&&ta!==tb)return ta.localeCompare(tb);
      if(ta&&!tb)return-1;
      if(!ta&&tb)return 1;
      return(b.created||0)-(a.created||0)
    };
    dayRows.sort(sortWeekRows);
    dayDoneRows.sort(sortWeekRows);
    const d=parseDS(ds),md=d.getMonth()+1+"\u6708"+d.getDate()+"\u65e5",dayLabel="\u5468"+weekNames[idx]+" "+md,statusTxt=dayPending?"":raw.length?"\u5df2\u5168\u90e8\u5b8c\u6210":"\u6682\u65e0\u4efb\u52a1",dateTxt='<span class="week-day-date-text">'+md+'</span>',overdueTxt=isOverdueDay?'<span class="week-day-overdue-text"><span class="week-overdue-mark" aria-hidden="true">\u26a0</span><span>\u903e\u671f</span><b class="week-day-overdue-count">'+dayPending+'</b></span>':"",titleMeta=dateTxt+(overdueTxt?'<span class="week-day-meta-dot">\u00b7</span>'+overdueTxt:statusTxt?'<span class="week-day-meta-dot">\u00b7</span><span class="week-day-status-text">'+statusTxt+'</span>':""),hasTaskBody=dayRows.length||dayDoneRows.length,isClearDay=!dayPending&&raw.length>0,cls="week-day-card"+(ds===todayDs?" is-today":"")+(ds===baseDs?" is-focus":"")+(isOverdueDay?" is-overdue":"")+(isClearDay?" is-clear":"")+(showDayDone?" is-done-open":"")+(hasTaskBody?"":" is-empty"),previewMax=WEEK_DAY_PREVIEW_MAX,isExpandable=dayRows.length>previewMax,isExpanded=isExpandable&&isWeekDayExpanded(ds),previewRows=dayRows.slice(0,previewMax),extraRows=isExpandable?dayRows.slice(previewMax):[],hiddenCount=extraRows.length,listCls="week-task-list"+(isExpanded&&dayRows.length>10?" is-scroll":"")+(isExpandable&&!isExpanded?" has-more-collapsed":"")+(hasTaskBody?"":" is-empty");
    if(isExpandable)expandableDays.push(ds);
    const renderWeekRow=function(t){
      const pending=weekTaskTogglePendingIds.has(t.id),doneCls=(t.done||pending)?" is-done":"",animCls=pending?" task-toggle-anim":"",highCls=t.priority==="high"?" is-high":"",frozenCls=t.frozen?" is-frozen":"",subs=Array.isArray(t.subtasks)?t.subtasks:[],subT=subs.length,subD=subT?subs.reduce(function(n,s){return n+(s&&s.done?1:0)},0):0,timeMeta=weekTaskTimeMetaHtml(t),subMeta=subT?'<span class="week-task-sub-meta'+(subD===subT?" is-done":"")+'" title="子任务 '+subD+'/'+subT+'"><span class="week-task-sub-meta-dot" aria-hidden="true"></span><span>子任务 '+subD+" / "+subT+'</span></span>':"",metaHtml='<span class="week-task-meta-row">'+timeMeta+subMeta+'</span>';
      let badge="";
      if(t.frozen)badge='<span class="week-task-badge week-task-badge--frozen">\u51bb\u7ed3</span>';
      else if(t.done)badge='<span class="week-task-badge week-task-badge--done">\u5b8c\u6210</span>';
      return'<div class="week-task-item'+doneCls+animCls+highCls+frozenCls+'" data-week-task-id="'+t.id+'" title="\u6253\u5f00\u5f53\u65e5\u8be6\u60c5">'+weekTaskCheckRingHtml(t,ds)+'<button type="button" class="week-task-open" onclick="pick(\''+ds+'\')"><span class="week-task-main"><span class="week-task-title"><span class="week-task-title-text">'+esc(t.text)+'</span><span class="week-task-title-strike" aria-hidden="true"></span></span><span class="week-task-meta">'+metaHtml+"</span></span>"+badge+"</button></div>"
    };
    const totalDayRows=allRows.length,dayTodoCount=dayRows.length,dayDoneCount=dayDoneRows.length,countTip="\u5f85\u529e "+dayTodoCount+" \u9879\uff0c\u5df2\u5b8c\u6210 "+dayDoneCount+" \u9879",todoCountText=isExpandable?(isExpanded?dayTodoCount:previewRows.length)+"/"+dayTodoCount:dayTodoCount;
    const extraHtml=isExpandable?'<div class="week-task-extra'+(isExpanded?" is-open":"")+'" data-week-extra-ds="'+ds+'" aria-hidden="'+(isExpanded?"false":"true")+'"'+(isExpanded?"":" inert")+'><div class="week-task-extra-inner">'+extraRows.map(renderWeekRow).join("")+'</div></div>':"";
    const overflowControlHtml=isExpandable?'<button type="button" class="week-task-more-inline'+(isExpanded?" is-open":"")+'" data-hidden-count="'+hiddenCount+'" aria-expanded="'+(isExpanded?"true":"false")+'" aria-label="'+(isExpanded?"\u6536\u8d77\u5f53\u5929\u5df2\u5c55\u5f00\u7684\u5f85\u529e":"\u5c55\u5f00\u5f53\u5929\u5269\u4f59 "+hiddenCount+" \u9879\u5f85\u529e")+'" title="'+(isExpanded?"\u6536\u8d77\u5f53\u5929\u5df2\u5c55\u5f00\u7684\u5f85\u529e":"\u5c55\u5f00\u5f53\u5929\u5269\u4f59 "+hiddenCount+" \u9879\u5f85\u529e")+'" onclick="event.stopPropagation();toggleWeekDayExpand(\''+ds+'\')"><span class="week-task-more-line" aria-hidden="true"></span><span class="week-task-more-text">'+(isExpanded?"\u5f53\u5929\u5df2\u5168\u90e8\u5c55\u5f00":"\u5f53\u5929\u5269\u4f59 "+hiddenCount+" \u9879")+'</span><span class="week-task-more-action">'+(isExpanded?"\u6536\u8d77":"\u5c55\u5f00")+'</span><span class="week-task-more-caret" aria-hidden="true"></span></button>':"";
    const doneSectionHead='<div class="week-done-section-head"><span class="week-done-section-label">\u5df2\u5b8c\u6210</span><span class="week-done-section-count">'+dayDoneRows.length+' \u9879</span></div>';
    const doneSlideHtml=dayDoneRows.length?'<div class="week-done-slide'+(showDayDone?" is-open":"")+'" data-week-done-ds="'+ds+'" aria-hidden="'+(showDayDone?"false":"true")+'"'+(showDayDone?"":" inert")+'><div class="week-done-slide-inner">'+doneSectionHead+dayDoneRows.map(renderWeekRow).join("")+'</div></div>':"";
    const rowsHtml=previewRows.map(renderWeekRow).join("")+extraHtml+overflowControlHtml+doneSlideHtml;
    const todoControl=isExpandable?'<button type="button" class="week-day-count-chip week-day-count-chip--todo week-todo-count-toggle'+(isExpanded?" is-open":"")+'" data-hidden-count="'+hiddenCount+'" data-preview-count="'+previewRows.length+'" data-todo-count="'+dayTodoCount+'" data-total-count="'+totalDayRows+'" data-count-label="'+countTip+'" aria-expanded="'+(isExpanded?"true":"false")+'" aria-label="'+countTip+'\uff0c'+(isExpanded?"\u6536\u8d77 ":"\u67e5\u770b ")+hiddenCount+' \u9879\u5269\u4f59\u4efb\u52a1" title="'+countTip+'\uff0c'+(isExpanded?"\u6536\u8d77 ":"\u67e5\u770b ")+hiddenCount+' \u9879\u5269\u4f59\u4efb\u52a1" onclick="event.stopPropagation();toggleWeekDayExpand(\''+ds+'\')"><span class="week-task-expand-label"><span class="week-day-count-line week-day-count-line--todo"><span>\u5f85\u529e</span><b>'+todoCountText+'</b></span></span><span class="week-day-count-caret" aria-hidden="true"></span></button>':'<span class="week-day-count-chip week-day-count-chip--todo" title="\u5f85\u529e '+dayTodoCount+' \u9879"><span class="week-day-count-line week-day-count-line--todo"><span>\u5f85\u529e</span><b>'+dayTodoCount+'</b></span><span class="week-day-count-caret is-placeholder" aria-hidden="true"></span></span>';
    const doneControl=dayDoneRows.length?'<button type="button" class="week-day-count-chip week-day-count-chip--done week-done-count-toggle'+(showDayDone?" is-open":"")+'" data-done-count="'+dayDoneRows.length+'" data-day-label="'+esc(dayLabel)+'" aria-expanded="'+(showDayDone?"true":"false")+'" aria-label="'+(showDayDone?"\u6536\u8d77":"\u67e5\u770b")+dayLabel+' \u7684\u5df2\u5b8c\u6210\u4efb\u52a1" title="'+(showDayDone?"\u6536\u8d77\u5f53\u5929\u5df2\u5b8c\u6210\u4efb\u52a1":"\u67e5\u770b\u5f53\u5929\u5df2\u5b8c\u6210\u4efb\u52a1")+'" onclick="event.stopPropagation();toggleWeekDoneForDay(\''+ds+'\')"><span class="week-day-count-line week-day-count-line--done"><span>\u5df2\u5b8c\u6210</span><b>'+dayDoneCount+'</b></span><span class="week-day-count-caret" aria-hidden="true"></span></button>':'<span class="week-day-count-chip week-day-count-chip--done" title="\u5df2\u5b8c\u6210 '+dayDoneCount+' \u9879"><span class="week-day-count-line week-day-count-line--done"><span>\u5df2\u5b8c\u6210</span><b>'+dayDoneCount+'</b></span><span class="week-day-count-caret is-placeholder" aria-hidden="true"></span></span>';
    const activeCountCls="week-day-count week-day-count-group"+(dayDoneRows.length?"":" is-single-action"),activeCountControls=todoControl+(dayDoneRows.length?doneControl:"");
    const countHtml=dayPending?'<div class="'+activeCountCls+'" title="'+countTip+'" aria-label="'+countTip+'">'+activeCountControls+'</div>':dayDoneRows.length?'<div class="week-day-count week-day-count-group is-single-action" title="'+countTip+'" aria-label="'+countTip+'">'+doneControl+'</div>':"";
    const taskBody=rowsHtml||'<button type="button" class="week-day-empty" onclick="pick(\''+ds+'\')" title="\u6253\u5f00\u5f53\u65e5\u8be6\u60c5"><span class="week-day-empty-dot" aria-hidden="true"></span><span>\u6682\u65e0\u4efb\u52a1</span></button>';
    return{html:'<section class="'+cls+'" data-week-ds="'+ds+'" data-week-task-count="'+dayRows.length+'" style="--week-delay:'+(idx*24)+'ms"><div class="week-day-head"><button type="button" class="week-day-title-btn" onclick="pick(\''+ds+'\')" aria-label="\u6253\u5f00\u5468'+weekNames[idx]+' '+md+'"><span class="week-day-name"><span class="week-day-week">\u5468'+weekNames[idx]+'</span></span><span class="week-day-meta"><span class="week-day-date-label">'+titleMeta+'</span></span></button>'+countHtml+'</div><div class="'+listCls+'">'+taskBody+'</div></section>',pending:dayPending,done:dayDoneCount,total:totalDayRows,idx:idx,ds:ds,weekName:weekNames[idx],md:md}
  });
  const totalAll=weekAllTasks.length,pct=totalAll?Math.round(doneAll/totalAll*100):0;
  const doneStatHtml='<span class="week-view-stat week-view-stat--done"><b>'+doneAll+'</b><span>\u5b8c\u6210</span></span>';
  const bulkState=getWeekBulkActionState(baseDs,expandableDays);
  const weekInlineActionHtml=bulkState.hasExpandable?'<button type="button" class="week-view-inline-action'+(bulkState.allExpanded?" is-open":"")+'" aria-expanded="'+(bulkState.allExpanded?"true":"false")+'" aria-label="'+bulkState.tip+'" title="'+bulkState.tip+'" onclick="event.stopPropagation();toggleWeekAllDays(\''+baseDs+'\')">'+(bulkState.allExpanded?WEEK_HEADER_COLLAPSE_ICON:WEEK_HEADER_EXPAND_ICON)+'<span>'+bulkState.label+'</span></button>':"";
  const dayStripHtml='<div class="week-view-day-strip" aria-label="\u672c\u5468\u6bcf\u65e5\u5f85\u529e\u6982\u89c8"><div class="week-view-day-pills">'+dailyOverview.map(function(day){
    const name=weekNames[day.idx],d=parseDS(day.ds),dateText=d?d.getMonth()+1+"/"+d.getDate():"",state=day.isOverdue?"\u903e\u671f "+day.pending+" \u9879":day.pending?day.pending+" \u9879\u5f85\u529e":day.total?"\u5df2\u5168\u90e8\u5b8c\u6210":"\u6682\u65e0\u4efb\u52a1",cls="week-view-day-pill"+(day.isToday?" is-today":"")+(day.isFocus?" is-focus":"")+(day.isOverdue?" is-overdue":"")+(day.pending?" has-pending":day.total?" is-clear":" is-empty"),dateLabel=dateText,valueHtml=day.isOverdue?'<span class="week-view-day-pill-state week-view-day-pill-state--overdue"><span class="week-overdue-mark" aria-hidden="true">\u26a0</span><span class="week-view-day-pill-count">'+day.pending+'</span><span class="week-view-day-pill-state-text">\u903e\u671f</span></span>':day.pending?'<span class="week-view-day-pill-state"><span class="week-view-day-pill-count">'+day.pending+'</span><span class="week-view-day-pill-state-text">\u5f85\u529e</span></span>':'<span class="week-view-day-pill-state week-view-day-pill-state--quiet"><span class="week-view-day-pill-state-text">'+(day.total?"\u5df2\u5b8c\u6210":"\u65e0\u4efb\u52a1")+'</span></span>';
    return'<button type="button" class="'+cls+'" aria-label="\u5b9a\u4f4d\u5230\u5468'+name+' '+dateText+'\uff0c'+state+'" title="\u5468'+name+' '+dateText+'\uff1a'+state+'" onclick="jumpWeekDay(\''+day.ds+'\')"><span class="week-view-day-pill-main"><span class="week-view-day-pill-name">\u5468'+name+'</span><span class="week-view-day-pill-date">'+dateLabel+'</span></span>'+valueHtml+'</button>'
  }).join("")+'</div></div>';
  const activeCards=cardList.filter(function(item){return item.pending>0}),completedOnlyCards=cardList.filter(function(item){return item.pending<=0&&item.total>0});
  const gridInner=activeCards.concat(completedOnlyCards).map(function(item){return item.html}).join("");
  list.innerHTML='<div class="week-view'+(doneCollapsed?" is-done-collapsed":"")+'"><div class="week-view-head">'+dayStripHtml+'</div><div class="week-day-grid is-focus-first">'+gridInner+'</div></div>';
  syncWeekExtraHeights(list);
  requestAnimationFrame(function(){syncWeekExtraHeights(list)});
  initWeekViewPressFeedback(list);
  return{allTasks:weekAllTasks,filteredTasks:weekFilteredTasks,totalAll:totalAll,doneAll:doneAll,rangeText:rangeText,expandableDays:expandableDays,allExpanded:expandableDays.length>0&&expandableDays.every(function(ds){return isWeekDayExpanded(ds)})}
}
function setTaskDateTitle(ds){const el=document.getElementById("dTitle");if(!el)return;let mainEl=el.querySelector(".date-nav-date-main"),subEl=el.querySelector(".date-nav-date-sub");if(!mainEl||!subEl){el.innerHTML='<span class="date-nav-date-main"></span><span class="date-nav-date-sub"></span>';mainEl=el.querySelector(".date-nav-date-main");subEl=el.querySelector(".date-nav-date-sub")}mainEl.style.display="block";mainEl.style.fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';mainEl.style.fontSize="24px";mainEl.style.fontWeight="700";mainEl.style.lineHeight="1";mainEl.style.letterSpacing="-0.025em";mainEl.style.color="#0f172a";mainEl.style.margin="0 0 4px 0";subEl.style.display="block";subEl.style.fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';subEl.style.fontSize="13px";subEl.style.fontWeight="500";subEl.style.lineHeight="1.5";subEl.style.letterSpacing="0.025em";subEl.style.color="#64748b";subEl.style.margin="0";if(!el.dataset.animBound){el.dataset.animBound="1";el.addEventListener("animationend",function(){el.classList.remove("is-animating");el.classList.remove("is-animating-prev");el.classList.remove("is-animating-next")})}const isWeekScope=getTaskQuickMode()==="week";let useRangeOffset=false,useRelative=false,mainText="",subText="",modeKey="d";if(isWeekScope){mainText=getTaskWeekScopeTitle(ds);subText=getTaskWeekRangeText(getTaskWeekMeta(ds));modeKey="week"}else{const text=String(disp(ds)||""),splitIdx=text.lastIndexOf(" "),dateText=splitIdx>0?text.slice(0,splitIdx):text,weekText=splitIdx>0?text.slice(splitIdx+1):"";let dayOffset=99;try{const base=parseDS(fd(now)),target=parseDS(ds);if(base&&target){const baseDate=new Date(base.getFullYear(),base.getMonth(),base.getDate()),targetDate=new Date(target.getFullYear(),target.getMonth(),target.getDate());dayOffset=Math.round((targetDate-baseDate)/86400000)}}catch(e){}const abs=Math.abs(dayOffset);let relativeText="";if(dayOffset===0)relativeText="今天";else if(dayOffset===1)relativeText="明天";else if(dayOffset===2)relativeText="后天";else if(dayOffset===-1)relativeText="昨天";else if(dayOffset===-2)relativeText="前天";useRangeOffset=abs>=3;useRelative=!useRangeOffset&&!!relativeText;const rangeText=dayOffset>0?"未来"+abs+"天":"过去"+abs+"天";mainText=useRangeOffset?rangeText:(useRelative?relativeText:dateText);subText=useRangeOffset?dateText+(weekText?" "+weekText:""):(useRelative?dateText+(weekText?" "+weekText:""):weekText);modeKey=useRangeOffset?"range":(useRelative?"r":"d")}const renderKey=ds+"|"+modeKey+"|"+mainText+"|"+subText,prevKey=el.dataset.renderKey||"",prevDs=el.dataset.lastDs||"",shouldUpdate=prevKey!==renderKey;if(shouldUpdate){mainEl.textContent=mainText;subEl.textContent=subText;el.classList.toggle("is-week-scope",isWeekScope);el.classList.toggle("is-range-offset",!isWeekScope&&useRangeOffset);el.classList.toggle("is-relative",!isWeekScope&&useRelative);el.classList.toggle("is-plain-date",!isWeekScope&&!useRangeOffset&&!useRelative);subEl.classList.toggle("is-empty",!subText);const shouldAnimate=!!prevDs&&prevDs!==ds;el.classList.remove("is-animating");el.classList.remove("is-animating-prev");el.classList.remove("is-animating-next");if(shouldAnimate){let dirCls="";try{const prevDate=parseDS(prevDs),nextDate=parseDS(ds);if(prevDate&&nextDate){const prevTime=new Date(prevDate.getFullYear(),prevDate.getMonth(),prevDate.getDate()).getTime(),nextTime=new Date(nextDate.getFullYear(),nextDate.getMonth(),nextDate.getDate()).getTime();if(nextTime>prevTime)dirCls="is-animating-next";else if(nextTime<prevTime)dirCls="is-animating-prev"}}catch(e){}if(dirCls)el.classList.add(dirCls);void el.offsetWidth;el.classList.add("is-animating")}el.dataset.renderKey=renderKey;el.dataset.lastDs=ds}else{el.classList.remove("is-animating");el.classList.remove("is-animating-prev");el.classList.remove("is-animating-next");el.classList.toggle("is-week-scope",isWeekScope);el.classList.toggle("is-range-offset",!isWeekScope&&useRangeOffset);el.classList.toggle("is-relative",!isWeekScope&&useRelative);el.classList.toggle("is-plain-date",!isWeekScope&&!useRangeOffset&&!useRelative);if(subEl.classList.contains("is-empty")===!!subText)subEl.classList.toggle("is-empty",!subText)}setTaskBackTodayBtn(ds)}
function rT(){if(_togPendingDoneId!=null){flushPendingTogIfAny();return}hydrateCompletedSubtaskCollapseState();hydrateTodoSubtaskCollapseState();hydrateSortModes();const list=document.getElementById("tList");if(!list)return;const weekMode=getTaskQuickMode()==="week";if(weekMode){const wm=getTaskWeekMeta(sel);wm.days.forEach(function(ds){generateRecurring(ds)})}else generateRecurring(sel);checkUnfreeze();setTaskDateTitle(sel);updateHeaderContext();const batchBar=document.getElementById("batchBar");if(batchBar)batchBar.style.display=weekMode?"none":"flex";updateSortUI();if(weekMode){const overdueArea=document.getElementById("overdueArea");if(overdueArea)overdueArea.innerHTML="";const wk=renderWeekTaskScene(list,sel),pct=wk.totalAll>0?Math.round(wk.doneAll/wk.totalAll*100):0;renderTaskDash(pct,wk.totalAll,wk.doneAll,wk.allTasks,wk.filteredTasks,sel);setTaskDashScope("week",wk.rangeText);syncWeekHeaderAction(true,wk);requestAnimationFrame(function(){syncWeekHeaderAction(true,wk)});focusTimerAfterRender();return}syncWeekHeaderAction(false);requestAnimationFrame(function(){syncWeekHeaderAction(false)});renderOverdue();const dt=T[sel]||[],nonArchived=dt.filter(t=>!t.archived),archivedTasks=dt.filter(t=>t.archived),dn=nonArchived.filter(t=>t.done).length,archDn=archivedTasks.length,tot=nonArchived.length;let fl=nonArchived.filter(t=>passesFMulti(t));if(FTag)fl=fl.filter(t=>(t.tags||[]).includes(FTag));let archVisible=[];if(showArchivedInList&&archivedTasks.length>0){let af=archivedTasks;if(FTag)af=af.filter(t=>(t.tags||[]).includes(FTag));archVisible=af}const totalForProg=tot+archDn,doneForProg=dn+archDn,pct=totalForProg>0?Math.round(doneForProg/totalForProg*100):0;let displayList=fl,activeSortMode="";if(sortStates&&sortStates[sel])activeSortMode=normalizeSortMode(sortStates[sel]);else if(autoSortEnabled)activeSortMode=normalizeSortMode(defaultSortMode||lastSort||"created");if(activeSortMode&&displayList.length>1)displayList=sortDisplayList([...displayList],activeSortMode);if(!displayList.length&&!archVisible.length){const isZero=tot===0&&archDn===0;list.innerHTML=`<div class="empty"><div class="em">\u2705</div><p class="empty-main">${isZero?"\u4eca\u5929\u4efb\u52a1\u5df2\u5168\u90e8\u5b8c\u6210":"\u6ca1\u6709\u5339\u914d\u7684\u4efb\u52a1"}</p><p class="empty-sub">${isZero?"\u4f11\u606f\u4e00\u4e0b\uff0c\u6216\u6dfb\u52a0\u65b0\u4efb\u52a1":"\u8bd5\u8bd5\u5176\u4ed6\u7b5b\u9009\u6761\u4ef6"}</p></div>`;renderTaskDash(pct,totalForProg,doneForProg,nonArchived,fl,sel);setTaskDashScope("day","");focusTimerAfterRender();return}let h=displayList.map(t=>taskHTML(t,false)).join("");if(archVisible.length>0)h+=archVisible.map(t=>taskHTML(t,true)).join("");list.innerHTML=h;ensureSubtaskGeometryResizeSync();syncSubtaskGeometry();requestAnimationFrame(syncSubtaskGeometry);renderTaskDash(pct,totalForProg,doneForProg,nonArchived,fl,sel);setTaskDashScope("day","");focusTimerAfterRender()}

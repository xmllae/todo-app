// ?????????????????????
function taskRingAppearsDone(t){if(!t)return false;if(_togVisualPendingIds.has(t.id))return true;return!!t.done}
function syncTaskDetailPanelIfNeeded(taskId){if(taskId!=null&&typeof syncTaskDetailDoneState==="function"){try{if(syncTaskDetailDoneState(taskId))return}catch(e){}}if(typeof syncTaskDetailPanel==="function")syncTaskDetailPanel()}
function _clearTogDoneTimer(){if(_togDoneTimer){clearTimeout(_togDoneTimer);_togDoneTimer=null}}
function _clearTogCollapseOverlay(){if(window._togCollapseAnim){try{window._togCollapseAnim.onfinish=null;window._togCollapseAnim.cancel()}catch(e){}window._togCollapseAnim=null}if(window._togCollapseClone){try{window._togCollapseClone.remove()}catch(e){}window._togCollapseClone=null}}
function _clearTogCollapseFallback(){if(_togCollapseFallbackTimer){clearTimeout(_togCollapseFallbackTimer);_togCollapseFallbackTimer=null}if(window._togCollapseFinalizeTimer){clearTimeout(window._togCollapseFinalizeTimer);window._togCollapseFinalizeTimer=null}_clearTogCollapseOverlay()}
function _detachTogCollapseTransition(){if(window._togCollapseEl&&window._togCollapseHandler){try{window._togCollapseEl.removeEventListener("transitionend",window._togCollapseHandler)}catch(e){}window._togCollapseEl=null;window._togCollapseHandler=null}}
function _commitTogPendingAt(id){if(id!=null)_togVisualPendingIds.delete(id);if(id==null)return;const tx=(T[sel]||[]).find(x=>x.id===id);if(tx&&!tx.done){pushUndo("切换完成");tx.done=true;tx.status="done"}}
function flushPendingTogIfAny(){if(_togPendingDoneId==null)return;_togCollapseGen++;_clearTogDoneTimer();_clearTogCollapseFallback();_detachTogCollapseTransition();const pid=_togPendingDoneId;_togPendingDoneId=null;window._chkRippleTaskId=null;_commitTogPendingAt(pid);rCal();rT();if(typeof rKanban==="function")rKanban();save()}
function _captureTaskListItemRects(list){var r={};if(!list)return r;try{list.querySelectorAll(".task-item").forEach(function(n){var id=n.getAttribute("data-id");if(id)r[id]=n.getBoundingClientRect()})}catch(e){}return r}
function _flipUpFromOldRects(list,rects){if(!list||!rects)return;try{var moves=[];list.querySelectorAll(".task-item").forEach(function(n){var id=n.getAttribute("data-id");var o=rects[id];if(!o)return;var r2=n.getBoundingClientRect();var dy=o.top-r2.top;if(Math.abs(dy)<1)return;moves.push(n);n.style.willChange="transform";n.style.transition="none";n.style.transform="translate3d(0,"+dy+"px,0)"});if(!moves.length)return;void list.offsetHeight;requestAnimationFrame(function(){moves.forEach(function(n){n.style.transition="transform 300ms cubic-bezier(0.16,1,0.3,1)";n.style.transform="translate3d(0,0,0)"})});setTimeout(function(){moves.forEach(function(n){try{n.style.transform="";n.style.transition="";n.style.willChange="auto"}catch(x){}})},360)}catch(e){}}
function _animateRemoveAndFlip(list,el,id,rects){var sc=list;var st=sc?sc.scrollTop:0;var collapsingH=0;if(el){try{collapsingH=el.getBoundingClientRect().height}catch(x){}}el.style.overflow="hidden";el.style.transition="height 300ms cubic-bezier(0.22,1,0.36,1),opacity 200ms ease";el.style.height=collapsingH+"px";el.style.maxHeight=collapsingH+"px";el.style.opacity="1";requestAnimationFrame(function(){requestAnimationFrame(function(){if(el)try{el.style.height="0";el.style.opacity="0"}catch(x){}})})}
function collapseTaskRowThenCommit(id){_clearTogCollapseFallback();_detachTogCollapseTransition();const gen=++_togCollapseGen;const sc=document.getElementById("tList");const el=(sc&&sc.querySelector('.task-item[data-id="'+id+'"]'))||document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');let settled=false;function finalize(){if(settled)return;settled=true;if(window._togCollapseFinalizeTimer){clearTimeout(window._togCollapseFinalizeTimer);window._togCollapseFinalizeTimer=null}_detachTogCollapseTransition();_clearTogCollapseOverlay();if(gen!==_togCollapseGen)return;if(_togPendingDoneId===null||_togPendingDoneId!==id)return;_togPendingDoneId=null;window._chkRippleTaskId=null;if(el&&el.isConnected){try{el.remove()}catch(x){}}const dt=T[sel]||[];const na=dt.filter(t=>!t.archived);const arch=dt.filter(t=>t.archived);const tot=na.length;const adn=arch.length;_commitTogPendingAt(id);syncTaskDetailPanelIfNeeded(id);rCal();const dn=na.filter(t=>t.done).length;const dfp=dn+adn;const pct=tot+adn>0?Math.round(dfp/(tot+adn)*100):0;let fl=na.filter(t=>passesFMulti(t));if(FTag)fl=fl.filter(t=>(t.tags||[]).includes(FTag));if(typeof rFilterBar==="function")rFilterBar();if(typeof renderTaskDash==="function")renderTaskDash(pct,tot+adn,dfp,na,fl,sel);if(typeof rKanban==="function")rKanban();save()}if(!el){finalize();return}const durMs=300;const ease="cubic-bezier(0.16,1,0.3,1)";const oldRects=_captureTaskListItemRects(sc);const box=el.getBoundingClientRect();const listBox=sc?sc.getBoundingClientRect():null;const clone=el.cloneNode(true);try{clone.removeAttribute("data-id");clone.querySelectorAll("[id]").forEach(function(n){n.removeAttribute("id")})}catch(e){}clone.classList.add("task-item--collapse-ghost");if(sc){clone.style.position="absolute";clone.style.left=box.left-listBox.left+sc.scrollLeft+"px";clone.style.top=box.top-listBox.top+sc.scrollTop+"px"}else{clone.style.position="fixed";clone.style.left=box.left+"px";clone.style.top=box.top+"px"}clone.style.width=box.width+"px";clone.style.height=box.height+"px";clone.style.margin="0";clone.style.zIndex="120";clone.style.pointerEvents="none";clone.style.overflow="hidden";clone.style.boxSizing="border-box";clone.style.contain="layout paint style";clone.style.backfaceVisibility="hidden";clone.style.webkitBackfaceVisibility="hidden";clone.style.transformOrigin="top left";clone.style.willChange="clip-path,opacity";clone.style.clipPath="inset(0 0 0 0)";clone.style.webkitClipPath="inset(0 0 0 0)";(sc||document.body).appendChild(clone);window._togCollapseClone=clone;try{el.style.visibility="hidden";el.remove()}catch(e){}if(sc)_flipUpFromOldRects(sc,oldRects);if(clone.animate){const anim=clone.animate([{clipPath:"inset(0 0 0 0)",opacity:1},{clipPath:"inset(0 0 100% 0)",opacity:0}],{duration:durMs,easing:ease,fill:"forwards"});window._togCollapseAnim=anim;anim.onfinish=function(){finalize()}}else{clone.style.transition="clip-path "+durMs+"ms "+ease+",-webkit-clip-path "+durMs+"ms "+ease+",opacity 220ms ease";window._togCollapseEl=clone;window._togCollapseHandler=function(ev){if(ev.target!==clone)return;if(ev.propertyName!=="clip-path"&&ev.propertyName!=="-webkit-clip-path")return;finalize()};clone.addEventListener("transitionend",window._togCollapseHandler);requestAnimationFrame(function(){requestAnimationFrame(function(){if(gen!==_togCollapseGen)return;clone.style.clipPath="inset(0 0 100% 0)";clone.style.webkitClipPath="inset(0 0 100% 0)";clone.style.opacity="0"})})}window._togCollapseFinalizeTimer=setTimeout(function(){window._togCollapseFinalizeTimer=null;finalize()},durMs+140)}
function playCheckSound(done){try{if(!window._auCtx)window._auCtx=new(window.AudioContext||window.webkitAudioContext);var ctx=window._auCtx;if(ctx.state==="suspended")ctx.resume();var t0=ctx.currentTime;var o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.connect(g);g.connect(ctx.destination);if(done){o.frequency.setValueAtTime(523,t0);o.frequency.exponentialRampToValueAtTime(784,t0+.08);o.frequency.exponentialRampToValueAtTime(1047,t0+.17);g.gain.setValueAtTime(1e-4,t0);g.gain.exponentialRampToValueAtTime(.09,t0+.02);g.gain.exponentialRampToValueAtTime(1e-4,t0+.34)}else{o.frequency.setValueAtTime(440,t0);o.frequency.exponentialRampToValueAtTime(311,t0+.1);g.gain.setValueAtTime(1e-4,t0);g.gain.exponentialRampToValueAtTime(.065,t0+.018);g.gain.exponentialRampToValueAtTime(1e-4,t0+.24)}o.start(t0);o.stop(t0+.42)}catch(e){}}
function finishDelayedTog(){_clearTogDoneTimer();if(_togPendingDoneId==null)return;const tid=_togPendingDoneId;const el=document.querySelector('#tList .task-item[data-id="'+tid+'"]')||document.querySelector('.task-item[data-id="'+tid+'"]');if(el&&el.isConnected)el.classList.remove("task-toggle-anim");collapseTaskRowThenCommit(tid)}
function restoreCanceledToggleRow(el){if(!el)return;try{el.classList.remove("task-main-checked","task-row-done","task-toggle-anim");el.style.transition="none";el.style.maxHeight="";el.style.height="";el.style.paddingTop="";el.style.paddingBottom="";el.style.borderBottomWidth="";el.style.opacity="";el.style.pointerEvents="";el.style.overflow="";el.style.willChange="";el.style.boxSizing="";void el.offsetHeight;el.style.transition=""}catch(e){}}
function tog(id){try{const docSel=window.getSelection&&window.getSelection();if(docSel&&docSel.removeAllRanges)docSel.removeAllRanges()}catch(e){}const t=(T[sel]||[]).find(x=>x.id===id);if(!t)return;if(!t.done&&_togVisualPendingIds.has(id)){_togCollapseGen++;_clearTogDoneTimer();_clearTogCollapseFallback();_detachTogCollapseTransition();_togPendingDoneId=null;_togVisualPendingIds.delete(id);window._chkRippleTaskId=null;const el=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');if(el){const ring=el.querySelector(".task-ck-slot .chk-ring")||el.querySelector(".chk-ring");const wrap=ring&&ring.closest(".task-ck-ring");if(ring){ring.classList.remove("checked","chk-ring--ripple");if(wrap)wrap.classList.remove("task-ck-ring--done")}el.classList.remove("task-main-checked","task-row-done","task-toggle-anim")}else{rT()}save();return}if(t.done){playCheckSound(false);_togCollapseGen++;_clearTogDoneTimer();_clearTogCollapseFallback();_detachTogCollapseTransition();if(_togPendingDoneId===id)_togPendingDoneId=null;_togVisualPendingIds.delete(id);pushUndo("切换完成");t.done=false;t.status="todo";t.archived=false;window._chkRippleTaskId=null;rCal();rT();syncTaskDetailPanelIfNeeded();if(typeof rKanban==="function")rKanban();save();return}flushPendingTogIfAny();_togVisualPendingIds.add(id);_togPendingDoneId=id;window._chkRippleTaskId=id;playCheckSound(true);_togDoneTimer=setTimeout(finishDelayedTog,520);const el=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');if(el){const ring=el.querySelector(".task-ck-slot .chk-ring")||el.querySelector(".chk-ring");const wrap=ring&&ring.closest(".task-ck-ring");if(ring){ring.classList.remove("chk-ring--ripple");void ring.offsetHeight;ring.classList.add("checked","chk-ring--ripple");if(wrap)wrap.classList.add("task-ck-ring--done")}el.classList.add("task-toggle-anim")}else{rT()}}
function del(id){pushUndo("删除");T[sel]=T[sel].filter(x=>x.id!==id);if(!T[sel].length)delete T[sel];rCal();rT();save();toast("🗑️ 已删除")}
function tog(id){
try{const docSel=window.getSelection&&window.getSelection();if(docSel&&docSel.removeAllRanges)docSel.removeAllRanges()}catch(e){}
const t=(T[sel]||[]).find(x=>x.id===id);
if(!t)return;
if(!t.done&&_togVisualPendingIds.has(id)){
_togCollapseGen++;
_clearTogDoneTimer();
_clearTogCollapseFallback();
_detachTogCollapseTransition();
_togPendingDoneId=null;
_togVisualPendingIds.delete(id);
window._chkRippleTaskId=null;
const el=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');
if(el){
const ring=el.querySelector(".task-ck-slot .chk-ring")||el.querySelector(".chk-ring");
const wrap=ring&&ring.closest(".task-ck-ring");
if(ring){
ring.classList.remove("checked","chk-ring--ripple");
if(wrap)wrap.classList.remove("task-ck-ring--done")
}
restoreCanceledToggleRow(el)
}else{rT()}
syncTaskDetailPanelIfNeeded(id);
save();
return
}
if(t.done){
playCheckSound(false);
_togCollapseGen++;
_clearTogDoneTimer();
_clearTogCollapseFallback();
_detachTogCollapseTransition();
if(_togPendingDoneId===id)_togPendingDoneId=null;
_togVisualPendingIds.delete(id);
pushUndo("切换完成");
t.done=false;
t.status="todo";
t.archived=false;
window._chkRippleTaskId=null;
rCal();
rT();
syncTaskDetailPanelIfNeeded(id);
if(typeof rKanban==="function")rKanban();
save();
return
}
flushPendingTogIfAny();
_togVisualPendingIds.add(id);
_togPendingDoneId=id;
window._chkRippleTaskId=id;
playCheckSound(true);
_togDoneTimer=setTimeout(finishDelayedTog,520);
const el=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');
if(el){
const ring=el.querySelector(".task-ck-slot .chk-ring")||el.querySelector(".chk-ring");
const wrap=ring&&ring.closest(".task-ck-ring");
if(ring){
ring.classList.remove("chk-ring--ripple");
void ring.offsetHeight;
ring.classList.add("checked","chk-ring--ripple");
if(wrap)wrap.classList.add("task-ck-ring--done")
}
el.classList.add("task-toggle-anim")
}else{rT()}
syncTaskDetailPanelIfNeeded(id)
}
function replayTitleEditIndicatorAnim(id){const item=document.querySelector('#tList .task-item[data-id="'+id+'"]');if(!item)return;item.classList.remove("task-item--title-editing-indicator-anim");void item.offsetWidth;requestAnimationFrame(()=>{if(!item||!item.classList)return;item.classList.add("task-item--title-editing-indicator-anim")})}
function startEdit(id){cancelDelayedToggleExpand();const prevItem=document.querySelector('#tList .task-item[data-id="'+id+'"]');const hadVisibleIndicator=!!(prevItem&&prevItem.classList&&prevItem.classList.contains("task-item--detail-active"));editingId=id;editingTimeId=null;expandedId=null;rT();setTimeout(()=>{if(!hadVisibleIndicator)replayTitleEditIndicatorAnim(id);const item=document.querySelector('#tList .task-item[data-id="'+id+'"]');const inp=item&&item.querySelector(".txt-edit")||document.querySelector(".txt-edit");if(inp){inp.focus();try{inp.select()}catch(e){inp.setSelectionRange(0,inp.value.length)}}},30)}
function saveEdit(id){const inp=document.querySelector(".txt-edit");if(!inp)return;const txt=inp.value.trim();const t=(T[sel]||[]).find(x=>x.id===id);if(t&&txt){t.text=txt;syncToRule(t)}editingId=null;rT();save()}
function cancelEdit(){editingId=null;rT()}
function dupTask(id){const t=(T[sel]||[]).find(x=>x.id===id);if(!t)return;const bid=Date.now();T[sel].push(mkTask(t.text,t.priority,t.planTime,t.duration,{tags:[...t.tags||[]],color:t.color,note:t.note||"",subtasks:(t.subtasks||[]).map((s,i)=>({id:bid+i+Math.floor(Math.random()*1e4),text:s.text,done:false}))}));rT();save();toast("📋 已复制")}
function openTimePillPicker(id){var el=document.getElementById("te_"+id);if(!el)return;try{if(typeof el.showPicker==="function"){el.showPicker();return}}catch(e){}try{el.focus();if(typeof el.showPicker==="function")el.showPicker()}catch(e2){}}
function startTimeEdit(id){editingTimeId=id;editingId=null;rT();setTimeout(()=>{const inp=document.getElementById("te_"+id)||document.querySelector(".te-input");if(inp){inp.focus();try{inp.select()}catch(e){}}},50)}
function cancelTimeEdit(){editingTimeId=null;rT()}
function saveTimeEdit(id){if(editingTimeId!==id)return;const inp=document.getElementById("te_"+id)||document.querySelector(".te-input");if(!inp)return;const t=(T[sel]||[]).find(x=>x.id===id);if(t){t.planTime=inp.value||"";syncToRule(t)}editingTimeId=null;rT();save()}
function removeTime(id){const t=(T[sel]||[]).find(x=>x.id===id);if(t){t.planTime="";syncToRule(t)}editingTimeId=null;rT();save()}
var _expandClickTimer=null,_expandDelayMs=220;
function cancelDelayedToggleExpand(){if(_expandClickTimer){clearTimeout(_expandClickTimer);_expandClickTimer=null}}
function scheduleToggleExpand(id){cancelDelayedToggleExpand();_expandClickTimer=setTimeout(function(){_expandClickTimer=null;toggleExpand(id)},_expandDelayMs)}
function onTaskRowAsideClick(id){cancelDelayedToggleExpand();if(multiSelect)toggleMSel(id);else{const _tw=(T[sel]||[]).find(function(x){return x.id===id});if(!_tw||!(_tw.subtasks||[]).length)return;toggleExpand(id)}}
function onTaskCheckSlotClick(e,id){
if(e){
e.stopPropagation();
e.__taskDetailBgHandled=true;
if(e.target&&e.target.closest&&e.target.closest(".chk-ring:not(.chk-ring--archived)"))return
}
cancelDelayedToggleExpand();
if(multiSelect){toggleMSel(id);return}
if(window.openTaskDetail)window.openTaskDetail(id);else onTaskRowAsideClick(id)
}
function onTaskRowCenterClick(e,id){
e.stopPropagation();
if(e.target.closest(".txt-edit"))return;
if(e.target.closest(".time-plain,.task-recur-badge")||(e.target.closest(".task-time-col")&&!e.target.closest(".sub-task-pill,.sub-task-pill-btn"))){
e.__taskDetailBgHandled=true;
cancelDelayedToggleExpand();
if(multiSelect)toggleMSel(id);else if(window.openTaskDetail)window.openTaskDetail(id);
return
}
if(e.target.closest(".txt-line")){
e.__taskDetailBgHandled=true;
cancelDelayedToggleExpand();
if(multiSelect)toggleMSel(id);else if(window.openTaskDetail)window.openTaskDetail(id);else onTaskRowAsideClick(id);
return
}
e.__taskDetailBgHandled=true;
cancelDelayedToggleExpand();
if(multiSelect)toggleMSel(id);else if(window.openTaskDetail)window.openTaskDetail(id);else onTaskRowAsideClick(id)
}
function onTaskStrikeWrapPaddingClick(e,id){
var w=e.currentTarget;
if(multiSelect){
if(e.target!==w&&!e.target.classList.contains("task-strike-content"))return;
e.stopPropagation();
cancelDelayedToggleExpand();
toggleMSel(id);
return
}
if(e.target.closest(".txt,.txt-edit"))return;
if(e.target!==w&&!e.target.classList.contains("task-strike-content"))return;
e.stopPropagation();
e.__taskDetailBgHandled=true;
cancelDelayedToggleExpand();
if(window.openTaskDetail)window.openTaskDetail(id);else onTaskRowAsideClick(id)
}
function onTaskItemMultiBackdrop(e,id){if(!multiSelect)return;var item=e.currentTarget,row=item.querySelector(".task-row");if(e.target!==item&&e.target!==row)return;e.stopPropagation();cancelDelayedToggleExpand();toggleMSel(id)}
function isTaskSubExpanded(id){const t=(T[sel]||[]).find(x=>x.id===id);if(!t)return false;const subT=Array.isArray(t.subtasks)?t.subtasks.length:0;if(!subT)return false;const defaultExp=t.showSubtasksByDefault!==false;const collapsedByUser=!!(collapsedSubtaskIds&&collapsedSubtaskIds.has&&collapsedSubtaskIds.has(id));return(expandedId===id||defaultExp)&&!collapsedByUser}
const SUBTASK_WRAP_OPEN_CLASS="is-subtask-open";
const SUBTASK_WRAP_OPENING_CLASS="is-subtask-opening";
const SUBTASK_WRAP_OPEN_MS=280;
const SUBTASK_WRAP_EASE="cubic-bezier(.22, 1, .36, 1)";
function cleanupSubtaskWrapMotion(wrap){
if(!wrap)return;
if(wrap.__subtaskOpenTimer){clearTimeout(wrap.__subtaskOpenTimer);wrap.__subtaskOpenTimer=null}
if(wrap.__subtaskEndHandler){
try{wrap.removeEventListener("transitionend",wrap.__subtaskEndHandler)}catch(e){}
wrap.__subtaskEndHandler=null
}
}
function getSubtaskWrapTargetHeight(wrap){
const area=wrap&&wrap.querySelector(".task-expand-area");
if(!area)return 0;
return Math.max(0,Math.ceil(area.scrollHeight||0))
}
function setSubtaskWrapOpenState(wrap,isOpen){
if(!wrap)return;
cleanupSubtaskWrapMotion(wrap);
const targetH=getSubtaskWrapTargetHeight(wrap);
const startH=Math.max(0,Math.ceil(wrap.getBoundingClientRect().height||0));
wrap.style.overflow="hidden";
wrap.style.willChange="height, opacity, transform";
wrap.style.transition="height "+SUBTASK_WRAP_OPEN_MS+"ms "+SUBTASK_WRAP_EASE+", opacity 220ms ease, transform "+SUBTASK_WRAP_OPEN_MS+"ms "+SUBTASK_WRAP_EASE;
if(isOpen){
wrap.classList.add(SUBTASK_WRAP_OPEN_CLASS);
wrap.classList.add(SUBTASK_WRAP_OPENING_CLASS);
wrap.removeAttribute("aria-hidden");
wrap.style.height=startH+"px";
wrap.style.opacity=startH>0?"1":"0";
void wrap.offsetHeight;
requestAnimationFrame(function(){
wrap.style.height=Math.max(targetH,1)+"px";
wrap.style.opacity="1"
});
const endHandler=function(ev){
if(ev.target!==wrap||ev.propertyName!=="height")return;
cleanupSubtaskWrapMotion(wrap);
wrap.classList.remove(SUBTASK_WRAP_OPENING_CLASS);
wrap.style.height="auto";
wrap.style.willChange=""
};
wrap.__subtaskEndHandler=endHandler;
wrap.addEventListener("transitionend",endHandler);
wrap.__subtaskOpenTimer=setTimeout(function(){
cleanupSubtaskWrapMotion(wrap);
wrap.classList.remove(SUBTASK_WRAP_OPENING_CLASS);
wrap.style.height="auto";
wrap.style.willChange=""
},SUBTASK_WRAP_OPEN_MS+120);
return
}
const nextStart=Math.max(startH,targetH,1);
wrap.style.height=nextStart+"px";
wrap.style.opacity="1";
void wrap.offsetHeight;
requestAnimationFrame(function(){
wrap.classList.remove(SUBTASK_WRAP_OPENING_CLASS);
wrap.classList.remove(SUBTASK_WRAP_OPEN_CLASS);
wrap.style.height="0px";
wrap.style.opacity="0"
});
const closeHandler=function(ev){
if(ev.target!==wrap||ev.propertyName!=="height")return;
cleanupSubtaskWrapMotion(wrap);
wrap.setAttribute("aria-hidden","true");
wrap.style.willChange=""
};
wrap.__subtaskEndHandler=closeHandler;
wrap.addEventListener("transitionend",closeHandler);
wrap.__subtaskOpenTimer=setTimeout(function(){
cleanupSubtaskWrapMotion(wrap);
wrap.setAttribute("aria-hidden","true");
wrap.style.willChange=""
},SUBTASK_WRAP_OPEN_MS+120)
}
function refreshTaskSubtaskExpandDOM(taskId){
const item=document.querySelector('#tList .task-item[data-id="'+taskId+'"]');
if(!item)return false;
const t=(T[sel]||[]).find(x=>x.id===taskId);
if(!t)return false;
const subT=Array.isArray(t.subtasks)?t.subtasks.length:0;
if(!subT)return false;
const isExp=isTaskSubExpanded(taskId);
const subD=(t.subtasks||[]).filter(function(s){return!!s.done}).length;
const subtaskSig=(t.subtasks||[]).map(function(s){return String(s.id)+":"+ (s.done?"1":"0")+":"+String(s.text||"")}).join("|");
const subPill=item.querySelector(".sub-task-pill-btn");
if(subPill){
subPill.classList.toggle("sub-task-pill--open",isExp);
subPill.classList.toggle("sub-task-pill--all-done",subT>0&&subD===subT);
subPill.setAttribute("aria-expanded",isExp?"true":"false");
subPill.setAttribute("title","\u5b50\u4efb\u52a1 "+subD+"/"+subT);
subPill.setAttribute("aria-label","\u5b50\u4efb\u52a1 "+subD+"/"+subT)
}
const oldWrap=item.querySelector(".exp-bg-wrap");
if(!oldWrap)return false;
if(!oldWrap.dataset.subtaskSig&&oldWrap.querySelector(".task-expand-area"))oldWrap.dataset.subtaskSig=subtaskSig;
if(!isExp){
setSubtaskWrapOpenState(oldWrap,false);
return true
}
if(oldWrap.dataset.subtaskSig===subtaskSig&&oldWrap.querySelector(".task-expand-area")){
setSubtaskWrapOpenState(oldWrap,true);
if(typeof ensureSubtaskGeometryResizeSync==="function")ensureSubtaskGeometryResizeSync();
if(typeof syncSubtaskGeometry==="function"){syncSubtaskGeometry();requestAnimationFrame(syncSubtaskGeometry)}
setTimeout(function(){if(typeof syncSubtaskGeometry==="function")syncSubtaskGeometry()},SUBTASK_WRAP_OPEN_MS+40);
if(typeof animateSubtaskStrikeLines==="function")animateSubtaskStrikeLines();
return true
}
if(typeof taskExpandAreaHTML!=="function")return false;
const html=taskExpandAreaHTML(t);
if(!html){
return true
}
oldWrap.innerHTML=html;
oldWrap.dataset.subtaskSig=subtaskSig;
setSubtaskWrapOpenState(oldWrap,true);
if(typeof ensureSubtaskGeometryResizeSync==="function")ensureSubtaskGeometryResizeSync();
if(typeof syncSubtaskGeometry==="function"){syncSubtaskGeometry();requestAnimationFrame(syncSubtaskGeometry)}
setTimeout(function(){if(typeof syncSubtaskGeometry==="function")syncSubtaskGeometry()},SUBTASK_WRAP_OPEN_MS+40);
if(typeof animateSubtaskStrikeLines==="function")animateSubtaskStrikeLines();
return true
}
function toggleExpand(id){
cancelDelayedToggleExpand();
if(!collapsedSubtaskIds||typeof collapsedSubtaskIds.has!=="function")collapsedSubtaskIds=new Set();
const t=(T[sel]||[]).find(x=>x.id===id);
if(!t)return;
const subT=Array.isArray(t.subtasks)?t.subtasks.length:0;
if(!subT)return;
const defaultExp=t.showSubtasksByDefault!==false;
const collapsedByUser=collapsedSubtaskIds.has(id);
const isExp=(expandedId===id||defaultExp)&&!collapsedByUser;
if(isExp){
expandedId=null;
if(defaultExp)collapsedSubtaskIds.add(id)
if(window._subtaskOpenAnimTaskId===id)window._subtaskOpenAnimTaskId=null
}else{
collapsedSubtaskIds.delete(id);
expandedId=defaultExp?null:id
window._subtaskOpenAnimTaskId=id;
setTimeout(function(){
if(window._subtaskOpenAnimTaskId===id)window._subtaskOpenAnimTaskId=null
},SUBTASK_WRAP_OPEN_MS+180)
}
const needFullRerender=editingId!=null||editingTimeId!=null||editingSubId!=null;
editingId=null;editingTimeId=null;editingSubId=null;ppOpenId=null;
if(needFullRerender||!refreshTaskSubtaskExpandDOM(id)){rT();return}
}
function closeTaskMoreFloat(){if(_taskMoreFloatEl){_taskMoreFloatEl.remove();_taskMoreFloatEl=null}document.querySelectorAll(".task-more-btn.is-open").forEach(function(b){b.classList.remove("is-open")});document.querySelectorAll(".task-item--menu-open").forEach(function(i){i.classList.remove("task-item--menu-open")})}
function taskMorePanelWrap(html){return'<div class="task-more-panel">'+html+"</div>"}
function taskMoreFloatSwapContent(el,btn,innerHtml,isFreqPanel){var panel=el&&el.querySelector(".task-more-panel");var done=0;var tmo=null;function mount(){if(done)return;done=1;if(tmo){clearTimeout(tmo);tmo=null}try{if(panel)panel.removeEventListener("transitionend",onTe)}catch(e){}if(isFreqPanel)el.classList.add("task-more-drop--freq");else el.classList.remove("task-more-drop--freq");el.innerHTML=taskMorePanelWrap(innerHtml);var np=el.querySelector(".task-more-panel");requestAnimationFrame(function(){requestAnimationFrame(function(){if(np)np.classList.add("task-more-panel--visible");if(btn)requestAnimationFrame(function(){positionTaskMoreFloatNearButton(btn,el);var w=el.offsetWidth;if(w){el.style.width=w+"px";el.style.minWidth=w+"px";el.style.maxWidth=w+"px";el.style.boxSizing="border-box"}})})})}function onTe(e){if(e.target!==panel)return;if(e.propertyName!=="opacity"&&e.propertyName!=="transform")return;mount()}if(panel){panel.classList.add("task-more-panel--out");tmo=setTimeout(mount,180);panel.addEventListener("transitionend",onTe)}else mount()}
function taskMoreMainMenuInnerHTML(id){var arr=typeof T!=="undefined"?T[sel]||[]:[];var t=arr.find(function(x){return+x.id===+id});if(!t)return"";var SVG_TM_POST='<svg class="task-more-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="17" cy="17" r="2.5"/><path d="M17 15.1V17h1.3"/></svg>';var SVG_TM_RECUR='<svg class="task-more-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';var SVG_TM_FRZ='<svg class="task-more-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M19 5L5 19M5 5l14 14"/></svg>';var fz=t.frozen?"解冻任务":"冻结任务";return'<button type="button" class="task-more-item" role="menuitem" onclick="taskMorePickPostpone('+id+')">'+SVG_TM_POST+'<span>推迟任务</span></button><button type="button" class="task-more-item" role="menuitem" onclick="taskMorePickRecur('+id+')">'+SVG_TM_RECUR+'<span>设置重复</span></button><button type="button" class="task-more-item task-more-item--freeze" role="menuitem" onclick="taskMorePickFreeze('+id+')">'+SVG_TM_FRZ+"<span>"+fz+"</span></button>"}
function positionTaskMoreFloatNearButton(btn,el){var br=btn.getBoundingClientRect();var dw=208;if(el.style.width&&el.style.width!=="auto"){dw=parseFloat(el.style.width)||el.offsetWidth||208}else{dw=Math.max(208,el.offsetWidth||208)}var left=br.right-dw;if(left<8)left=8;if(left+dw>window.innerWidth-8)left=Math.max(8,window.innerWidth-dw-8);el.style.position="fixed";el.style.left=left+"px";el.style.top=br.bottom+6+"px";el.style.right="auto";el.style.minWidth=dw+"px";el.style.maxWidth=dw+"px";el.style.boxSizing="border-box";el.style.zIndex="200"}
function openTaskMoreFloat(id){closeTaskMoreFloat();var item=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');if(!item)return;var btn=item.querySelector(".task-more-btn");if(!btn)return;var arr=typeof T!=="undefined"?T[sel]||[]:[];var t=arr.find(function(x){return+x.id===+id});if(!t||t.archived)return;var el=document.createElement("div");el.className="task-more-drop task-more-float";el.setAttribute("role","menu");el.onclick=function(e){e.stopPropagation()};el.innerHTML=taskMorePanelWrap(taskMoreMainMenuInnerHTML(id));document.body.appendChild(el);_taskMoreFloatEl=el;requestAnimationFrame(function(){positionTaskMoreFloatNearButton(btn,el);var w=el.offsetWidth;if(w){el.style.width=w+"px";el.style.minWidth=w+"px";el.style.maxWidth=w+"px";el.style.boxSizing="border-box"}var p=el.querySelector(".task-more-panel");if(p)requestAnimationFrame(function(){requestAnimationFrame(function(){p.classList.add("task-more-panel--visible")})})});btn.classList.add("is-open");item.classList.add("task-item--menu-open")}
function showTaskMorePostponePanel(id){var el=_taskMoreFloatEl;var item=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');if(!el||!item)return;var btn=item.querySelector(".task-more-btn");if(!btn)return;var SVG_BACK='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';function postponeLbl(n){var d=new Date(now);d.setDate(d.getDate()+n);var wk="周"+WD[d.getDay()];var dm=d.getDate()+"号";if(n===1)return"明天";if(n===2)return"后天";var cn=["","","","三","四","五","六","七"];return"第"+cn[n]+"天("+wk+dm+")"}var inner='<div class="task-more-freq-hd"><button type="button" class="task-more-back" aria-label="返回" onclick="event.stopPropagation();taskMorePostponeBack('+id+')">'+SVG_BACK+'</button><span class="task-more-freq-title">推迟至</span></div>';for(var n=1;n<=7;n++){inner+='<button type="button" class="task-more-freq-row" role="menuitem" onclick="event.stopPropagation();taskMorePostponeByOffset('+id+","+n+')"><span>'+postponeLbl(n)+"</span></button>"}inner+='<div class="task-more-pp-divider"></div>'+'<button type="button" class="task-more-freq-adv" role="menuitem" onclick="event.stopPropagation();taskMorePostponePickDate('+id+')"><span>选择具体日期…</span></button>';taskMoreFloatSwapContent(el,btn,inner,true)}
function taskMorePostponeBack(id){var el=_taskMoreFloatEl;if(!el)return;var item=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');var btn=item?item.querySelector(".task-more-btn"):null;taskMoreFloatSwapContent(el,btn,taskMoreMainMenuInnerHTML(id),false)}
function taskMorePostponePickDate(id){closeTaskMoreFloat();taskMoreMenuId=null;postponeCustom(id)}
function showTaskMoreRecurFreqPanel(id){var el=_taskMoreFloatEl;var item=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');if(!el||!item)return;var btn=item.querySelector(".task-more-btn");if(!btn)return;var t=(T[sel]||[]).find(function(x){return+x.id===+id});var SVG_BACK='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';var rowNone="";if(t&&t.recurRuleId){var SVG_NO='<svg class="task-more-freq-clear-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';rowNone='<button type="button" class="task-more-freq-row task-more-freq-row--clear" role="menuitem" onclick="event.stopPropagation();taskMorePickRecurNone('+id+')">'+SVG_NO+"<span>不重复 (取消重复)</span></button>"}var dayOfWeek=WD[parseDS(sel).getDay()];var dayOfMonth=parseDS(sel).getDate();var freqInner='<div class="task-more-freq-hd"><button type="button" class="task-more-back" aria-label="返回" onclick="event.stopPropagation();taskMoreRecurFreqBack('+id+')">'+SVG_BACK+'</button><span class="task-more-freq-title">重复频率</span></div>'+rowNone+'<button type="button" class="task-more-freq-row" role="menuitem" onclick="event.stopPropagation();taskMorePickRecurDaily('+id+')">每天</button><button type="button" class="task-more-freq-row" role="menuitem" onclick="event.stopPropagation();taskMorePickRecurWeekly('+id+')">每周 (周'+dayOfWeek+')</button><button type="button" class="task-more-freq-row" role="menuitem" onclick="event.stopPropagation();taskMorePickRecurMonthly('+id+')">每月 (每月'+dayOfMonth+'号)</button><button type="button" class="task-more-freq-adv" onclick="event.stopPropagation();taskMorePickRecurAdv('+id+')">自定义高级规则…</button>';taskMoreFloatSwapContent(el,btn,freqInner,true)}
function taskMoreRecurFreqBack(id){var el=_taskMoreFloatEl;if(!el)return;var item=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');var btn=item?item.querySelector(".task-more-btn"):null;taskMoreFloatSwapContent(el,btn,taskMoreMainMenuInnerHTML(id),false)}
function taskMorePickRecurNone(id){var t=(T[sel]||[]).find(function(x){return+x.id===+id});if(!t||!t.recurRuleId)return;deleteRecurRule(t.recurRuleId,true);closeTaskMoreFloat();taskMoreMenuId=null;rT();toast("已取消重复")}
function taskMorePickRecurDaily(id){addRecurRule(id,"daily");closeTaskMoreFloat();taskMoreMenuId=null}
function taskMorePickRecurWeekly(id){addRecurRule(id,"weekly");closeTaskMoreFloat();taskMoreMenuId=null}
function taskMorePickRecurMonthly(id){addRecurRule(id,"monthly");closeTaskMoreFloat();taskMoreMenuId=null}
function taskMorePickRecurAdv(id){closeTaskMoreFloat();taskMoreMenuId=null;openCustomRepeatModal(id)}
function toggleTaskMoreMenu(id){cancelDelayedToggleExpand();var wasOpen=taskMoreMenuId===id;taskMoreMenuId=wasOpen?null:id;closeTaskMoreFloat();if(!wasOpen){var taskItem=document.querySelector('#tList .task-item[data-id="'+id+'"]')||document.querySelector('.task-item[data-id="'+id+'"]');if(taskItem)taskItem.classList.add("task-item--menu-open");requestAnimationFrame(function(){openTaskMoreFloat(taskMoreMenuId)})}}
function taskMorePickPostpone(id){showTaskMorePostponePanel(id)}
function taskMorePickRecur(id){showTaskMoreRecurFreqPanel(id)}
function taskMorePickFreeze(id){closeTaskMoreFloat();taskMoreMenuId=null;toggleFreeze(id)}
function clM(){document.getElementById("mBg").classList.remove("show");if(typeof window.__mainModalCleanup==="function"){try{window.__mainModalCleanup()}catch(e){}window.__mainModalCleanup=null}}
function showMobileTaskSheet(id){const t=(T[sel]||[]).find(x=>x.id===id);if(!t)return;const isArch=!!t.archived;const exp=isTaskSubExpanded(id);let h="";if(isArch){h=`<div class="m-sheet-wrap"><p class="m-sheet-title">${esc(t.text)}</p><div class="m-sheet-actions"><button type="button" class="m-sheet-btn m-sheet-btn--secondary" onclick="clM();toggleExpand(${id})">展开详情</button><button type="button" class="m-sheet-btn m-sheet-btn--accent" onclick="clM();restoreArchived('${sel}',${id})">恢复任务</button><button type="button" class="m-sheet-btn m-sheet-btn--ghost" onclick="clM()">取消</button></div></div>`}else{h=`<div class="m-sheet-wrap"><p class="m-sheet-title">${esc(t.text)}</p><div class="m-sheet-actions"><button type="button" class="m-sheet-btn m-sheet-btn--secondary" onclick="clM();toggleExpand(${id})">${exp?"收起详情":"展开详情"}</button><button type="button" class="m-sheet-btn m-sheet-btn--danger" onclick="clM();del(${id})">删除任务</button><button type="button" class="m-sheet-btn m-sheet-btn--ghost" onclick="clM()">取消</button></div></div>`}document.getElementById("mBody").innerHTML=h;document.getElementById("mBg").classList.add("show")}
function bindMobileTaskLongPress(){if(window._mlpBind)return;window._mlpBind=1;const list=document.getElementById("tList");if(!list)return;let lpT=null;function clr(){if(lpT){clearTimeout(lpT);lpT=null}}function mob(){return window.matchMedia("(max-width:640px)").matches}list.addEventListener("touchstart",function(e){if(!mob())return;const item=e.target.closest(".task-item");if(!item)return;if(e.target.closest(".task-expand-area,.drag-handle,.task-ck-slot,.ms-ck,.task-prio-pill,input,textarea,button,a[href]"))return;const id=+item.dataset.id;if(!id)return;clr();lpT=setTimeout(function(){lpT=null;if(navigator.vibrate)try{navigator.vibrate(10)}catch(_){}showMobileTaskSheet(id)},500)},{passive:true});list.addEventListener("touchmove",function(e){if(lpT)clr()},{passive:true});list.addEventListener("touchend",clr,{passive:true});list.addEventListener("touchcancel",clr,{passive:true})}
bindMobileTaskLongPress();
function batchDone(){flushPendingTogIfAny();pushUndo("全部完成");(T[sel]||[]).filter(t=>!t.frozen&&!t.archived).forEach(t=>{t.done=true;t.status="done"});rCal();rT();save();toast("✅ 全部已标记完成")}
function toggleSubtask(tid,sid){
const t=(T[sel]||[]).find(x=>x.id===tid);
if(!t)return;
const s=(t.subtasks||[]).find(x=>x.id===sid);
if(!s)return;
s.done=!s.done;
rT();
save()
}
function deleteSubtask(tid,sid){const t=(T[sel]||[]).find(x=>x.id===tid);if(!t)return;t.subtasks=(t.subtasks||[]).filter(x=>x.id!==sid);syncToRule(t);rT();save()}
function startEditSub(tid,sid){editingSubId=sid;rT();setTimeout(()=>{const inp=document.getElementById("subEdit_"+sid);if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}},30)}
function saveEditSub(tid,sid){const inp=document.getElementById("subEdit_"+sid);if(!inp)return;const txt=inp.value.trim();const t=(T[sel]||[]).find(x=>x.id===tid);if(t&&t.subtasks){const s=t.subtasks.find(x=>x.id===sid);if(s&&txt)s.text=txt}editingSubId=null;syncToRule(t);rT();save()}
function saveNote(tid){const ta=document.getElementById("note_"+tid);if(!ta)return;const t=(T[sel]||[]).find(x=>x.id===tid);if(t){t.note=ta.value;syncToRule(t)}save()}
function saveDuration(tid){const inp=document.getElementById("dur_"+tid);if(!inp)return;const t=(T[sel]||[]).find(x=>x.id===tid);if(t){t.duration=Math.max(0,parseInt(inp.value)||0);syncToRule(t)}rT();save()}
function setTaskColor(tid,c){const t=(T[sel]||[]).find(x=>x.id===tid);if(t){t.color=c;syncToRule(t)}rT();save()}
function toggleTaskTag(tid,tagId){const t=(T[sel]||[]).find(x=>x.id===tid);if(!t)return;if(!t.tags)t.tags=[];const i=t.tags.indexOf(tagId);if(i>=0)t.tags.splice(i,1);else t.tags.push(tagId);syncToRule(t);rT();rTagDropdownContent();save()}
function taskTimeAccent(planTime,dateStr){const dk=document.body.classList.contains("dark");const L=(a,b,c)=>({text:dk?b:a,rail:dk?c[1]:c[0],bg:dk?c[3]:c[2]});const none=L("#8e9bab","#94a3b8",["#e5e7eb","#475569","linear-gradient(180deg,#f4f7fa 0%,#eef1f5 100%)","linear-gradient(180deg,rgba(30,41,59,.55) 0%,rgba(15,23,42,.2) 100%)"]);if(!planTime)return none;const m=String(planTime).trim().match(/^(\d{1,2}):(\d{2})/);if(!m)return none;const base=parseDS(dateStr);const taskAt=new Date(base.getFullYear(),base.getMonth(),base.getDate(),+m[1],+m[2],0,0);const deltaMin=(taskAt-Date.now())/6e4;if(deltaMin<=0)return L("#c73e3e","#fca5a5",["#f0b0b0","#991b1b","linear-gradient(180deg,#fff0f1 0%,#fff7f7 100%)","linear-gradient(180deg,rgba(153,27,27,.28) 0%,rgba(30,41,59,.4) 100%)"]);if(deltaMin<=35)return L("#d45545","#fb923c",["#f0b8a8","#c2410c","linear-gradient(180deg,#fff5f0 0%,#fffdfb 100%)","linear-gradient(180deg,rgba(234,88,12,.2) 0%,rgba(30,41,59,.35) 100%)"]);if(deltaMin<=120)return L("#e07030","#fdba74",["#f0c8a8","#ea580c","linear-gradient(180deg,#fff8f2 0%,#fffcfa 100%)","linear-gradient(180deg,rgba(234,88,12,.12) 0%,rgba(30,41,59,.28) 100%)"]);if(deltaMin<=360)return L("#c9922e","#fbbf24",["#e8d8b8","#b45309","linear-gradient(180deg,#fffbf5 0%,#fdfcfa 100%)","linear-gradient(180deg,rgba(180,83,9,.14) 0%,rgba(30,41,59,.25) 100%)"]);if(deltaMin<=1440)return L("#4f6fa8","#93c5fd",["#b8ccea","#1d4ed8","linear-gradient(180deg,#f3f6fc 0%,#f7f9fd 100%)","linear-gradient(180deg,rgba(37,99,235,.16) 0%,rgba(30,41,59,.32) 100%)"]);return L("#6c7d95","#94a3b8",["#c5cedd","#64748b","linear-gradient(180deg,#f1f4f8 0%,#f6f8fb 100%)","linear-gradient(180deg,rgba(71,85,105,.22) 0%,rgba(30,41,59,.28) 100%)"])}
function taskListCkRing(id,done,priority,archived,prioStrokeHex){let hex;if(archived){hex=/^#[0-9A-Fa-f]{6}$/.test(String(prioStrokeHex||""))?String(prioStrokeHex):prioColor(priority)||"#8b5cf6"}else if((priority||"normal")==="high"){hex=prioColor(priority)||"#ef4444"}else{hex="#94a3b8"}const chk='<svg class="chk-ring-ico" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.15 12.35 10.95 16.05 17.1 8.2" stroke="currentColor" stroke-width="2.55" stroke-linecap="round" stroke-linejoin="round"/></svg>';if(archived){return`<div class="task-ck-ring task-ck-ring--archived" style="--ck-prio:${hex}"><div class="tc-check"><div class="chk-ring chk-ring--archived">${chk}</div></div></div>`}const prioHighCls=(priority||"normal")==="high"?" task-ck-ring--prio-high":"";const ringCls="task-ck-ring"+(done?" task-ck-ring--done":"")+prioHighCls;const rip=done&&window._chkRippleTaskId==id?" chk-ring--ripple":"";return`<div class="${ringCls}" style="--ck-prio:${hex}"><div class="tc-check"><div class="chk-ring${done?" checked":""}${rip}" onmousedown="event.stopPropagation()" onclick="event.stopPropagation();tog(${id})">${chk}</div></div></div>`}

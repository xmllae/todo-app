// 今日行动面板：根据当前任务列表生成下一步建议和快捷入口。
function taskFlowIsPendingTask(t){
  return !!t && !t.archived && !t.done && !t.frozen
}

function taskFlowIsViewFiltered(){
  const hasTag=typeof FTag!=="undefined"&&!!FTag;
  const hasCustomStatus=typeof FMulti!=="undefined"&&FMulti&&(
    FMulti.size!==1||!FMulti.has("pending")
  );
  return !!(hasTag||hasCustomStatus)
}

function taskFlowDurationText(minutes){
  const n=parseInt(minutes,10)||0;
  if(n<=0)return"";
  if(n<60)return n+" 分钟";
  const h=Math.floor(n/60),m=n%60;
  return m?h+" 小时 "+m+" 分钟":h+" 小时"
}

function taskFlowTaskMetaText(t){
  if(!t)return"";
  const parts=[];
  if(t.planTime){
    const raw=typeof formatPlanTimeDisp==="function"?formatPlanTimeDisp(t.planTime):t.planTime;
    const timeText=typeof taskRowPlainTimeText==="function"?taskRowPlainTimeText(t,raw):raw;
    parts.push(timeText)
  }else{
    parts.push("全天")
  }
  if((t.priority||"normal")==="high")parts.push("高优先级");
  const dur=taskFlowDurationText(t.duration);
  if(dur)parts.push("预计 "+dur);
  return parts.join(" · ")
}

function taskFlowPlanMinute(t){
  const raw=String(t&&t.planTime||"");
  const m=raw.match(/^(\d{1,2}):(\d{2})$/);
  if(!m)return null;
  return Math.max(0,Math.min(1439,+m[1]*60+(+m[2]||0)))
}

function taskFlowSortCandidate(a,b){
  const ah=(a.priority||"normal")==="high",bh=(b.priority||"normal")==="high";
  if(ah!==bh)return ah?-1:1;
  const at=taskFlowPlanMinute(a),bt=taskFlowPlanMinute(b);
  if(at!==null&&bt!==null&&at!==bt)return at-bt;
  if(at!==null&&bt===null)return-1;
  if(at===null&&bt!==null)return 1;
  return(a.created||0)-(b.created||0)
}

function taskFlowPickNextTask(displayList,allTasks,viewFiltered){
  const visiblePending=(displayList||[]).filter(taskFlowIsPendingTask);
  if(visiblePending.length)return visiblePending[0];
  if(viewFiltered)return null;
  const pending=(allTasks||[]).filter(taskFlowIsPendingTask);
  if(!pending.length)return null;
  return pending.slice().sort(taskFlowSortCandidate)[0]
}

function taskFlowOpenAdd(){
  if(typeof showAddTaskRow==="function")showAddTaskRow();
  const hold=document.getElementById("addTaskInlineHold");
  if(hold&&typeof hold.scrollIntoView==="function"){
    const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    hold.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"})
  }
}

function taskFlowOpenQuickImport(){
  if(typeof toggleQuickImport==="function")toggleQuickImport()
}

function taskFlowToggleMulti(){
  if(typeof toggleMultiSelect==="function")toggleMultiSelect()
}

function taskFlowOpenDetail(taskId){
  if(window.openTaskDetail)window.openTaskDetail(taskId);
  else if(typeof openTaskDrawer==="function")openTaskDrawer(taskId)
}

function taskFlowStartFocus(taskId){
  if(typeof focusTimerLoad==="function"&&(typeof _ftO==="undefined"||!_ftO))focusTimerLoad();
  if(typeof _ftO==="undefined"||!_ftO){
    if(typeof toast==="function")toast("专注计时器暂不可用");
    return
  }
  _ftO.task={d:sel,id:+taskId};
  const modeChanged=_ftO.mode!=="focus";
  _ftO.mode="focus";
  const total=typeof focusTimerTotalSec==="function"?focusTimerTotalSec():1500;
  if(modeChanged||!_ftO.rem||_ftO.rem<=0||_ftO.rem>total)_ftO.rem=total;
  _ftO.run=1;
  _ftO.p=0;
  _ftO.end=Date.now()+Math.max(1,_ftO.rem)*1000;
  if(typeof focusTimerSave==="function")focusTimerSave();
  if(typeof focusTimerPaint==="function")focusTimerPaint();
  if(typeof rT==="function")rT();
  if(typeof toast==="function")toast("已开始专注")
}

function taskFlowSummaryHTML(displayList,allTasks,filteredTasks,options){
  const opts=options||{},list=Array.isArray(displayList)?displayList:[],all=Array.isArray(allTasks)?allTasks:[],filtered=Array.isArray(filteredTasks)?filteredTasks:list;
  const viewFiltered=taskFlowIsViewFiltered();
  const total=all.length,done=all.filter(function(t){return t.done}).length,pending=all.filter(taskFlowIsPendingTask).length;
  const high=all.filter(function(t){return taskFlowIsPendingTask(t)&&(t.priority||"normal")==="high"}).length;
  const scheduled=all.filter(function(t){return taskFlowIsPendingTask(t)&&!!t.planTime}).length;
  const pct=total?Math.round(done/total*100):0;
  const nextTask=taskFlowPickNextTask(list,all,viewFiltered);
  const viewEmpty=opts.isEmpty||!filtered.length;
  let title="",meta="";
  if(viewFiltered&&viewEmpty&&total){
    title="当前视图没有匹配任务";
    meta="可以切换筛选条件，或继续补充今天的任务。"
  }else if(pending){
    title="今天还有 "+pending+" 项待办";
    meta="已完成 "+done+" / "+total+"，完成度 "+pct+"%。"
  }else if(total){
    title="今天已全部完成";
    meta="已完成 "+done+" / "+total+"，可以继续补充安排。"
  }else{
    title="今天还没有安排";
    meta="先添加一个任务，页面会自动生成今日进度。"
  }
  const nextTitle=nextTask?esc(nextTask.text):(pending?"当前筛选下暂无可执行任务":total?"今天已清空":"先添加一个任务");
  const nextMeta=nextTask?taskFlowTaskMetaText(nextTask):(pending?"切换到待办视图可继续处理。":"适合整理明天或本周安排。");
  const nextActions=nextTask
    ?'<div class="task-flow-summary__next-actions"><button type="button" class="task-flow-summary__btn task-flow-summary__btn--compact task-flow-summary__btn--primary" data-task-flow-action="focus" data-task-id="'+nextTask.id+'">开始专注</button><button type="button" class="task-flow-summary__btn task-flow-summary__btn--compact" data-task-flow-action="detail" data-task-id="'+nextTask.id+'">看详情</button></div>'
    :'<div class="task-flow-summary__next-actions"><button type="button" class="task-flow-summary__btn task-flow-summary__btn--compact task-flow-summary__btn--primary" data-task-flow-action="add">添加任务</button></div>';
  const multiAction=total?'<button type="button" class="task-flow-summary__btn" data-task-flow-action="multi">多选整理</button>':"";
  return'<section class="task-flow-summary" aria-label="今日行动概览"><div class="task-flow-summary__main"><div class="task-flow-summary__eyebrow">今日行动</div><div class="task-flow-summary__title">'+esc(title)+'</div><div class="task-flow-summary__meta">'+esc(meta)+'</div><div class="task-flow-summary__stats" aria-label="今日任务数据"><span class="task-flow-summary__stat"><b>'+pending+'</b>待办</span><span class="task-flow-summary__stat"><b>'+done+'</b>完成</span><span class="task-flow-summary__stat"><b>'+high+'</b>高优先</span><span class="task-flow-summary__stat"><b>'+scheduled+'</b>定时</span></div></div><div class="task-flow-summary__next"><div class="task-flow-summary__next-label">下一步</div><div class="task-flow-summary__next-title" title="'+esc(nextTitle)+'">'+esc(nextTitle)+'</div><div class="task-flow-summary__next-meta" title="'+esc(nextMeta)+'">'+esc(nextMeta)+'</div>'+nextActions+'</div><div class="task-flow-summary__actions"><button type="button" class="task-flow-summary__btn task-flow-summary__btn--primary" data-task-flow-action="add">继续添加</button><button type="button" class="task-flow-summary__btn" data-task-flow-action="import">快速导入</button>'+multiAction+'</div></section>'
}

function taskFlowBindSummary(summary){
  if(!summary||summary.dataset.bound==="1")return;
  summary.dataset.bound="1";
  summary.addEventListener("click",function(e){
    const btn=e.target.closest("[data-task-flow-action]");
    if(!btn||!summary.contains(btn))return;
    const action=btn.dataset.taskFlowAction;
    const taskId=parseInt(btn.dataset.taskId,10);
    if(action==="focus"&&taskId)taskFlowStartFocus(taskId);
    else if(action==="detail"&&taskId)taskFlowOpenDetail(taskId);
    else if(action==="add")taskFlowOpenAdd();
    else if(action==="import")taskFlowOpenQuickImport();
    else if(action==="multi")taskFlowToggleMulti()
  })
}

function taskFlowCurrentDisplayList(){
  const dt=typeof T!=="undefined"&&T[sel]?T[sel]:[];
  const nonArchived=dt.filter(function(t){return!t.archived});
  let filtered=nonArchived.filter(function(t){return typeof passesFMulti==="function"?passesFMulti(t):true});
  if(typeof FTag!=="undefined"&&FTag)filtered=filtered.filter(function(t){return(t.tags||[]).includes(FTag)});
  let displayList=filtered,activeSortMode="";
  if(typeof sortStates!=="undefined"&&sortStates&&sortStates[sel])activeSortMode=normalizeSortMode(sortStates[sel]);
  else if(typeof autoSortEnabled!=="undefined"&&autoSortEnabled)activeSortMode=normalizeSortMode(defaultSortMode||lastSort||"created");
  if(activeSortMode&&displayList.length>1&&typeof sortDisplayList==="function")displayList=sortDisplayList(displayList.slice(),activeSortMode);
  return{displayList:displayList,nonArchived:nonArchived,filtered:filtered}
}

function taskFlowInjectSummary(){
  const list=document.getElementById("tList");
  if(!list)return;
  const old=list.querySelector(".task-flow-summary");
  if(old)old.remove();
  if(typeof getTaskQuickMode==="function"&&getTaskQuickMode()==="week")return;
  const data=taskFlowCurrentDisplayList();
  const html=taskFlowSummaryHTML(data.displayList,data.nonArchived,data.filtered,{isEmpty:!data.displayList.length});
  list.insertAdjacentHTML("beforeend",html);
  taskFlowBindSummary(list.querySelector(".task-flow-summary"))
}

if(typeof rT==="function"&&!window.__taskFlowSummaryBound){
  window.__taskFlowSummaryBound=true;
  const taskFlowOriginalRender=rT;
  rT=function(){
    const result=taskFlowOriginalRender.apply(this,arguments);
    taskFlowInjectSummary();
    return result
  }
}

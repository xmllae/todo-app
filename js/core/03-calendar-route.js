// Date state refresh hook. The old side calendar has been removed.
function rCal(){const panel=document.getElementById("taskDatePicker");if(panel&&panel.classList.contains("is-open")&&typeof renderTaskDatePicker==="function")renderTaskDatePicker()}
function getGlobalQuickMode(){return typeof getGlobalSideNavQuickMode==="function"?getGlobalSideNavQuickMode():""}
function clearGlobalQuickMode(){if(typeof setGlobalSideNavQuickMode==="function")setGlobalSideNavQuickMode("",true)}
let _taskTitleNoMotionBudget=0;
let _taskTitleNoMotionUntil=0;
let _taskTitleNoMotionClassTimer=null;
function syncTaskTitleNoMotionClass(){
  const taskModeEl=document.getElementById("taskMode");
  if(!taskModeEl)return;
  taskModeEl.classList.add("task-mode--title-no-motion");
  if(_taskTitleNoMotionClassTimer){
    clearTimeout(_taskTitleNoMotionClassTimer);
    _taskTitleNoMotionClassTimer=null;
  }
  _taskTitleNoMotionClassTimer=setTimeout(function(){
    const el=document.getElementById("taskMode");
    if(el)el.classList.remove("task-mode--title-no-motion");
    _taskTitleNoMotionClassTimer=null;
  },420);
}
function markTaskTitleNoMotion(){
  // Side-nav jumps can trigger a few sync re-renders in a row, so keep
  // a short-lived budget instead of a single one-shot flag.
  _taskTitleNoMotionBudget=6;
  _taskTitleNoMotionUntil=Date.now()+500;
  syncTaskTitleNoMotionClass();
}
function consumeTaskTitleNoMotion(){
  if(_taskTitleNoMotionBudget<=0)return false;
  if(Date.now()>_taskTitleNoMotionUntil){
    _taskTitleNoMotionBudget=0;
    _taskTitleNoMotionUntil=0;
    return false;
  }
  _taskTitleNoMotionBudget=Math.max(0,_taskTitleNoMotionBudget-1);
  if(_taskTitleNoMotionBudget===0)_taskTitleNoMotionUntil=0;
  return true;
}
window.markTaskTitleNoMotion=markTaskTitleNoMotion;
window.consumeTaskTitleNoMotion=consumeTaskTitleNoMotion;
function goToday(keepWeekMode){flushPendingTogIfAny();const qm=getGlobalQuickMode();if(keepWeekMode&&qm==="week"){if(typeof setGlobalSideNavQuickMode==="function")setGlobalSideNavQuickMode("week",true)}else clearGlobalQuickMode();cY=now.getFullYear();cM=now.getMonth();sel=fd(now);expandedId=null;if(typeof clearSubtaskCollapseOverrides==="function")clearSubtaskCollapseOverrides();closeTaskMoreFloat();taskMoreMenuId=null;rCal();rAll()}
function pick(ds){flushPendingTogIfAny();clearGlobalQuickMode();sel=ds;const p=ds.split("-");cY=+p[0];cM=+p[1]-1;expandedId=null;if(typeof clearSubtaskCollapseOverrides==="function")clearSubtaskCollapseOverrides();closeTaskMoreFloat();taskMoreMenuId=null;rCal();rAll()}
function quickGo(o){if(o===0){goToday(getGlobalQuickMode()==="week");return}flushPendingTogIfAny();const qm=getGlobalQuickMode();const d=parseDS(sel);d.setDate(d.getDate()+(qm==="week"?o*7:o));sel=fd(d);if(qm!=="week")clearGlobalQuickMode();cY=d.getFullYear();cM=d.getMonth();expandedId=null;if(typeof clearSubtaskCollapseOverrides==="function")clearSubtaskCollapseOverrides();closeTaskMoreFloat();taskMoreMenuId=null;rCal();rAll()}
var _taskDatePickerYear=0,_taskDatePickerMonth=0,_taskDatePickerDocBound=false;
function taskDatePickerIsDateKey(ds){return typeof ds==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(ds)}
function taskDatePickerBaseDate(){try{return taskDatePickerIsDateKey(sel)?parseDS(sel):new Date(now)}catch(e){return new Date(now)}}
function taskDatePickerMonthLabel(y,m){return y+"\u5e74"+(m+1)+"\u6708"}
function taskDatePickerWeekStart(ds){const d=taskDatePickerIsDateKey(ds)?parseDS(ds):new Date(now);d.setHours(0,0,0,0);const diff=d.getDay()===0?-6:1-d.getDay();d.setDate(d.getDate()+diff);return fd(d)}
function ensureTaskDatePicker(){
  const nav=document.querySelector("#taskMode .task-main-col > .task-card > .date-nav");
  if(!nav)return null;
  const title=nav.querySelector("h3");
  if(title&&!title.dataset.datePickerBound){
    title.dataset.datePickerBound="1";
    title.removeAttribute("onclick");
    title.setAttribute("role","button");
    title.setAttribute("tabindex","0");
    title.setAttribute("aria-haspopup","dialog");
    title.setAttribute("aria-controls","taskDatePicker");
    title.setAttribute("aria-expanded","false");
    title.addEventListener("click",toggleTaskDatePicker);
    title.addEventListener("keydown",function(e){
      if(e.key==="Enter"||e.key===" "){e.preventDefault();toggleTaskDatePicker(e)}
      else if(e.key==="Escape")closeTaskDatePicker()
    })
  }
  let panel=document.getElementById("taskDatePicker");
  if(!panel){
    panel=document.createElement("div");
    panel.id="taskDatePicker";
    panel.className="task-date-picker-popover";
    panel.setAttribute("role","dialog");
    panel.setAttribute("aria-label","\u9009\u62e9\u65e5\u671f");
    panel.setAttribute("aria-hidden","true");
    nav.appendChild(panel);
    panel.addEventListener("click",function(e){
      e.stopPropagation();
      const btn=e.target.closest("[data-tdp-action]");
      if(!btn)return;
      const action=btn.getAttribute("data-tdp-action");
      if(action==="prev")changeTaskDatePickerMonth(-1);
      else if(action==="next")changeTaskDatePickerMonth(1);
      else if(action==="pick")pickTaskDatePickerDate(btn.getAttribute("data-ds")||"");
      else if(action==="today")pickTaskDatePickerDate(fd(now));
      else if(action==="tomorrow"){const d=new Date(now);d.setDate(d.getDate()+1);pickTaskDatePickerDate(fd(d))}
      else if(action==="week")pickTaskDatePickerWeek(0);
      else if(action==="next-week")pickTaskDatePickerWeek(1)
    })
  }
  return panel
}
function renderTaskDatePicker(){
  const panel=ensureTaskDatePicker();
  if(!panel)return;
  if(!_taskDatePickerYear||_taskDatePickerMonth<0){
    const base=taskDatePickerBaseDate();
    _taskDatePickerYear=base.getFullYear();
    _taskDatePickerMonth=base.getMonth()
  }
  const selected=taskDatePickerIsDateKey(sel)?sel:fd(now),today=fd(now),weekStart=taskDatePickerWeekStart(selected);
  const firstDay=new Date(_taskDatePickerYear,_taskDatePickerMonth,1).getDay();
  const gridStart=new Date(_taskDatePickerYear,_taskDatePickerMonth,1-firstDay);
  const heads=["\u65e5","\u4e00","\u4e8c","\u4e09","\u56db","\u4e94","\u516d"].map(function(w){return'<span class="task-date-picker-week">'+w+"</span>"}).join("");
  let days="";
  for(let i=0;i<42;i++){
    const d=new Date(gridStart);
    d.setDate(gridStart.getDate()+i);
    const ds=fd(d),other=d.getMonth()!==_taskDatePickerMonth;
    let cls="task-date-picker-day";
    if(other)cls+=" is-muted";
    if(ds===today)cls+=" is-today";
    if(ds===selected)cls+=" is-selected";
    if(ds>=weekStart&&ds<fd(new Date(parseDS(weekStart).getFullYear(),parseDS(weekStart).getMonth(),parseDS(weekStart).getDate()+7)))cls+=" is-in-week";
    days+='<button type="button" class="'+cls+'" data-tdp-action="pick" data-ds="'+ds+'" aria-label="'+ds+'">'+d.getDate()+"</button>"
  }
  panel.innerHTML='<div class="task-date-picker-caret" aria-hidden="true"></div><div class="task-date-picker-head"><button type="button" class="task-date-picker-nav-btn" data-tdp-action="prev" aria-label="\u4e0a\u4e00\u6708"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg></button><div class="task-date-picker-month-label" aria-label="\u5f53\u524d\u6708\u4efd">'+taskDatePickerMonthLabel(_taskDatePickerYear,_taskDatePickerMonth)+'</div><button type="button" class="task-date-picker-nav-btn" data-tdp-action="next" aria-label="\u4e0b\u4e00\u6708"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div><div class="task-date-picker-grid">'+heads+days+'</div><div class="task-date-picker-quick"><button type="button" data-tdp-action="today">\u4eca\u5929</button><button type="button" data-tdp-action="tomorrow">\u660e\u5929</button><button type="button" data-tdp-action="week">\u672c\u5468</button><button type="button" data-tdp-action="next-week">\u4e0b\u5468</button></div>'
}
function openTaskDatePicker(e){
  if(e){e.preventDefault();e.stopPropagation()}
  const base=taskDatePickerBaseDate();
  _taskDatePickerYear=base.getFullYear();
  _taskDatePickerMonth=base.getMonth();
  renderTaskDatePicker();
  const panel=document.getElementById("taskDatePicker"),title=document.querySelector("#taskMode .task-main-col > .task-card > .date-nav h3");
  if(!panel)return;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden","false");
  if(title){title.classList.add("is-date-picker-open");title.setAttribute("aria-expanded","true")}
  if(!_taskDatePickerDocBound){
    _taskDatePickerDocBound=true;
    setTimeout(function(){
      document.addEventListener("click",handleTaskDatePickerDocClick);
      document.addEventListener("keydown",handleTaskDatePickerKeydown)
    },0)
  }
}
function closeTaskDatePicker(){
  const panel=document.getElementById("taskDatePicker"),title=document.querySelector("#taskMode .task-main-col > .task-card > .date-nav h3");
  if(panel){panel.classList.remove("is-open");panel.setAttribute("aria-hidden","true")}
  if(title){title.classList.remove("is-date-picker-open");title.setAttribute("aria-expanded","false")}
}
function toggleTaskDatePicker(e){
  const panel=ensureTaskDatePicker();
  if(panel&&panel.classList.contains("is-open")){if(e){e.preventDefault();e.stopPropagation()}closeTaskDatePicker();return}
  openTaskDatePicker(e)
}
function handleTaskDatePickerDocClick(e){
  const panel=document.getElementById("taskDatePicker"),title=document.querySelector("#taskMode .task-main-col > .task-card > .date-nav h3");
  if(!panel||!panel.classList.contains("is-open"))return;
  if(panel.contains(e.target)||(title&&title.contains(e.target)))return;
  closeTaskDatePicker()
}
function handleTaskDatePickerKeydown(e){if(e.key==="Escape")closeTaskDatePicker()}
function changeTaskDatePickerMonth(delta){
  _taskDatePickerMonth+=delta;
  if(_taskDatePickerMonth>11){_taskDatePickerMonth=0;_taskDatePickerYear++}
  if(_taskDatePickerMonth<0){_taskDatePickerMonth=11;_taskDatePickerYear--}
  renderTaskDatePicker()
}
function pickTaskDatePickerDate(ds){
  if(!taskDatePickerIsDateKey(ds))return;
  if(typeof pick==="function")pick(ds);
  closeTaskDatePicker()
}
function pickTaskDatePickerWeek(offset){
  const d=new Date(now);
  d.setDate(d.getDate()+offset*7);
  const ds=fd(d);
  if(typeof flushPendingTogIfAny==="function")flushPendingTogIfAny();
  if(typeof window.markTaskTitleNoMotion==="function")window.markTaskTitleNoMotion();
  if(typeof setGlobalSideNavQuickMode==="function")setGlobalSideNavQuickMode("week");
  sel=ds;cY=d.getFullYear();cM=d.getMonth();
  if(typeof FMulti!=="undefined")FMulti=new Set(["pending"]);
  if(typeof FTag!=="undefined")FTag="";
  expandedId=null;
  if(typeof clearSubtaskCollapseOverrides==="function")clearSubtaskCollapseOverrides();
  if(typeof closeTaskMoreFloat==="function")closeTaskMoreFloat();
  taskMoreMenuId=null;
  if(typeof rCal==="function")rCal();
  if(typeof rAll==="function")rAll();
  closeTaskDatePicker()
}
ensureTaskDatePicker();
function enhanceHeaderSearchTrigger(){const btn=document.querySelector('.header-tools .icon-btn[onclick="toggleSearch()"]');if(!btn)return;btn.classList.add("header-search-trigger");btn.setAttribute("aria-label","搜索任务，快捷键 Ctrl K");btn.setAttribute("title","搜索任务 (Ctrl+K)");if(!btn.querySelector(".header-search-kbd"))btn.innerHTML='<i class="header-utility-ico ph ph-magnifying-glass" aria-hidden="true"></i><span class="header-search-placeholder">搜索任务...</span><span class="header-search-kbd" aria-hidden="true">Ctrl K</span>'}
function toggleSearch(forceOpen){const w=document.getElementById("searchWrap"),input=document.getElementById("searchIn"),res=document.getElementById("searchResults");if(!w||!input)return;const open=typeof forceOpen==="boolean"?forceOpen:!w.classList.contains("open");w.classList.toggle("open",open);if(open){requestAnimationFrame(()=>{input.focus();input.select()})}else{input.value="";if(res)res.classList.add("hidden")}}
enhanceHeaderSearchTrigger();
document.addEventListener("keydown",function(e){const key=String(e.key||"").toLowerCase();if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&key==="k"){e.preventDefault();toggleSearch(true);return}if(key==="escape"){const w=document.getElementById("searchWrap");if(w&&w.classList.contains("open"))toggleSearch(false)}})
function doSearch(){const q=document.getElementById("searchIn").value.trim().toLowerCase();const res=document.getElementById("searchResults");if(!q){res.classList.add("hidden");return}res.classList.remove("hidden");let r=[];for(const ds in T)T[ds].forEach(t=>{if(isListedTask(t)&&t.text.toLowerCase().includes(q))r.push({date:ds,text:t.text,done:t.done,planTime:t.planTime||""})});if(!r.length){res.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">没有找到</div>';return}r.sort((a,b)=>b.date.localeCompare(a.date));res.innerHTML=r.slice(0,20).map(x=>`<div class="sr-item" onclick="jumpTo('${x.date}')"><span class="sr-text ${x.done?"sr-done":""}">${x.planTime?"🕐"+x.planTime+" ":""}${esc(x.text)}</span><span class="sr-date">${disp(x.date)}</span></div>`).join("")}
function jumpTo(ds){sel=ds;const p=ds.split("-");cY=+p[0];cM=+p[1]-1;document.getElementById("searchIn").value="";document.getElementById("searchResults").classList.add("hidden");document.getElementById("searchWrap").classList.remove("open");navigate("/");rCal();rAll()}
function toggleDark(){isDark=!isDark;document.body.classList.toggle("dark",isDark);setDarkBtnIcon(false);try{localStorage.setItem("tuole_dark",isDark?"1":"0")}catch(e){}try{refreshAddEmbedPrioArc()}catch(e){}}
const ROUTE_MAP={"/":"task","/kanban":"kanban","/settings":"settings","/statistics":"stats","/subscriptions":"subscriptions"};
const MODE_PATH={task:"/",kanban:"/kanban",settings:"/settings",stats:"/statistics",subscriptions:"/subscriptions"};
function normalizeRoutePath(path){const raw=path||"/",normalized=raw.replace(/\/+$/,"");return normalized||"/"}
function getPathMode(path){const normalized=normalizeRoutePath(path);return ROUTE_MAP[normalized]||"task"}
let _lastAppliedMode=null;
let _taskEnterNoMotionTimer=null;
function markTaskModeRouteEnter(){
  const taskModeEl=document.getElementById("taskMode");
  if(!taskModeEl)return;
  taskModeEl.classList.add("task-mode--route-enter");
  if(_taskEnterNoMotionTimer){clearTimeout(_taskEnterNoMotionTimer);_taskEnterNoMotionTimer=null}
  _taskEnterNoMotionTimer=setTimeout(function(){
    const el=document.getElementById("taskMode");
    if(el)el.classList.remove("task-mode--route-enter");
    _taskEnterNoMotionTimer=null;
  },220);
}

/**
 * 导航高亮背景块的移动函数
 * @param {Element} btn - 当前激活的 mode-btn 按钮元素
 * @param {boolean} [noAnim] - true 时临时关闭过渡动画（用于初始化和尺寸变化时）
 */
function moveModeToggleIndicator(btn, noAnim){
    const wrap=document.getElementById("modeToggle"),bg=document.getElementById("modeToggleActiveBg");
    if(!wrap||!bg||!btn)return;
    const wrapStyles=getComputedStyle(wrap);
    const activePadX=parseFloat(wrapStyles.getPropertyValue("--mode-active-pad-x"))||0;
    if(noAnim){
        bg.classList.add("no-transition");
        bg.offsetHeight;
    }
    bg.style.width=btn.offsetWidth+activePadX*2+"px";
    bg.style.transform="translateX("+(btn.offsetLeft-activePadX)+"px)";
    bg.style.opacity="1";
    if(noAnim){
        bg.offsetHeight;
        bg.classList.remove("no-transition");
    }
}

/**
 * 同步导航栏高亮状态（不处理动画，由调用方决定是否动画）
 */
function syncNavHighlight(path){const normalized=normalizeRoutePath(path);document.querySelectorAll("#modeToggle .mode-btn").forEach(b=>{const btnPath=normalizeRoutePath(b.dataset.path);const isAct=btnPath===normalized;b.classList.toggle("active",isAct);const ico=b.querySelector(".nav-ph-ico");if(ico){ico.classList.toggle("ph",!isAct);ico.classList.toggle("ph-fill",isAct)}});const activeBtn=document.querySelector("#modeToggle .mode-btn.active");requestAnimationFrame(()=>moveModeToggleIndicator(activeBtn))}
function applyMode(mode){
  const prevMode=_lastAppliedMode;
  ["taskMode","kanbanMode","settingsMode","statsMode","subscriptionsMode"].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.add("hidden")
  });
  if(typeof updateHeaderContext==="function")updateHeaderContext();
  if(mode==="task"){
    const taskModeEl=document.getElementById("taskMode");
    if(taskModeEl)taskModeEl.classList.remove("hidden");
    if(typeof ensureScheduleHeaderLayoutNow==="function")ensureScheduleHeaderLayoutNow();
    if(prevMode&&prevMode!=="task")markTaskModeRouteEnter();
  }
  else if(mode==="kanban")document.getElementById("kanbanMode").classList.remove("hidden");
  else if(mode==="settings"){
    document.getElementById("settingsMode").classList.remove("hidden");
    if(typeof initSubAlertSettings==="function")initSubAlertSettings()
  }else if(mode==="stats")document.getElementById("statsMode").classList.remove("hidden");
  else if(mode==="subscriptions"){
    if(typeof ensureSubMode==="function")ensureSubMode();
    const sm=document.getElementById("subscriptionsMode");
    if(sm)sm.classList.remove("hidden");
    if(typeof rSubscriptions==="function")rSubscriptions();
    _lastAppliedMode=mode;
    return
  }
  rAll()
  _lastAppliedMode=mode;
}
function getCurrentPath(){if(location.protocol==="file:"){const h=location.hash.replace(/^#/,"");return h||"/"}return location.pathname}
function navigate(path){const normalized=normalizeRoutePath(path);try{if(location.protocol==="file:"){location.hash=normalized}else{const current=normalizeRoutePath(location.pathname);if(current!==normalized)history.pushState({path:normalized},"",normalized)}}catch(e){}syncNavHighlight(normalized);applyMode(getPathMode(normalized))}
window.addEventListener("popstate",e=>{const path=e.state&&e.state.path||getCurrentPath();syncNavHighlight(path);applyMode(getPathMode(path))});
window.addEventListener("hashchange",()=>{const path=getCurrentPath();syncNavHighlight(path);applyMode(getPathMode(path))});

// 使用 ResizeObserver 替代 window.resize，监听导航栏容器尺寸变化（窗口拉伸、侧边栏挤压等）
(function initNavIndicatorObserver(){
    const wrap=document.getElementById("modeToggle");
    if(!wrap)return;
    let ro;
    try{
        ro=new ResizeObserver(()=>{
            const a=document.querySelector("#modeToggle .mode-btn.active");
            if(a)moveModeToggleIndicator(a,true);
        });
        ro.observe(wrap);
    }catch(e){}
    window.__navIndicatorRO=ro;
})();

function switchMode(mode,btn){navigate(MODE_PATH[mode]||"/")}
function rAll(){rT();rFilterBar();rKanban();rTpl();rTagMgmt();rArchive();rRecurList();rStats();rTagDropdownContent()}

// ????????????????
function rCal(){const g=document.getElementById("cGrid");const mn=["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];document.getElementById("mTitle").textContent=`${cY}年${mn[cM]}`;let h=["日","一","二","三","四","五","六"].map(d=>`<div class="cal-head">${d}</div>`).join("");const f1=new Date(cY,cM,1).getDay(),dm=new Date(cY,cM+1,0).getDate(),pm=new Date(cY,cM,0).getDate(),ts=fd(now);for(let i=f1-1;i>=0;i--){const d=pm-i,pmo=cM===0?11:cM-1,py=cM===0?cY-1:cY;const ds=`${py}-${String(pmo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const dw=new Date(py,pmo,d).getDay();h+=`<div class="${"cal-day other"+(dw===0||dw===6?" weekend":"")}" onclick="pick('${ds}')">${d}${cntDot(ds)}</div>`}for(let d=1;d<=dm;d++){const ds=`${cY}-${String(cM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const dw=new Date(cY,cM,d).getDay();let c="cal-day";if(ds===ts)c+=" today";if(ds===sel)c+=" selected";if(dw===0||dw===6)c+=" weekend";h+=`<div class="${c}" onclick="pick('${ds}')">${d}${cntDot(ds)}</div>`}const tot=f1+dm,rem=tot%7===0?0:7-tot%7;for(let d=1;d<=rem;d++){const nm=cM===11?0:cM+1,ny=cM===11?cY+1:cY;const ds=`${ny}-${String(nm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const dw=new Date(ny,nm,d).getDay();h+=`<div class="${"cal-day other"+(dw===0||dw===6?" weekend":"")}" onclick="pick('${ds}')">${d}${cntDot(ds)}</div>`}g.innerHTML=h;rStreak();rSbQNav()}
function cntDot(ds){if(!T[ds]||!T[ds].length)return"";const active=T[ds].filter(x=>!x.archived);const archCnt=T[ds].filter(x=>x.archived).length;if(!active.length&&!archCnt)return"";if(!active.length&&archCnt>0)return`<div class="cal-cnt" style="color:#22c55e;font-weight:600">✓${archCnt}</div>`;const doneCnt=active.filter(x=>x.done).length;return`<div class="cal-cnt">${doneCnt}/${active.length}${archCnt?'<span style="color:#22c55e">●</span>':""}</div>`}
function chgM(d){cM+=d;if(cM>11){cM=0;cY++}if(cM<0){cM=11;cY--}rCal()}
function goToday(){flushPendingTogIfAny();cY=now.getFullYear();cM=now.getMonth();sel=fd(now);expandedId=null;closeTaskMoreFloat();taskMoreMenuId=null;rCal();rAll()}
function pick(ds){flushPendingTogIfAny();sel=ds;const p=ds.split("-");cY=+p[0];cM=+p[1]-1;expandedId=null;closeTaskMoreFloat();taskMoreMenuId=null;rCal();rAll();if(window.innerWidth<640)closeSidebar()}
function quickGo(o){if(o===0){goToday();return}flushPendingTogIfAny();const d=parseDS(sel);d.setDate(d.getDate()+o);sel=fd(d);cY=d.getFullYear();cM=d.getMonth();expandedId=null;closeTaskMoreFloat();taskMoreMenuId=null;rCal();rAll()}
function rStreak(){let s=0;const d=new Date(now);for(let i=0;i<365;i++){const ds=fd(d),dt=T[ds]||[];const v=dt.filter(t=>!t.frozen&&!t.archived);if(v.length>0&&v.every(t=>t.done)){s++;d.setDate(d.getDate()-1)}else if(v.length===0&&i===0){d.setDate(d.getDate()-1)}else break}document.getElementById("streakArea").innerHTML=s>0?`<div class="streak-badge">🔥 连续 ${s} 天</div>`:`<div class="streak-badge cold">💤 尚未连续记录</div>`}
function rSbQNav(){const y=new Date(now);y.setDate(y.getDate()-1);const tm=new Date(now);tm.setDate(tm.getDate()+1);document.getElementById("sbQNav").innerHTML=[{ds:fd(y),l:"昨天"},{ds:fd(now),l:"今天"},{ds:fd(tm),l:"明天"}].map(d=>`<button class="${d.ds===sel?"qn-active":""}" onclick="pick('${d.ds}')">${d.l}</button>`).join("")}
function openSidebar(){document.getElementById("sidebar").classList.add("open");document.getElementById("sidebarMask").classList.add("open");document.body.style.overflow="hidden"}
function closeSidebar(){document.getElementById("sidebar").classList.remove("open");document.getElementById("sidebarMask").classList.remove("open");document.body.style.overflow=""}
function enhanceHeaderSearchTrigger(){const btn=document.querySelector('.header-tools .icon-btn[onclick="toggleSearch()"]');if(!btn)return;btn.classList.add("header-search-trigger");btn.setAttribute("aria-label","搜索任务，快捷键 Ctrl K");btn.setAttribute("title","搜索任务 (Ctrl+K)");if(!btn.querySelector(".header-search-kbd"))btn.innerHTML='<i class="header-utility-ico ph ph-magnifying-glass" aria-hidden="true"></i><span class="header-search-placeholder">搜索任务...</span><span class="header-search-kbd" aria-hidden="true">Ctrl K</span>'}
function toggleSearch(forceOpen){const w=document.getElementById("searchWrap"),input=document.getElementById("searchIn"),res=document.getElementById("searchResults");if(!w||!input)return;const open=typeof forceOpen==="boolean"?forceOpen:!w.classList.contains("open");w.classList.toggle("open",open);if(open){requestAnimationFrame(()=>{input.focus();input.select()})}else{input.value="";if(res)res.classList.add("hidden")}}
enhanceHeaderSearchTrigger();
document.addEventListener("keydown",function(e){const key=String(e.key||"").toLowerCase();if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&key==="k"){e.preventDefault();toggleSearch(true);return}if(key==="escape"){const w=document.getElementById("searchWrap");if(w&&w.classList.contains("open"))toggleSearch(false)}})
function doSearch(){const q=document.getElementById("searchIn").value.trim().toLowerCase();const res=document.getElementById("searchResults");if(!q){res.classList.add("hidden");return}res.classList.remove("hidden");let r=[];for(const ds in T)T[ds].forEach(t=>{if(!t.archived&&t.text.toLowerCase().includes(q))r.push({date:ds,text:t.text,done:t.done,planTime:t.planTime||""})});if(!r.length){res.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">没有找到</div>';return}r.sort((a,b)=>b.date.localeCompare(a.date));res.innerHTML=r.slice(0,20).map(x=>`<div class="sr-item" onclick="jumpTo('${x.date}')"><span class="sr-text ${x.done?"sr-done":""}">${x.planTime?"🕐"+x.planTime+" ":""}${esc(x.text)}</span><span class="sr-date">${disp(x.date)}</span></div>`).join("")}
function jumpTo(ds){sel=ds;const p=ds.split("-");cY=+p[0];cM=+p[1]-1;document.getElementById("searchIn").value="";document.getElementById("searchResults").classList.add("hidden");document.getElementById("searchWrap").classList.remove("open");navigate("/");rCal();rAll()}
function toggleDark(){isDark=!isDark;document.body.classList.toggle("dark",isDark);setDarkBtnIcon(false);try{localStorage.setItem("tuole_dark",isDark?"1":"0")}catch(e){}try{refreshAddEmbedPrioArc()}catch(e){}}
const ROUTE_MAP={"/":"task","/kanban":"kanban","/settings":"settings","/statistics":"stats","/subscriptions":"subscriptions"};
const MODE_PATH={task:"/",kanban:"/kanban",settings:"/settings",stats:"/statistics",subscriptions:"/subscriptions"};
function getPathMode(path){const normalized=path.replace(/\/+$/,"");return ROUTE_MAP[normalized]||ROUTE_MAP[path]||"task"}

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
function syncNavHighlight(path){const normalized=path.replace(/\/+$/,"");document.querySelectorAll("#modeToggle .mode-btn").forEach(b=>{const btnPath=b.dataset.path.replace(/\/+$/,"");const isAct=btnPath===normalized;b.classList.toggle("active",isAct);const ico=b.querySelector(".nav-ph-ico");if(ico){ico.classList.toggle("ph",!isAct);ico.classList.toggle("ph-fill",isAct)}});const activeBtn=document.querySelector("#modeToggle .mode-btn.active");requestAnimationFrame(()=>moveModeToggleIndicator(activeBtn))}
function applyMode(mode){
  ["taskMode","kanbanMode","settingsMode","statsMode","subscriptionsMode"].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.add("hidden")
  });
  if(typeof updateHeaderContext==="function")updateHeaderContext();
  if(mode==="task")document.getElementById("taskMode").classList.remove("hidden");
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
    return
  }
  rAll()
}
function getCurrentPath(){if(location.protocol==="file:"){const h=location.hash.replace(/^#/,"");return h||"/"}return location.pathname}
function navigate(path){const normalized=path.replace(/\/+$/,"");try{if(location.protocol==="file:"){location.hash=normalized}else{const current=location.pathname.replace(/\/+$/,"");if(current!==normalized)history.pushState({path:normalized},"",normalized)}}catch(e){}syncNavHighlight(normalized);applyMode(getPathMode(normalized))}
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

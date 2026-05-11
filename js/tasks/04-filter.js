// ???????????????????
function taskMatchesFilterKey(t,key){if(key==="all")return!t.frozen;if(key==="pending")return!t.done&&!t.frozen;if(key==="done")return t.done;if(key==="high")return t.priority==="high";if(key==="frozen")return t.frozen;if(key==="scheduled")return!!t.planTime&&!t.done&&!t.frozen;if(key==="repeating")return!!t.recurRuleId&&!t.done&&!t.frozen;if(key==="unscheduled")return!t.planTime&&!t.done&&!t.frozen;if(key==="default-list")return!(t.tags||[]).length&&!t.done&&!t.frozen;return!t.frozen}
function passesFMulti(t){for(var k of FMulti)if(taskMatchesFilterKey(t,k))return true;if(FMulti.size===1&&FMulti.has("done")&&_togPendingDoneId!=null&&_togPendingDoneId===t.id)return true;return false}
function applyBatchBarPanelState(){var ap=document.getElementById("addSplitPanel");var ac=document.querySelector(".add-split-chev");if(ap)ap.classList.toggle("open",addSplitOpen);if(ac){ac.classList.toggle("open",addSplitOpen);ac.setAttribute("aria-expanded",addSplitOpen?"true":"false")}}
function toggleAddSplitMenu(e){if(e)e.stopPropagation();addSplitOpen=!addSplitOpen;applyBatchBarPanelState()}
function closeAddSplitMenu(){addSplitOpen=false;applyBatchBarPanelState()}
function toggleFFilter(key){var s=new Set(FMulti);if(key==="all"){FMulti=new Set(["all"])}else{s.delete("all");if(s.has(key))s.delete(key);else s.add(key);if(s.size===0)s.add("all");FMulti=s}if(_togPendingDoneId!=null){flushPendingTogIfAny();return}rT()}
function setF(val){FMulti=new Set([val]);if(_togPendingDoneId!=null){flushPendingTogIfAny();return}rT()}
function filterSegIconSvg(kind){if(kind==="pending")return "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"12 6 12 12 16 14\"></polyline></svg>";return "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"></path><polyline points=\"22 4 12 14.01 9 11.01\"></polyline></svg>"}
function isFilterSegVisible(taskFilter){var batchBar=document.getElementById("batchBar"),el=batchBar||taskFilter;if(!el)return true;if(el.style&&el.style.display==="none")return false;if(window.getComputedStyle){var cs=window.getComputedStyle(el);if(!cs||cs.display==="none"||cs.visibility==="hidden")return false}if(el.getBoundingClientRect){var r=el.getBoundingClientRect();if(r.width<=0&&r.height<=0)return false}return true}
function applyFilterSegInstant(segEl){if(!segEl||!segEl.classList)return;segEl.classList.add("filter-seg--instant");if(segEl._filterSegInstantTimer)clearTimeout(segEl._filterSegInstantTimer);segEl._filterSegInstantTimer=setTimeout(function(){segEl._filterSegInstantTimer=null;if(segEl&&segEl.classList)segEl.classList.remove("filter-seg--instant")},96)}
function syncFilterSegIndicator(segEl){if(!segEl||!segEl.querySelector)return;var activeBtn=segEl.querySelector(".filter-seg-btn.is-active")||segEl.querySelector(".filter-seg-btn[aria-selected=\"true\"]");if(!activeBtn){segEl.classList.remove("filter-seg--indicator");segEl.style.setProperty("--seg-indicator-o","0");return}var segRect=segEl.getBoundingClientRect();var btnRect=activeBtn.getBoundingClientRect();if(segRect.width<=0||btnRect.width<=0)return;var firstBtn=segEl.querySelector(".filter-seg-btn");var baseLeft=0;if(firstBtn){var firstRect=firstBtn.getBoundingClientRect();baseLeft=Math.round(firstRect.left-segRect.left)}var x=Math.max(0,Math.round(btnRect.left-segRect.left)-baseLeft);var w=Math.max(0,Math.round(btnRect.width));segEl.classList.add("filter-seg--indicator");segEl.style.setProperty("--seg-indicator-x",x+"px");segEl.style.setProperty("--seg-indicator-w",w+"px");segEl.style.setProperty("--seg-indicator-o",w>0?"1":"0")}
function rFilterBar(){
  var taskFilter=document.getElementById("filterBar");
  var advEl=document.getElementById("batchMoreAdv");
  if(!taskFilter)return;
  var filterSegVisible=isFilterSegVisible(taskFilter);
  var wasFilterSegHidden=taskFilter.dataset.filterSegVisible==="0";
  var keepAdd=addSplitOpen;
  FMulti.delete("starred");
  FMulti.delete("star");
  if(FMulti.size===0)FMulti=new Set(["pending"]);

  var dt=T[sel]||[];
  var nonArchived=dt.filter(function(t){return !t.archived});

  function filterCount(fkey){
    var fl;
    if(fkey==="pending") fl=nonArchived.filter(function(t){return !t.done&&!t.frozen});
    else if(fkey==="done") fl=nonArchived.filter(function(t){return t.done||_togPendingDoneId!=null&&_togPendingDoneId===t.id});
    else if(fkey==="high") fl=nonArchived.filter(function(t){return t.priority==="high"});
    else if(fkey==="frozen") fl=dt.filter(function(t){return t.frozen&&!t.archived});
    else fl=nonArchived.filter(function(t){return !t.frozen});
    if(FTag)fl=fl.filter(function(t){return (t.tags||[]).indexOf(FTag)>=0});
    return fl.length;
  }

  var freezeSvg='<svg class="filter-ico-freeze" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>';
  var fcPen=filterCount("pending");
  var fcDon=filterCount("done");
  var pendOn=FMulti.size===1&&FMulti.has("pending");
  var doneOn=FMulti.size===1&&FMulti.has("done");

  var segEl=taskFilter.querySelector(".filter-seg");
  var segBtns=segEl?segEl.querySelectorAll(".filter-seg-btn"):null;
  var hasSeg=!!(segEl&&segBtns&&segBtns.length===2&&segEl.querySelector(".filter-seg-slider"));
  if(!hasSeg){
    taskFilter.innerHTML=
      '<div class="filter-seg" role="tablist" aria-label="\u4efb\u52a1\u7b5b\u9009">'+
        '<div class="filter-seg-slider" aria-hidden="true"></div>'+
        '<button type="button" role="tab" class="filter-seg-btn" onclick="setF(\'pending\')">'+
          '<span class="filter-seg-icon" aria-hidden="true">'+filterSegIconSvg("pending")+'</span>'+
          '<span class="filter-seg-label">\u5f85\u529e</span>'+
          '<span class="filter-seg-badge">0</span>'+
        '</button>'+
        '<button type="button" role="tab" class="filter-seg-btn" onclick="setF(\'done\')">'+
          '<span class="filter-seg-icon" aria-hidden="true">'+filterSegIconSvg("done")+'</span>'+
          '<span class="filter-seg-label">\u5df2\u5b8c\u6210</span>'+
          '<span class="filter-seg-badge">0</span>'+
        '</button>'+
      '</div>';
    segEl=taskFilter.querySelector(".filter-seg");
    segBtns=segEl?segEl.querySelectorAll(".filter-seg-btn"):null;
  }
  var instantSeg=!!(segEl&&filterSegVisible&&(wasFilterSegHidden||!hasSeg));
  if(instantSeg)applyFilterSegInstant(segEl);
  if(segEl&&segBtns&&segBtns.length===2){
    function patchBtn(btn,on,cnt){
      btn.classList.toggle("is-active",on);
      btn.setAttribute("aria-selected",on?"true":"false");
      var bd=btn.querySelector(".filter-seg-badge");
      if(bd){
        bd.textContent=String(cnt);
        bd.classList.toggle("filter-seg-badge--on",on);
      }
    }
    patchBtn(segBtns[0],pendOn,fcPen);
    patchBtn(segBtns[1],doneOn,fcDon);
  }

  var ADV=[
    {html:"\u5168\u90e8",value:"all"},
    {html:"\u9ad8\u4f18\u5148",value:"high"},
    {html:freezeSvg+"\u51bb\u7ed3",value:"frozen"}
  ];

  if(advEl){
    advEl.innerHTML=ADV.map(function(f){
      var on=FMulti.has(f.value);
      var chk='<span class="fdd-chk'+(on?" on":"")+'">'+(on?"\u2713":"")+'</span>';
      var cls="filter-dd-row filter-adv-row";
      if(f.value==="high")cls+=" fp-high";
      return '<button type="button" class="'+cls+'" onclick="event.stopPropagation();toggleFFilter(\''+f.value+'\')">'+chk+'<span class="fdd-lbl">'+f.html+'</span></button>';
    }).join("");
  }

  if(segEl){
    if(filterSegVisible){
      if(instantSeg)syncFilterSegIndicator(segEl);
      else requestAnimationFrame(function(){syncFilterSegIndicator(segEl)});
    }
  }
  taskFilter.dataset.filterSegVisible=filterSegVisible?"1":"0";
  addSplitOpen=keepAdd;
  applyBatchBarPanelState();
}
if(!window._batchBarClickOutside){window._batchBarClickOutside=true;document.addEventListener("click",function(e){if(addSplitOpen){if(e.target.closest&&e.target.closest(".add-split"))return;addSplitOpen=false;applyBatchBarPanelState()}});document.addEventListener("click",function(e){if(typeof taskMoreMenuId==="undefined"||taskMoreMenuId==null)return;if(e.target.closest&&(e.target.closest(".task-more-wrap")||e.target.closest(".task-more-float")))return;if(typeof closeTaskMoreFloat==="function")closeTaskMoreFloat();taskMoreMenuId=null},true);if(!window._taskMoreScrollClose){window._taskMoreScrollClose=true;document.addEventListener("scroll",function(){if(typeof taskMoreMenuId==="undefined"||taskMoreMenuId==null)return;if(typeof closeTaskMoreFloat==="function")closeTaskMoreFloat();taskMoreMenuId=null},true)}}
(function(){var _origRT=rT,_fbSch=null;rT=function(){var result=_origRT.apply(this,arguments);if(typeof rFilterBar!=="function")return result;if(_fbSch!=null)clearTimeout(_fbSch);rFilterBar();_fbSch=setTimeout(function(){_fbSch=null;rFilterBar()},0);return result}})();
document.addEventListener("focusout",function(e){var tIn=document.getElementById("tIn");var hold=document.getElementById("addTaskInlineHold");if(!tIn||!hold)return;if(hold.classList.contains("hidden")||!hold.classList.contains("task-add-inline-open"))return;var rel=e&&e.relatedTarget;if(rel&&hold.contains(rel))return;setTimeout(function(){if(window.__taskAddInlineGuardUntil&&Date.now()<window.__taskAddInlineGuardUntil)return;if(window.__taskAddInlinePointerGuardUntil&&Date.now()<window.__taskAddInlinePointerGuardUntil)return;var active=document.activeElement;var inHold=!!(active&&hold.contains(active));if(inHold)return;var addBox=tIn.closest?tIn.closest(".add-embed-wrap"):null;var inAddBox=!!(addBox&&active&&addBox.contains(active));var addBtn=document.getElementById("btnAddTaskBar");var onAddBtn=!!(addBtn&&active===addBtn);if(!inAddBox&&!onAddBtn&&!tIn.value.trim()){hideAddTaskInline()}},56)});
(function(){var hold=document.getElementById("addTaskInlineHold");if(!hold)return;function keepAddInlineOpenForInnerClick(){window.__taskAddInlinePointerGuardUntil=Date.now()+280}hold.addEventListener("pointerdown",keepAddInlineOpenForInnerClick,true);hold.addEventListener("mousedown",keepAddInlineOpenForInnerClick,true);hold.addEventListener("touchstart",keepAddInlineOpenForInnerClick,{capture:true,passive:true});hold.addEventListener("keydown",function(e){if(e.key!=="Escape")return;if(hold.classList.contains("hidden"))return;e.preventDefault();cancelAddTask()})})();

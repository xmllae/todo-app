// ?????????????????????
function getOverdue(){const today=fd(now);if(sel!==today)return[];let r=[];for(let i=1;i<=7;i++){const d=new Date(now);d.setDate(d.getDate()-i);const ds=fd(d);const tasks=(T[ds]||[]).filter(t=>!t.done&&!t.frozen&&!t.archived&&!t.dismissed);if(tasks.length)r.push({date:ds,tasks:tasks})}return r}
function migrateTask(from,id){pushUndo("迁移逾期");const a=T[from]||[];const i=a.findIndex(t=>t.id===id);if(i<0)return;const[t]=a.splice(i,1);if(!a.length)delete T[from];t.created=Date.now();t.dismissed=false;if(!T[sel])T[sel]=[];T[sel].push(t);rCal();rT();save();toast("📥 已迁移")}
function abandonTask(from,id){pushUndo("放弃逾期");const t=(T[from]||[]).find(x=>x.id===id);if(t)t.dismissed=true;rCal();rT();save();toast("🗑️ 已放弃")}
function migrateAllOd(){const od=getOverdue();if(!od.length)return;pushUndo("迁移所有逾期");let c=0;od.forEach(g=>{const toMigrate=(T[g.date]||[]).filter(t=>!t.done&&!t.frozen&&!t.archived&&!t.dismissed);toMigrate.forEach(t=>{T[g.date]=T[g.date].filter(x=>x.id!==t.id);if(!T[g.date].length)delete T[g.date];t.created=Date.now();t.dismissed=false;if(!T[sel])T[sel]=[];T[sel].push(t);c++})});rCal();rT();save();toast(`📥 已迁移 ${c} 条`)}
function abandonAllOd(){const od=getOverdue();if(!od.length)return;pushUndo("放弃所有逾期");let c=0;od.forEach(g=>{(T[g.date]||[]).forEach(t=>{if(!t.done&&!t.frozen&&!t.archived&&!t.dismissed){t.dismissed=true;c++}})});rCal();rT();save();toast(`🗑️ 已放弃 ${c} 条`)}
function renderOverdue(){const area=document.getElementById("overdueArea");const od=getOverdue();if(!od.length){area.innerHTML="";return}const tc=od.reduce((s,g)=>s+g.tasks.length,0);let h=`<div class="od-panel"><div class="od-title">⚠️ ${tc} 条逾期未完成<button class="od-toggle" onclick="odCollapsed=!odCollapsed;renderOverdue()">${odCollapsed?"展开 ▼":"收起 ▲"}</button></div>`;if(!odCollapsed){od.forEach(g=>{h+=`<div class="od-date">${disp(g.date)}</div>`;g.tasks.forEach(t=>{h+=`<div class="od-item"><span class="od-text">${prioBadge(t.priority,null,"font-size:.62rem;padding:0 5px;margin-right:3px")} ${esc(t.text)}</span><div class="od-actions"><button class="od-btn migrate" onclick="migrateTask('${g.date}',${t.id})">📥迁移</button><button class="od-btn abandon" onclick="abandonTask('${g.date}',${t.id})">放弃</button></div></div>`})});h+=`<div class="od-batch"><button onclick="migrateAllOd()">📥 全部迁移</button><button onclick="abandonAllOd()">🗑️ 全部放弃</button></div>`}h+=`</div>`;area.innerHTML=h}
function postponeTask(id,target){pushUndo("推迟任务");const a=T[sel]||[];const i=a.findIndex(t=>t.id===id);if(i<0)return;const[t]=a.splice(i,1);if(!a.length)delete T[sel];else T[sel]=a;t.created=Date.now();if(!T[target])T[target]=[];T[target].push(t);ppOpenId=null;rCal();rT();save();toast(`→ 已推迟到 ${disp(target)}`)}
function getNextMonday(){const d=new Date(parseDS(sel));const day=d.getDay();const diff=day===0?1:8-day;d.setDate(d.getDate()+diff);return fd(d)}
function getPostponeDaysFromNowDs(n){const d=new Date(now);d.setDate(d.getDate()+n);return fd(d)}
function taskMorePostponeByOffset(id,n){closeTaskMoreFloat();taskMoreMenuId=null;postponeTask(id,getPostponeDaysFromNowDs(n))}
function postponeCustom(id){ppOpenId=null;const tom=new Date(parseDS(sel));tom.setDate(tom.getDate()+1);document.getElementById("mBody").innerHTML=`<p style="font-weight:600">📅 推迟到…</p><div class="copy-field"><label>目标日期</label><input type="date" id="ppTarget" value="${fd(tom)}"></div><div class="modal-actions"><button class="mbtn-c" onclick="clM()">取消</button><button class="mbtn-a" onclick="postponeTask(${id},document.getElementById('ppTarget').value);clM()">确定</button></div>`;document.getElementById("mBg").classList.add("show")}
function copyTaskTo(id){ppOpenId=null;rT();const t=(T[sel]||[]).find(x=>x.id===id);if(!t)return;const tom=new Date(parseDS(sel));tom.setDate(tom.getDate()+1);document.getElementById("mBody").innerHTML=`<p style="font-weight:600">📋 复制任务到</p><div class="copy-field"><label>目标日期</label><input type="date" id="ctTarget" value="${fd(tom)}"></div><div class="modal-actions"><button class="mbtn-c" onclick="clM()">取消</button><button class="mbtn-a" onclick="doCopyTaskTo(${id})">复制</button></div>`;document.getElementById("mBg").classList.add("show")}
function doCopyTaskTo(id){const target=document.getElementById("ctTarget").value;if(!target)return;const t=(T[sel]||[]).find(x=>x.id===id);if(!t)return;if(!T[target])T[target]=[];const bid=Date.now();T[target].push(mkTask(t.text,t.priority,t.planTime,t.duration,{tags:[...t.tags||[]],color:t.color,note:t.note||"",subtasks:(t.subtasks||[]).map((s,i)=>({id:bid+i+Math.floor(Math.random()*1e4),text:s.text,done:false}))}));clM();rCal();save();toast(`📋 已复制到 ${disp(target)}`)}
function toggleFreeze(id){const t=(T[sel]||[]).find(x=>x.id===id);if(!t)return;t.frozen=!t.frozen;if(t.frozen)t.frozenUntil="";rT();save();toast(t.frozen?"❄️ 已冷冻":"🔥 已解冻")}
function toggleMultiSelect(){multiSelect=!multiSelect;selectedIds.clear();var _msb=document.getElementById("multiSelectBtn");if(_msb)_msb.classList.toggle("on",multiSelect);document.getElementById("multiBar").classList.toggle("show",multiSelect);var _lp=document.querySelector("#taskMode .list-panel");if(_lp)_lp.classList.toggle("list-panel--multi",multiSelect);rT()}
function toggleMSel(id){if(selectedIds.has(id))selectedIds.delete(id);else selectedIds.add(id);rT();document.getElementById("msCnt").textContent=`已选 ${selectedIds.size} 条`}
function msSelectAll(){(T[sel]||[]).filter(t=>!t.archived).forEach(t=>selectedIds.add(t.id));rT();document.getElementById("msCnt").textContent=`已选 ${selectedIds.size} 条`}
function msDel(){if(!selectedIds.size)return;pushUndo("批量删除");T[sel]=(T[sel]||[]).filter(t=>!selectedIds.has(t.id));if(!T[sel].length)delete T[sel];selectedIds.clear();toggleMultiSelect();rCal();rT();save();toast("🗑️ 已删除")}
function msPriority(){document.getElementById("mBody").innerHTML=`<p style="font-weight:600">改优先级</p><div class="modal-actions"><button class="mbtn-a" onclick="doMsPrio('high');clM()" style="background:${priorityColors.high}">高</button><button class="mbtn-a" onclick="doMsPrio('medium');clM()" style="background:${priorityColors.medium}">中</button><button class="mbtn-a" onclick="doMsPrio('low');clM()" style="background:${priorityColors.low}">低</button></div>`;document.getElementById("mBg").classList.add("show")}
function doMsPrio(p){pushUndo("批量改优先级");(T[sel]||[]).forEach(t=>{if(selectedIds.has(t.id))t.priority=p});selectedIds.clear();toggleMultiSelect();rT();save();toast("✅ 已修改")}
function msTag(){let h=`<p style="font-weight:600;margin-bottom:12px">打标签</p><div class="exp-tag-row" style="justify-content:center;margin-bottom:14px">`;customTags.forEach(t=>{h+=`<span class="exp-tag-pill" style="border-color:${t.color}" onclick="this.classList.toggle('etp-on');this.style.background=this.classList.contains('etp-on')?'${t.color}':'';this.style.color=this.classList.contains('etp-on')?'#fff':''" data-tid="${t.id}">${t.name}</span>`});h+=`</div><div class="modal-actions"><button class="mbtn-c" onclick="clM()">取消</button><button class="mbtn-a" onclick="doMsTag()">应用</button></div>`;document.getElementById("mBody").innerHTML=h;document.getElementById("mBg").classList.add("show")}
function doMsTag(){const pills=document.querySelectorAll("#mBody .etp-on");const tags=[...pills].map(p=>p.dataset.tid);pushUndo("批量打标签");(T[sel]||[]).forEach(t=>{if(selectedIds.has(t.id)){if(!t.tags)t.tags=[];tags.forEach(tag=>{if(!t.tags.includes(tag))t.tags.push(tag)})}});selectedIds.clear();toggleMultiSelect();clM();rT();save();toast("🏷️ 已打标签")}
function msMove(){const tom=new Date(parseDS(sel));tom.setDate(tom.getDate()+1);document.getElementById("mBody").innerHTML=`<p style="font-weight:600">移至日期</p><div class="copy-field"><label>目标日期</label><input type="date" id="msMoveD" value="${fd(tom)}"></div><div class="modal-actions"><button class="mbtn-c" onclick="clM()">取消</button><button class="mbtn-a" onclick="doMsMove()">移动</button></div>`;document.getElementById("mBg").classList.add("show")}
function doMsMove(){const target=document.getElementById("msMoveD").value;if(!target)return;pushUndo("批量移动");const moved=[];T[sel]=(T[sel]||[]).filter(t=>{if(selectedIds.has(t.id)){moved.push(t);return false}return true});if(!T[sel].length)delete T[sel];if(!T[target])T[target]=[];T[target].push(...moved);selectedIds.clear();toggleMultiSelect();clM();rCal();rT();save();toast(`📦 已移动 ${moved.length} 条`)}
function msCopy(){if(!selectedIds.size){toast("请先选择任务");return}const tom=new Date(parseDS(sel));tom.setDate(tom.getDate()+1);document.getElementById("mBody").innerHTML=`<p style="font-weight:600">📋 复制选中任务到</p><div class="copy-field"><label>目标日期</label><input type="date" id="msCopyD" value="${fd(tom)}"></div><div class="modal-actions"><button class="mbtn-c" onclick="clM()">取消</button><button class="mbtn-a" onclick="doMsCopy()">复制</button></div>`;document.getElementById("mBg").classList.add("show")}
function doMsCopy(){const target=document.getElementById("msCopyD").value;if(!target)return;if(!T[target])T[target]=[];let c=0;(T[sel]||[]).forEach(t=>{if(selectedIds.has(t.id)){const bid=Date.now()+c*100;T[target].push(mkTask(t.text,t.priority,t.planTime,t.duration,{tags:[...t.tags||[]],color:t.color,note:t.note||"",subtasks:(t.subtasks||[]).map((s,i)=>({id:bid+i+Math.floor(Math.random()*1e4),text:s.text,done:false}))}));c++}});selectedIds.clear();toggleMultiSelect();clM();rCal();rT();save();toast(`📋 已复制 ${c} 条`)}
function msColor(){let h=`<p style="font-weight:600;margin-bottom:12px">选择颜色</p><div class="color-pick" style="justify-content:center;margin-bottom:14px">`;COLORS.forEach(c=>{h+=`<div class="color-opt" style="background:${c||"var(--hov)"}" onclick="doMsColor('${c}');clM()">${c?"":"✕"}</div>`});h+=`</div><div class="modal-actions"><button class="mbtn-c" onclick="clM()">取消</button></div>`;document.getElementById("mBody").innerHTML=h;document.getElementById("mBg").classList.add("show")}
function doMsColor(c){pushUndo("批量改颜色");(T[sel]||[]).forEach(t=>{if(selectedIds.has(t.id))t.color=c});selectedIds.clear();toggleMultiSelect();rT();save();toast("🎨 已修改")}
function msFreeze(){pushUndo("批量冷冻");(T[sel]||[]).forEach(t=>{if(selectedIds.has(t.id))t.frozen=!t.frozen});selectedIds.clear();toggleMultiSelect();rT();save();toast("❄️ 已切换冷冻")}
function toggleSortMenu(){document.getElementById("sortDropdown").classList.toggle("show");updateSortUI()}
function updateSortUI(){const cur=normalizeSortMode(lastSort);document.querySelectorAll("#sortDropdown .sd-item").forEach(el=>{el.classList.toggle("sd-active",el.getAttribute("data-mode")===cur)});const lb=document.querySelector("#sortWrap .batch-sort-label");if(lb){const nm={created:"创建时间",deadline:"截止日期",priority:"优先级"};lb.textContent=nm[cur]||nm.deadline}}
function selectSortMode(mode){lastSort=normalizeSortMode(mode);sortStates[sel]=lastSort;updateSortUI();document.getElementById("sortDropdown").classList.remove("show");const dt=T[sel];if(dt&&dt.length)quickSort();else save()}
function quickSort(){const dt=T[sel];if(!dt||!dt.length){toast("📭 没有可排序的任务");return}const mode=normalizeSortMode(lastSort||"created");const PH={high:0,normal:1};dt.sort((a,b)=>{if(a.star&&!b.star)return-1;if(!a.star&&b.star)return 1;if(a.done&&!b.done)return 1;if(!a.done&&b.done)return-1;if(a.archived&&!b.archived)return 1;if(!a.archived&&b.archived)return-1;if(mode==="priority"){const pa=PH[a.priority]??1,pb=PH[b.priority]??1;if(pa!==pb)return pa-pb;const ta=a.planTime||"",tb=b.planTime||"";if(ta&&tb&&ta!==tb)return ta.localeCompare(tb);if(ta&&!tb)return-1;if(!ta&&tb)return 1;return(b.created||0)-(a.created||0)}if(mode==="created")return(b.created||0)-(a.created||0);if(mode==="deadline"){const ka=deadlineSortKey(a),kb=deadlineSortKey(b);if(ka==null&&kb==null)return(b.created||0)-(a.created||0);if(ka==null)return 1;if(kb==null)return-1;if(ka!==kb)return ka-kb;return(b.created||0)-(a.created||0)}return(b.created||0)-(a.created||0)});sortStates[sel]=mode;rT();save();toast("✅ 已排序")}
let dS=null;
let _addInlineHideTimer=null;
let _addInlineOpenGuardUntil=0;
let _addInlineCloseEndHandler=null;
const _ADD_INLINE_CLOSE_FALLBACK_MS=420;
let qiTemplateScrollbarRaf=null;
let qiTemplateScrollbarDragState=null;
let qiTemplateScrollbarResizeObserver=null;
function setAddTaskInlineMaxHeight(h){if(!h)return 0;let m=0;try{const c=h.querySelector(".task-ghost-card");m=Math.ceil((c&&c.scrollHeight?c.scrollHeight:h.scrollHeight)||0)}catch(e){}if(!m||m<1)m=560;h.style.setProperty("--task-add-inline-max-h",m+"px");return m}
function clearAddTaskInlineCloseWatcher(h){if(_addInlineHideTimer){clearTimeout(_addInlineHideTimer);_addInlineHideTimer=null}if(h&&_addInlineCloseEndHandler){h.removeEventListener("transitionend",_addInlineCloseEndHandler);_addInlineCloseEndHandler=null}}
function finishHideAddTaskInline(h){if(!h)return;if(h.classList.contains("task-add-inline-open"))return;clearAddTaskInlineCloseWatcher(h);h.classList.add("hidden");h.classList.remove("task-add-inline-closing");h.style.removeProperty("--task-add-inline-max-h");resetAddTaskFormOnly()}
function syncAddTaskMainLabel(isOpen){var btn=document.getElementById("btnAddTaskBar");if(!btn)return;var label=isOpen?"取消任务":"添加任务";btn.setAttribute("title",label);btn.setAttribute("aria-label",label);var textNode=null;for(var i=0;i<btn.childNodes.length;i++){var n=btn.childNodes[i];if(n&&n.nodeType===3&&String(n.nodeValue||"").trim()){textNode=n;break}}if(textNode){textNode.nodeValue=label;return}var span=btn.querySelector(".add-split-main-label");if(!span){span=document.createElement("span");span.className="add-split-main-label";btn.appendChild(span)}span.textContent=label}
function sDrag(e,id){if(editingId||editingTimeId)return;e.preventDefault();e.stopPropagation();expandedId=null;closeTaskMoreFloat();taskMoreMenuId=null;rT();setTimeout(()=>{const el=document.querySelector(`.task-item[data-id="${id}"]`);if(!el)return;const isT=e.type==="touchstart";const cy=isT?e.touches[0].clientY:e.clientY;const r=el.getBoundingClientRect();const cl=el.cloneNode(true);cl.style.cssText=`position:fixed;width:${r.width}px;left:${r.left}px;top:${r.top}px;z-index:1000;pointer-events:none;opacity:.85;box-shadow:0 12px 40px rgba(0,0,0,.18);border-radius:14px;transition:none;background:var(--card)`;document.body.appendChild(cl);el.classList.add("dragging");document.body.style.userSelect="none";dS={id:id,el:el,cl:cl,oy:cy-r.top};document.addEventListener("mousemove",mDrag);document.addEventListener("touchmove",mDrag,{passive:false});document.addEventListener("mouseup",eDrag);document.addEventListener("touchend",eDrag)},10)}
function mDrag(e){if(!dS)return;e.preventDefault();const y=e.clientY||e.touches&&e.touches[0].clientY;dS.cl.style.top=y-dS.oy+"px";document.querySelectorAll("#tList .task-item").forEach(el=>{el.classList.remove("drop-above","drop-below");if(el===dS.el)return;const r=el.getBoundingClientRect(),m=r.top+r.height/2;if(Math.abs(y-m)<r.height*.6)el.classList.add(y<m?"drop-above":"drop-below")})}
function eDrag(e){if(!dS)return;document.removeEventListener("mousemove",mDrag);document.removeEventListener("touchmove",mDrag);document.removeEventListener("mouseup",eDrag);document.removeEventListener("touchend",eDrag);const y=e.clientY||e.changedTouches&&e.changedTouches[0].clientY;let tId=null,before=false,best=Infinity;document.querySelectorAll("#tList .task-item").forEach(el=>{el.classList.remove("drop-above","drop-below");if(el===dS.el)return;const r=el.getBoundingClientRect(),m=r.top+r.height/2,d=Math.abs(y-m);if(d<best){best=d;tId=+el.dataset.id;before=y<m}});if(tId&&tId!==dS.id){const a=T[sel],fi=a.findIndex(t=>t.id===dS.id);const[it]=a.splice(fi,1);let ti=a.findIndex(t=>t.id===tId);if(!before)ti++;a.splice(ti,0,it);sortStates[sel]=null;save()}dS.el.classList.remove("dragging");dS.cl.remove();document.body.style.userSelect="";dS=null;rT()}
function resetAddTaskFormOnly(){var _as=document.querySelector(".add-split");if(_as)_as.classList.remove("add-split-form-open");var w=document.getElementById("addEmbedWrap"),inp=document.getElementById("tIn"),tt=document.getElementById("tTime"),dur=document.getElementById("durIn"),ps=document.getElementById("pSel");if(inp)inp.value="";if(tt)tt.value="";if(dur)dur.value="";if(ps)ps.value="normal";if(w)w.classList.remove("add-embed-active");if(typeof closeGhostPriorityDropdown==="function")closeGhostPriorityDropdown();if(inp)try{inp.blur()}catch(e){}refreshAddEmbedPrioArc();syncGhostLabelsFromForm();syncAddTaskMainLabel(false)}
function syncQuickImportEntryState(){var isOpen=!!window._quickImportModalOpen;document.querySelectorAll(".add-split-quick").forEach(function(btn){btn.classList.toggle("is-open",isOpen);btn.setAttribute("aria-pressed",isOpen?"true":"false")})}
function showAddTaskRow(){closeAddSplitMenu();var h=document.getElementById("addTaskInlineHold");if(h&&!h.classList.contains("hidden")&&h.classList.contains("task-add-inline-open")){hideAddTaskInline();return}clearAddTaskInlineCloseWatcher(h);var _as=document.querySelector(".add-split");if(_as)_as.classList.add("add-split-form-open");var qib=document.getElementById("quickImportBox");if(qib)qib.classList.add("hidden");syncQuickImportEntryState();var w=document.getElementById("addEmbedWrap");if(w)w.classList.add("add-embed-active");if(h){h.classList.remove("hidden","task-add-inline-closing");setAddTaskInlineMaxHeight(h);h.offsetHeight;h.classList.add("task-add-inline-open");requestAnimationFrame(function(){setAddTaskInlineMaxHeight(h)})}syncAddTaskMainLabel(true);var inp=document.getElementById("tIn"),tt=document.getElementById("tTime"),dur=document.getElementById("durIn"),ps=document.getElementById("pSel");if(inp)inp.value="";if(tt)tt.value="";if(dur)dur.value="";if(ps)ps.value="normal";refreshAddEmbedPrioArc();syncGhostLabelsFromForm();_addInlineOpenGuardUntil=Date.now()+420;window.__taskAddInlineGuardUntil=_addInlineOpenGuardUntil;setTimeout(function(){try{if(inp){inp.focus({preventScroll:true});if(inp.setSelectionRange)inp.setSelectionRange(inp.value.length,inp.value.length)}}catch(e){}},26)}
function hideAddTaskInline(){var h=document.getElementById("addTaskInlineHold"),w=document.getElementById("addEmbedWrap"),_as=document.querySelector(".add-split");clearAddTaskInlineCloseWatcher(h);if(_as)_as.classList.remove("add-split-form-open");if(w)w.classList.remove("add-embed-active");if(h){h.classList.remove("task-add-inline-open");h.classList.add("task-add-inline-closing");_addInlineCloseEndHandler=function(ev){if(!ev||ev.target!==h)return;if(ev.propertyName&&ev.propertyName!=="max-height")return;finishHideAddTaskInline(h)};h.addEventListener("transitionend",_addInlineCloseEndHandler);_addInlineHideTimer=setTimeout(function(){finishHideAddTaskInline(h)},_ADD_INLINE_CLOSE_FALLBACK_MS)}_addInlineOpenGuardUntil=0;window.__taskAddInlineGuardUntil=0;syncAddTaskMainLabel(false)}
function openAddTaskUI(){showAddTaskRow()}
function cancelAddTask(){hideAddTaskInline()}
function addT(){const inp=document.getElementById("tIn"),txt=inp.value.trim();if(!txt)return;if(!T[sel])T[sel]=[];const dur=parseInt(document.getElementById("durIn").value)||0;T[sel].push(mkTask(txt,document.getElementById("pSel").value,document.getElementById("tTime").value,dur));inp.value="";document.getElementById("tTime").value="";document.getElementById("durIn").value="";rCal();rT();rTagDropdownContent();save();toast("✅ 已添加");hideAddTaskInline()}
function closeQuickImportModal(){window._quickImportModalOpen=false;window._qiTplEditingIndex=-1;qiDestroyTemplateScrollbar();var body=document.getElementById("mBody"),bg=document.getElementById("mBg");if(body){body.classList.remove("qi-modal-shell");body.style.maxWidth="";body.style.width="";body.style.padding="";body.style.textAlign="";body.style.boxSizing=""}if(bg)bg.classList.remove("show");window.__mainModalCleanup=null;syncQuickImportEntryState()}
function setQuickImportTab(tab){
  var next=(tab==="paste"||tab==="template")?tab:"paste";
  var wrap=document.querySelector(".qi-modal-wrap");
  if(!wrap)return;
  wrap.setAttribute("data-tab",next);
  document.querySelectorAll("[data-qi-tab-btn]").forEach(function(btn){
    var on=btn.getAttribute("data-qi-tab-btn")===next;
    btn.classList.toggle("is-active",on);
    btn.setAttribute("aria-selected",on?"true":"false");
  });
  document.querySelectorAll("[data-qi-panel]").forEach(function(panel){
    var on=panel.getAttribute("data-qi-panel")===next;
    panel.classList.toggle("is-active",on);
  });
  if(next==="template"){
    qiRenderTemplatePanel();
    qiInitTemplateScrollbar();
    qiScheduleTemplateScrollbarSync();
  }
  if(next==="paste"){
    setTimeout(function(){
      var ta=document.getElementById("quickImportText");
      if(ta){
        try{ta.focus({preventScroll:true})}catch(e){ta.focus()}
      }
    },32);
    qiRenderPreview();
    qiScheduleTemplateScrollbarSync();
  }
}
function qiGetStdTemplateText(){return "\u4efb\u52a1\u540d\u79f0\uff1a\n\u6807\u7b7e\uff1a\u5de5\u4f5c\n\u4f18\u5148\u7ea7\uff1a\u4e2d\n\u5efa\u8bae\u65f6\u95f4\uff1a09:00\n\u9884\u8ba1\u8017\u65f6\uff1a30 \u5206\u949f\n\u5907\u6ce8\uff1a\n\u5b50\u4efb\u52a1\uff1a\n- "}
function qiUseStdTemplate(){var ta=document.getElementById("quickImportText");if(!ta)return;ta.value=qiGetStdTemplateText();setQuickImportTab("paste");qiRenderPreview()}
function qiUseCustomTemplate(idx){var ta=document.getElementById("quickImportText");if(!ta)return;var t=(customImportTemplates||[])[idx];if(!t||!t.content){toast("该模板暂无内容");return}ta.value=t.content;setQuickImportTab("paste");qiRenderPreview()}
function qiReadFile(file){if(!file)return;var reader=new FileReader;reader.onload=function(){var txt=String(reader.result||"");var ta=document.getElementById("quickImportText");var nameEl=document.getElementById("qiUploadName");if(nameEl)nameEl.textContent=file.name+"（"+Math.ceil((file.size||0)/1024)+" KB）";if(ta)ta.value=txt;setQuickImportTab("paste");qiRenderPreview()};reader.onerror=function(){toast("文件读取失败，请重试")};reader.readAsText(file,"utf-8")}
function qiOpenFilePicker(){var inp=document.getElementById("qiFileInput");if(!inp)return;inp.value="";inp.click()}
function qiDownloadTemplate(){var txt=qiGetStdTemplateText();try{var blob=new Blob([txt],{type:"text/plain;charset=utf-8"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="\u5feb\u901f\u5bfc\u5165\u6a21\u677f.txt";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove()},60)}catch(e){toast("\u4e0b\u8f7d\u6a21\u677f\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5")}}
function qiRenderPreview(){
  var body=document.getElementById("qiPreviewBody");
  if(!body)return;
  var ta=document.getElementById("quickImportText");
  var txt=(ta&&ta.value?ta.value:"").trim();
  var countEl=document.getElementById("qiPreviewCount");
  var hintEl=document.getElementById("qiPreviewHint");
  var confirmBtn=document.getElementById("qiConfirmBtn");
  if(!txt){
    body.innerHTML='<tr class="qi-preview-empty"><td colspan="3">\u7c98\u8d34\u6587\u672c\u540e\uff0c\u5c06\u5728\u8fd9\u91cc\u663e\u793a\u9884\u89c8</td></tr>';
    if(countEl)countEl.textContent="\u5c06\u5bfc\u5165 0 \u6761\u4efb\u52a1";
    if(hintEl)hintEl.textContent="\u5f53\u524d\u672a\u68c0\u6d4b\u5230\u53ef\u5bfc\u5165\u6570\u636e";
    if(confirmBtn)confirmBtn.textContent="\u786e\u8ba4\u5bfc\u5165";
    return;
  }
  var parsed=null;
  try{parsed=parseQuickImport(txt)}catch(e){}
  if(!parsed||!parsed.text){
    body.innerHTML='<tr class="qi-preview-empty"><td colspan="3">\u672a\u8bc6\u522b\u5230\u4efb\u52a1\u6807\u9898\uff0c\u8bf7\u68c0\u67e5\u6587\u672c\u683c\u5f0f</td></tr>';
    if(countEl)countEl.textContent="\u5c06\u5bfc\u5165 0 \u6761\u4efb\u52a1";
    if(hintEl)hintEl.textContent="\u5efa\u8bae\u4f7f\u7528\u6a21\u677f\u683c\u5f0f\uff0c\u53ef\u63d0\u9ad8\u8bc6\u522b\u51c6\u786e\u7387";
    if(confirmBtn)confirmBtn.textContent="\u786e\u8ba4\u5bfc\u5165";
    return;
  }
  var pLbl=parsed.priority==="high"?"\u9ad8":parsed.priority==="low"?"\u4f4e":"\u4e2d";
  var pCls=parsed.priority==="high"?"high":parsed.priority==="low"?"low":"mid";
  var dateTxt=parsed.execDate||sel||"\u2014";
  var timeTxt=parsed.planTime||"\u2014";
  var dateTimeTxt=((dateTxt&&dateTxt!=="\u2014")?dateTxt:"")+((timeTxt&&timeTxt!=="\u2014")?(" "+timeTxt):"");
  if(!dateTimeTxt.trim())dateTimeTxt="\u2014";
  body.innerHTML='<tr><td>'+esc(parsed.text)+'</td><td>'+esc(dateTimeTxt.trim())+'</td><td><span class="qi-pri-badge qi-pri-'+pCls+'">'+pLbl+'</span></td></tr>';
  if(countEl)countEl.textContent="\u5c06\u5bfc\u5165 1 \u6761\u4efb\u52a1";
  if(hintEl)hintEl.textContent="\u9884\u89c8\u57fa\u4e8e\u5f53\u524d\u89e3\u6790\u7ed3\u679c\uff0c\u5bfc\u5165\u540e\u53ef\u7ee7\u7eed\u7f16\u8f91";
  if(confirmBtn)confirmBtn.textContent="\u786e\u8ba4\u5bfc\u5165 1 \u6761\u4efb\u52a1";
}
function qiPreviewParse(){
  qiRenderPreview();
}
function openQuickImportModal(tab){
  if(typeof hideAddTaskInline==="function")hideAddTaskInline();
  var qib=document.getElementById("quickImportBox");
  if(qib)qib.classList.add("hidden");
  var body=document.getElementById("mBody"),bg=document.getElementById("mBg");
  if(!body||!bg)return;
  window._quickImportModalOpen=true;
  window._qiTplEditingIndex=-1;
  body.classList.add("qi-modal-shell");
  body.style.maxWidth="540px";
  body.style.width="min(540px,94vw)";
  body.style.padding="0";
  body.style.textAlign="left";
  body.style.boxSizing="border-box";
  body.innerHTML='<div class="qi-modal-wrap" data-tab="paste">'
    +'<div class="qi-modal-head"><div class="qi-modal-head-left"><span class="qi-modal-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 5 17 10"></polyline><line x1="12" y1="5" x2="12" y2="15"></line><line x1="8" y1="19" x2="16" y2="19"></line></svg></span><div class="qi-modal-head-text"><h3>\u5feb\u901f\u5bfc\u5165\u4efb\u52a1</h3><p>\u652f\u6301\u7c98\u8d34\u6587\u672c\u3001\u6a21\u677f\u5bfc\u5165\uff0c\u81ea\u52a8\u8bc6\u522b\u5e76\u521b\u5efa\u4efb\u52a1</p></div></div><button type="button" class="qi-modal-close" aria-label="\u5173\u95ed" onclick="closeQuickImportModal()">\u00d7</button></div>'
    +'<div class="qi-tab-row qi-tab-row--two" role="tablist" aria-label="\u5bfc\u5165\u65b9\u5f0f"><button type="button" class="qi-tab-btn is-active" data-qi-tab-btn="paste" onclick="setQuickImportTab(\'paste\')">\u7c98\u8d34\u6587\u672c</button><button type="button" class="qi-tab-btn" data-qi-tab-btn="template" onclick="setQuickImportTab(\'template\')">\u6a21\u677f\u5bfc\u5165</button></div>'
    +'<div class="qi-panel is-active" data-qi-panel="paste"><textarea id="quickImportText" class="qi-textarea" placeholder="\u7c98\u8d34\u4efb\u52a1\u4fe1\u606f\uff0c\u4f8b\u5982\uff1a&#10;\u4efb\u52a1\u540d\u79f0\uff1a\u5199\u5468\u62a5&#10;\u6807\u7b7e\uff1a\u5de5\u4f5c&#10;\u4f18\u5148\u7ea7\uff1a\u9ad8&#10;\u5efa\u8bae\u65f6\u95f4\uff1a09:30&#10;\u9884\u8ba1\u8017\u65f6\uff1a45 \u5206\u949f"></textarea><section class="qi-preview-card qi-preview-card--in-panel"><div class="qi-preview-head"><h4>\u6570\u636e\u9884\u89c8</h4><div class="qi-preview-meta"><span id="qiPreviewCount">\u5c06\u5bfc\u5165 0 \u6761\u4efb\u52a1</span><button type="button" class="qi-link-btn" onclick="qiPreviewParse()">\u9884\u89c8\u89e3\u6790</button></div></div><p class="qi-preview-hint" id="qiPreviewHint">\u5f53\u524d\u672a\u68c0\u6d4b\u5230\u53ef\u5bfc\u5165\u6570\u636e</p><div class="qi-preview-table-wrap"><table class="qi-preview-table"><thead><tr><th>\u4efb\u52a1\u6807\u9898</th><th>\u65e5\u671f\u65f6\u95f4</th><th>\u4f18\u5148\u7ea7</th></tr></thead><tbody id="qiPreviewBody"><tr class="qi-preview-empty"><td colspan="3">\u7c98\u8d34\u6587\u672c\u540e\uff0c\u5c06\u5728\u8fd9\u91cc\u663e\u793a\u9884\u89c8</td></tr></tbody></table></div></section></div>'
    +'<div class="qi-panel" data-qi-panel="template"><div class="qi-template-box"><div class="qi-template-top"><div class="qi-template-tip">\u6a21\u677f\u53ef\u76f4\u63a5\u7f16\u8f91\uff0c\u4fdd\u5b58\u540e\u4f1a\u957f\u671f\u4fdd\u7559\u3002\u70b9\u51fb\u201c\u4f7f\u7528\u201d\u4f1a\u81ea\u52a8\u586b\u5145\u5230\u7c98\u8d34\u6587\u672c\u3002</div><button type="button" class="qi-template-add-btn" onclick="qiCreateCustomTemplate()">+ \u65b0\u5efa\u6a21\u677f</button></div><div class="qi-template-list" id="qiTemplateList"></div><div class="qi-template-editor" id="qiTemplateEditor"><div class="qi-template-editor-head"><strong id="qiTemplateEditorTitle">\u7f16\u8f91\u6a21\u677f</strong><button type="button" class="qi-link-btn" onclick="qiCloseTemplateEditor()">\u6536\u8d77</button></div><input type="text" id="qiTplName" class="qi-template-name" maxlength="20" placeholder="\u6a21\u677f\u540d\u79f0"><textarea id="qiTplContent" class="qi-template-editor-input" placeholder="\u6a21\u677f\u5185\u5bb9"></textarea><div class="qi-template-editor-actions"><button type="button" class="qi-template-ghost-btn" onclick="qiDeleteEditingTemplate()">\u5220\u9664</button><button type="button" class="qi-template-ghost-btn" onclick="qiUseEditingTemplate()">\u4f7f\u7528\u5185\u5bb9</button><button type="button" class="qi-template-save-btn" onclick="qiSaveEditingTemplate()">\u4fdd\u5b58\u6a21\u677f</button></div></div></div></div>'
    +'<div class="qi-modal-foot"><button type="button" class="qi-cancel-btn" onclick="closeQuickImportModal()">\u53d6\u6d88</button><button type="button" class="qi-primary-btn" id="qiConfirmBtn" onclick="doQuickImport()">\u786e\u8ba4\u5bfc\u5165</button></div>'
    +'</div>';
  bg.classList.add("show");
  window.__mainModalCleanup=closeQuickImportModal;
  var ta=document.getElementById("quickImportText");
  if(ta)ta.addEventListener("input",qiRenderPreview);
  qiInitTemplateScrollbar();
  setQuickImportTab(tab||"paste");
  qiRenderTemplatePanel();
  if((tab||"paste")==="paste")qiRenderPreview();
  qiScheduleTemplateScrollbarSync();
  syncQuickImportEntryState();
}
function toggleQuickImport(){if(window._quickImportModalOpen){closeQuickImportModal();return}openQuickImportModal("paste")}
function qiTemplatePreview(content){var txt=String(content||"").trim();if(!txt)return"\u6682\u65e0\u6a21\u677f\u5185\u5bb9";var one=txt.split(/\r?\n/).find(function(l){return String(l||"").trim()})||txt;one=one.replace(/\s+/g," ").trim();return one.length>36?one.slice(0,36)+"...":one}
function qiRenderTemplatePanel(){var list=document.getElementById("qiTemplateList");if(!list)return;var editing=typeof window._qiTplEditingIndex==="number"?window._qiTplEditingIndex:-1;var rows=['<div class="qi-template-row qi-template-row-std"><div class="qi-template-row-main"><p class="qi-template-row-title">\u6807\u51c6\u6a21\u677f</p><p class="qi-template-row-sub">\u63a8\u8350\u7528\u4e8e\u5feb\u901f\u5f55\u5165</p></div><div class="qi-template-row-actions"><button type="button" class="qi-template-action-btn" onclick="qiUseStdTemplate()">\u4f7f\u7528</button></div></div>'];(customImportTemplates||[]).forEach(function(t,i){var isEdit=editing===i?" is-editing":"";rows.push('<div class="qi-template-row'+isEdit+'"><div class="qi-template-row-main" onclick="qiUseCustomTemplate('+i+')"><p class="qi-template-row-title">'+esc(t.name||("\u6a21\u677f"+(i+1)))+'</p><p class="qi-template-row-sub">'+esc(qiTemplatePreview(t.content))+'</p></div><div class="qi-template-row-actions"><button type="button" class="qi-template-action-btn" onclick="qiUseCustomTemplate('+i+')">\u4f7f\u7528</button><button type="button" class="qi-template-action-btn is-soft" onclick="qiOpenTemplateEditor('+i+')">\u7f16\u8f91</button></div></div>')});list.innerHTML=rows.join("");if(editing>=0){qiOpenTemplateEditor(editing,true)}else{qiCloseTemplateEditor(true)}}
function qiOpenTemplateEditor(idx,silent){
  var t=(customImportTemplates||[])[idx];
  if(!t){
    if(!silent)toast("\u6a21\u677f\u4e0d\u5b58\u5728");
    return;
  }
  window._qiTplEditingIndex=idx;
  var box=document.getElementById("qiTemplateEditor"),nameEl=document.getElementById("qiTplName"),contentEl=document.getElementById("qiTplContent"),titleEl=document.getElementById("qiTemplateEditorTitle");
  if(!box||!nameEl||!contentEl)return;
  box.classList.add("is-open");
  if(titleEl)titleEl.textContent="\u7f16\u8f91\u6a21\u677f \u00b7 "+(t.name||("\u6a21\u677f"+(idx+1)));
  nameEl.value=t.name||("\u6a21\u677f"+(idx+1));
  contentEl.value=t.content||"";
  qiRenderTemplatePanelSelection();
  qiScheduleTemplateScrollbarSync();
  setTimeout(function(){
    try{
      nameEl.focus({preventScroll:true});
      if(nameEl.setSelectionRange){
        var len=nameEl.value.length;
        nameEl.setSelectionRange(len,len);
      }
    }catch(e){}
    qiScheduleTemplateScrollbarSync();
  },18);
}
function qiRenderTemplatePanelSelection(){var editing=typeof window._qiTplEditingIndex==="number"?window._qiTplEditingIndex:-1;document.querySelectorAll(".qi-template-row").forEach(function(row,idx){if(idx===0)return;row.classList.toggle("is-editing",editing===idx-1)})}
function qiCloseTemplateEditor(silent){
  if(!silent)window._qiTplEditingIndex=-1;
  var box=document.getElementById("qiTemplateEditor");
  if(box)box.classList.remove("is-open");
  if(!silent)qiRenderTemplatePanelSelection();
  qiScheduleTemplateScrollbarSync();
}
function qiCreateCustomTemplate(){if(!Array.isArray(customImportTemplates))customImportTemplates=[];var next=customImportTemplates.length+1;var item={id:Date.now()+Math.floor(Math.random()*1000),name:"\u6a21\u677f"+next,content:qiGetStdTemplateText()};customImportTemplates.push(item);save();window._qiTplEditingIndex=customImportTemplates.length-1;qiRenderTemplatePanel();toast("\u5df2\u65b0\u5efa\u6a21\u677f")}
function qiSaveEditingTemplate(){var idx=window._qiTplEditingIndex;if(typeof idx!=="number"||idx<0||!(customImportTemplates||[])[idx]){toast("\u8bf7\u5148\u9009\u62e9\u6a21\u677f");return}var nameEl=document.getElementById("qiTplName"),contentEl=document.getElementById("qiTplContent");if(!nameEl||!contentEl)return;var nextName=String(nameEl.value||"").trim()||("\u6a21\u677f"+(idx+1));customImportTemplates[idx].name=nextName.slice(0,20);customImportTemplates[idx].content=String(contentEl.value||"").trim();save();qiRenderTemplatePanel();toast("\u6a21\u677f\u5df2\u4fdd\u5b58")}
function qiDeleteEditingTemplate(){var idx=window._qiTplEditingIndex;if(typeof idx!=="number"||idx<0||!(customImportTemplates||[])[idx]){toast("\u8bf7\u5148\u9009\u62e9\u6a21\u677f");return}if((customImportTemplates||[]).length<=1){customImportTemplates[idx].name="\u6a21\u677f1";customImportTemplates[idx].content="";save();qiRenderTemplatePanel();toast("\u5df2\u6e05\u7a7a\u8be5\u6a21\u677f");return}customImportTemplates.splice(idx,1);save();window._qiTplEditingIndex=-1;qiRenderTemplatePanel();toast("\u6a21\u677f\u5df2\u5220\u9664")}
function qiUseEditingTemplate(){var idx=window._qiTplEditingIndex;if(typeof idx!=="number"||idx<0||!(customImportTemplates||[])[idx]){toast("\u8bf7\u5148\u9009\u62e9\u6a21\u677f");return}var contentEl=document.getElementById("qiTplContent");if(!contentEl){qiUseCustomTemplate(idx);return}var ta=document.getElementById("quickImportText");if(!ta)return;var txt=String(contentEl.value||"").trim();if(!txt){toast("\u6a21\u677f\u5185\u5bb9\u4e3a\u7a7a");return}ta.value=txt;setQuickImportTab("paste");qiRenderPreview()}
let customImportTemplates=[{id:1,name:"\u6a21\u677f1",content:""},{id:2,name:"\u6a21\u677f2",content:""},{id:3,name:"\u6a21\u677f3",content:""}];
function showTemplateModal(){const stdTpl=`任务名称：（填写任务标题）\n标签：工作 / 个人 / 学习 / 健康\n优先级：低 / 中 / 高\n建议时间：（填写时间，如 09:00）\n预计耗时：（填写时长，如 30 分钟）\n重复规则：不重复 / 每天 / 每周\n备注：（选填）\n子任务：\n  - （选填子任务1）\n  - （选填子任务2）`;window._currentTplTab=window._currentTplTab||"std";let h=`<p style="font-weight:600;font-size:1.05rem;margin-bottom:16px">📋 选择模板</p><div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--inp-bd);flex-wrap:wrap"><button data-tpl-tab="std" onclick="switchTplTab('std')" style="background:${window._currentTplTab==="std"?"var(--acc)":"var(--hov)"};border:none;color:${window._currentTplTab==="std"?"#fff":"var(--text3)"};padding:8px 14px;border-radius:8px 8px 0 0;cursor:pointer;font-size:.88rem;font-weight:${window._currentTplTab==="std"?"600":"500"};transition:all .2s">📌 标准模板</button>`;customImportTemplates.forEach((t,i)=>{h+=`<button data-tpl-tab="${i}" onclick="switchTplTab(${i})" style="background:${window._currentTplTab===i?"var(--acc)":"var(--hov)"};border:none;color:${window._currentTplTab===i?"#fff":"var(--text3)"};padding:8px 14px;border-radius:8px 8px 0 0;cursor:pointer;font-size:.88rem;font-weight:${window._currentTplTab===i?"600":"500"};transition:all .2s">${t.name}</button>`});h+=`</div><div id="tplContent" style="min-height:200px"></div><div class="modal-actions" style="margin-top:16px"><button class="mbtn-c" onclick="clM()">关闭</button></div>`;document.getElementById("mBody").innerHTML=h;document.getElementById("mBg").classList.add("show");renderTplTab()}
function switchTplTab(tab){window._currentTplTab=tab;renderTplTab()}
function renderTplTab(){const stdTpl=`任务名称：（填写任务标题）\n标签：工作 / 个人 / 学习 / 健康\n优先级：低 / 中 / 高\n建议时间：（填写时间，如 09:00）\n预计耗时：（填写时长，如 30 分钟）\n重复规则：不重复 / 每天 / 每周\n备注：（选填）\n子任务：\n  - （选填子任务1）\n  - （选填子任务2）`;let h="";if(window._currentTplTab==="std"){h=`<div style="background:var(--card);border:1.5px solid var(--inp-bd);border-radius:10px;padding:14px;font-size:.82rem;color:var(--text2);white-space:pre-wrap;line-height:1.7;max-height:220px;overflow-y:auto;margin-bottom:12px;text-align:left">${esc(stdTpl)}</div><button onclick="copyToClipboard(\`${stdTpl.replace(/`/g,"\\`")}\`)" style="background:var(--acc);border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:600;width:100%">📋 复制到剪贴板</button>`}else{const t=customImportTemplates[window._currentTplTab];h=`<div style="margin-bottom:12px"><label style="font-size:.85rem;color:var(--text2);font-weight:500;display:block;margin-bottom:6px">模板名称</label><div style="display:flex;gap:6px"><input type="text" id="tplRename" value="${esc(t.name)}" maxlength="20" style="flex:1;border:1.5px solid var(--inp-bd);border-radius:8px;padding:8px 12px;font-size:.88rem;color:var(--text);background:var(--inp-bg);outline:0"><button onclick="renameCustomTemplate(${window._currentTplTab})" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:8px 12px;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:500;white-space:nowrap">✓ 保存</button></div></div><div style="margin-bottom:12px"><label style="font-size:.85rem;color:var(--text2);font-weight:500;display:block;margin-bottom:6px">模板内容</label><textarea id="tplEdit" placeholder="输入模板内容…" style="width:100%;min-height:140px;border:1.5px solid var(--inp-bd);border-radius:8px;padding:10px 12px;font-size:.82rem;color:var(--text);background:var(--inp-bg);outline:0;resize:vertical;font-family:inherit;line-height:1.6;text-align:left">${esc(t.content)}</textarea></div><div style="display:flex;gap:8px"><button onclick="saveCustomTemplateContent(${window._currentTplTab})" style="background:var(--acc);border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:600;flex:2"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-.15em;margin-right:3px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>保存模板</button>${t.content?`<button onclick="copyToClipboard(\`${t.content.replace(/`/g,"\\`")}\`)" style="background:var(--acc-bg);border:1.5px solid var(--acc-bd);color:var(--acc);padding:8px 12px;border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:500;flex:1">📋 复制</button>`:""}</div>`}document.getElementById("tplContent").innerHTML=h;updateTplTabStyles()}
function updateTplTabStyles(){const btns=document.querySelectorAll("[data-tpl-tab]");btns.forEach(btn=>{const isActive=btn.getAttribute("data-tpl-tab")===String(window._currentTplTab);btn.style.background=isActive?"var(--acc)":"var(--hov)";btn.style.color=isActive?"#fff":"var(--text3)";btn.style.fontWeight=isActive?"600":"500"})}
function renameCustomTemplate(idx){const newName=document.getElementById("tplRename").value.trim();if(!newName){toast("⚠️ 请输入模板名称");return}customImportTemplates[idx].name=newName;save();clM();toast("✅ 模板名称已更新")}
function saveCustomTemplateContent(idx){const content=document.getElementById("tplEdit").value.trim();customImportTemplates[idx].content=content;save();clM();toast("✅ 模板已保存")}
function copyToClipboard(text){try{navigator.clipboard.writeText(text).then(()=>{toast("✅ 已复制到剪贴板")}).catch(()=>{fallbackCopy(text)})}catch(e){fallbackCopy(text)}}
function fallbackCopy(text){const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("✅ 已复制到剪贴板")}catch(e){toast("❌ 复制失败")}document.body.removeChild(ta)}
function parseQuickImport(text){const lines=text.split("\n").map(l=>l.trim()).filter(l=>l);const task={text:"",priority:"normal",planTime:"",duration:0,tags:[],note:"",subtasks:[],recurType:"none",execDate:""};let inSubtasks=false;for(let i=0;i<lines.length;i++){const line=lines[i];if(line.startsWith("-")||line.startsWith("•")){if(inSubtasks){task.subtasks.push(line.replace(/^[-•]\s*/,"").trim())}continue}if(line.includes("子任务")||line.toLowerCase().includes("subtask")){inSubtasks=true;continue}inSubtasks=false;const colonIdx=line.indexOf("：")||line.indexOf(":");if(colonIdx===-1)continue;const key=line.substring(0,colonIdx).trim().toLowerCase();const value=line.substring(colonIdx+1).trim();if(key.includes("任务名")||key.includes("名称")||key.includes("title")||key.includes("task")){task.text=value}else if(key.includes("执行时间")||key.includes("日期")||key.includes("date")){const dateMatch=value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(dateMatch){task.execDate=`${dateMatch[1]}-${String(dateMatch[2]).padStart(2,"0")}-${String(dateMatch[3]).padStart(2,"0")}`}}else if(key.includes("标签")||key.includes("tag")){const tagName=value;const existingTag=customTags.find(t=>t.name===tagName);if(existingTag){task.tags.push(existingTag.id)}}else if(key.includes("优先级")||key.includes("priority")){if(value.includes("高")||value.toLowerCase().includes("high"))task.priority="high";else if(value.includes("低")||value.toLowerCase().includes("low"))task.priority="low";else task.priority="medium"}else if(key.includes("时间")||key.includes("time")){const timeMatch=value.match(/(\d{1,2}):(\d{2})/);if(timeMatch){task.planTime=timeMatch[0]}}else if(key.includes("耗时")||key.includes("duration")){const numMatch=value.match(/(\d+)/);if(numMatch){task.duration=parseInt(numMatch[1])}}else if(key.includes("备注")||key.includes("note")){task.note=value}else if(key.includes("重复")||key.includes("repeat")||key.includes("recur")){if(value.includes("每天")||value.toLowerCase().includes("daily"))task.recurType="daily";else if(value.includes("每周")||value.toLowerCase().includes("weekly"))task.recurType="weekly";else task.recurType="none"}}return task}
function doQuickImport(){const ta=document.getElementById("quickImportText");const text=(ta&&ta.value?ta.value:"").trim();if(!text){toast("⚠️ 请输入任务内容");setQuickImportTab("paste");if(ta)ta.focus();return}try{const parsed=parseQuickImport(text);if(!parsed.text){toast("⚠️ 未找到任务名称");setQuickImportTab("paste");if(ta)ta.focus();return}const targetDate=parsed.execDate||sel;if(!T[targetDate])T[targetDate]=[];const bid=Date.now();const newTask=mkTask(parsed.text,parsed.priority,parsed.planTime,parsed.duration,{tags:parsed.tags,note:parsed.note,subtasks:parsed.subtasks.map((s,i)=>({id:bid+i+Math.floor(Math.random()*1e4),text:s,done:false}))});T[targetDate].push(newTask);if(parsed.recurType!=="none"){const rid="rr_"+Date.now();recurRules.push({id:rid,text:parsed.text,priority:parsed.priority,planTime:parsed.planTime,duration:parsed.duration,type:parsed.recurType,weekdays:parsed.recurType==="weekly"?[1,2,3,4,5]:[],monthDay:parseDS(targetDate).getDate(),startDate:targetDate,active:true,tags:parsed.tags,color:"",note:parsed.note,subtasks:parsed.subtasks.map(s=>({text:s}))});newTask.recurRuleId=rid}if(ta)ta.value="";closeQuickImportModal();rCal();if(targetDate===sel)rT();rTagDropdownContent();save();toast(`✅ 已添加到 ${disp(targetDate)}`)}catch(err){toast("❌ 解析失败："+err.message)}}

function qiCopyCustomTemplate(idx){
  var t=(customImportTemplates||[])[idx];
  if(!t||!String(t.content||"").trim()){
    toast("\u8be5\u6a21\u677f\u6682\u65e0\u5185\u5bb9");
    return;
  }
  copyToClipboard(String(t.content||""));
}

function qiRenderTemplatePanel(){
  var list=document.getElementById("qiTemplateList");
  if(!list)return;
  var editing=typeof window._qiTplEditingIndex==="number"?window._qiTplEditingIndex:-1;
  var rows=[
    '<div class="qi-template-row qi-template-row-std"><div class="qi-template-row-main"><p class="qi-template-row-title">\u6807\u51c6\u6a21\u677f</p><p class="qi-template-row-sub">\u63a8\u8350\u7528\u4e8e\u5feb\u901f\u5f55\u5165</p></div><div class="qi-template-row-actions"><button type="button" class="qi-template-action-btn" onclick="qiUseStdTemplate()">\u4f7f\u7528</button><button type="button" class="qi-template-action-btn is-soft" onclick="copyToClipboard(qiGetStdTemplateText())">\u590d\u5236</button></div></div>'
  ];
  (customImportTemplates||[]).forEach(function(t,i){
    var isEdit=editing===i?" is-editing":"";
    rows.push(
      '<div class="qi-template-row'+isEdit+'"><div class="qi-template-row-main" onclick="qiUseCustomTemplate('+i+')"><p class="qi-template-row-title">'+esc(t.name||("\u6a21\u677f"+(i+1)))+'</p><p class="qi-template-row-sub">'+esc(qiTemplatePreview(t.content))+'</p></div><div class="qi-template-row-actions"><button type="button" class="qi-template-action-btn" onclick="qiUseCustomTemplate('+i+')">\u4f7f\u7528</button><button type="button" class="qi-template-action-btn is-soft" onclick="qiCopyCustomTemplate('+i+')">\u590d\u5236</button><button type="button" class="qi-template-action-btn is-soft" onclick="qiOpenTemplateEditor('+i+')">\u7f16\u8f91</button></div></div>'
    );
  });
  list.innerHTML=rows.join("");
  if(editing>=0){qiOpenTemplateEditor(editing,true)}else{qiCloseTemplateEditor(true)}
  qiScheduleTemplateScrollbarSync();
}

function qiEnsureTemplateScrollbarElements(){
  var wrap=document.querySelector(".qi-modal-wrap");
  var panel=wrap?wrap.querySelector('.qi-panel[data-qi-panel="template"]'):null;
  var content=panel?panel.querySelector(".qi-template-box"):null;
  if(!panel||!content)return null;
  panel.classList.add("qi-template-scroll-host");
  var rail=panel.querySelector(".qi-template-scrollbar");
  if(!rail){
    rail=document.createElement("div");
    rail.className="drawer-scrollbar qi-template-scrollbar";
    rail.setAttribute("aria-hidden","true");
    var thumb=document.createElement("div");
    thumb.className="drawer-scrollbar-thumb qi-template-scrollbar-thumb";
    rail.appendChild(thumb);
    rail.addEventListener("pointerdown",qiHandleTemplateScrollbarPointerDown);
    panel.appendChild(rail);
  }
  return{wrap:wrap,panel:panel,content:content,rail:rail,thumb:rail.querySelector(".qi-template-scrollbar-thumb")};
}

function qiInitTemplateScrollbar(){
  var refs=qiEnsureTemplateScrollbarElements();
  if(!refs)return;
  if(!refs.content.dataset.qiScrollbarBound){
    refs.content.addEventListener("scroll",qiScheduleTemplateScrollbarSync,{passive:true});
    refs.content.dataset.qiScrollbarBound="true";
  }
  if(!window.__qiTemplateScrollbarResizeBound){
    window.addEventListener("resize",qiScheduleTemplateScrollbarSync);
    document.addEventListener("pointerup",qiScheduleTemplateScrollbarSync,true);
    window.__qiTemplateScrollbarResizeBound=true;
  }
  if(typeof ResizeObserver==="function"){
    if(!qiTemplateScrollbarResizeObserver){
      qiTemplateScrollbarResizeObserver=new ResizeObserver(function(){
        qiScheduleTemplateScrollbarSync();
      });
    }
    qiTemplateScrollbarResizeObserver.disconnect();
    qiTemplateScrollbarResizeObserver.observe(refs.content);
    qiTemplateScrollbarResizeObserver.observe(refs.panel);
  }
  qiScheduleTemplateScrollbarSync();
}

function qiScheduleTemplateScrollbarSync(){
  if(qiTemplateScrollbarRaf!==null)return;
  qiTemplateScrollbarRaf=window.requestAnimationFrame(function(){
    qiTemplateScrollbarRaf=null;
    qiSyncTemplateScrollbar();
  });
}

function qiSyncTemplateScrollbar(){
  var refs=qiEnsureTemplateScrollbarElements();
  if(!refs||!refs.rail||!refs.thumb)return;
  var viewportHeight=refs.content.clientHeight;
  var scrollHeight=refs.content.scrollHeight;
  var maxScroll=Math.max(0,scrollHeight-viewportHeight);
  var isTemplateTab=!!(refs.wrap&&refs.wrap.getAttribute("data-tab")==="template");
  var isActive=isTemplateTab&&refs.panel.classList.contains("is-active")&&window._quickImportModalOpen;
  var isScrollable=isActive&&maxScroll>1;
  var railInset=6;
  var railHeight=Math.max(0,viewportHeight-railInset*2);
  var canShowScrollbar=isScrollable&&railHeight>0;
  refs.rail.style.top=(refs.content.offsetTop+railInset)+"px";
  refs.rail.style.height=railHeight+"px";
  refs.rail.classList.toggle("is-visible",canShowScrollbar);
  if(!canShowScrollbar){
    refs.thumb.style.height="0px";
    refs.thumb.style.transform="translateY(0)";
    return;
  }
  var thumbHeight=Math.min(railHeight,Math.max(40,Math.round((viewportHeight/scrollHeight)*railHeight)));
  var maxThumbTravel=Math.max(0,railHeight-thumbHeight);
  var thumbTop=maxScroll>0?Math.round((refs.content.scrollTop/maxScroll)*maxThumbTravel):0;
  refs.thumb.style.height=thumbHeight+"px";
  refs.thumb.style.transform="translateY("+thumbTop+"px)";
}

function qiHandleTemplateScrollbarPointerDown(event){
  var refs=qiEnsureTemplateScrollbarElements();
  if(!refs||!refs.rail||!refs.thumb)return;
  var maxScroll=refs.content.scrollHeight-refs.content.clientHeight;
  if(maxScroll<=0)return;
  var railRect=refs.rail.getBoundingClientRect();
  var thumbRect=refs.thumb.getBoundingClientRect();
  var maxThumbTravel=Math.max(0,railRect.height-thumbRect.height);
  event.preventDefault();
  event.stopPropagation();
  if(event.target.closest(".qi-template-scrollbar-thumb")){
    qiTemplateScrollbarDragState={pointerId:event.pointerId,startY:event.clientY,startScrollTop:refs.content.scrollTop,maxScroll:maxScroll,maxThumbTravel:maxThumbTravel,content:refs.content};
    refs.rail.classList.add("is-dragging");
    refs.thumb.classList.add("is-dragging");
    window.addEventListener("pointermove",qiHandleTemplateScrollbarPointerMove);
    window.addEventListener("pointerup",qiHandleTemplateScrollbarPointerUp);
    window.addEventListener("pointercancel",qiHandleTemplateScrollbarPointerUp);
    return;
  }
  var clickThumbTop=Math.max(0,Math.min(maxThumbTravel,event.clientY-railRect.top-(thumbRect.height/2)));
  refs.content.scrollTop=maxThumbTravel>0?(clickThumbTop/maxThumbTravel)*maxScroll:0;
  qiScheduleTemplateScrollbarSync();
}

function qiHandleTemplateScrollbarPointerMove(event){
  if(!qiTemplateScrollbarDragState)return;
  if(event.pointerId!==qiTemplateScrollbarDragState.pointerId)return;
  event.preventDefault();
  var deltaY=event.clientY-qiTemplateScrollbarDragState.startY;
  var scrollDelta=qiTemplateScrollbarDragState.maxThumbTravel>0?(deltaY/qiTemplateScrollbarDragState.maxThumbTravel)*qiTemplateScrollbarDragState.maxScroll:0;
  qiTemplateScrollbarDragState.content.scrollTop=qiTemplateScrollbarDragState.startScrollTop+scrollDelta;
  qiScheduleTemplateScrollbarSync();
}

function qiHandleTemplateScrollbarPointerUp(event){
  if(!qiTemplateScrollbarDragState)return;
  if(event.pointerId!==qiTemplateScrollbarDragState.pointerId)return;
  qiTemplateScrollbarDragState=null;
  window.removeEventListener("pointermove",qiHandleTemplateScrollbarPointerMove);
  window.removeEventListener("pointerup",qiHandleTemplateScrollbarPointerUp);
  window.removeEventListener("pointercancel",qiHandleTemplateScrollbarPointerUp);
  var refs=qiEnsureTemplateScrollbarElements();
  if(refs&&refs.rail&&refs.thumb){
    refs.rail.classList.remove("is-dragging");
    refs.thumb.classList.remove("is-dragging");
  }
  qiScheduleTemplateScrollbarSync();
}

function qiDestroyTemplateScrollbar(){
  if(qiTemplateScrollbarRaf!==null){
    window.cancelAnimationFrame(qiTemplateScrollbarRaf);
    qiTemplateScrollbarRaf=null;
  }
  qiTemplateScrollbarDragState=null;
  window.removeEventListener("pointermove",qiHandleTemplateScrollbarPointerMove);
  window.removeEventListener("pointerup",qiHandleTemplateScrollbarPointerUp);
  window.removeEventListener("pointercancel",qiHandleTemplateScrollbarPointerUp);
  if(qiTemplateScrollbarResizeObserver)qiTemplateScrollbarResizeObserver.disconnect();
}

(function(){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){syncAddTaskMainLabel(false);syncQuickImportEntryState()});else{syncAddTaskMainLabel(false);syncQuickImportEntryState()}})();

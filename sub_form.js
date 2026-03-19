/* --- Subscription Form --- */

var _subDraft = null;

function _subSetCycle(v){
  window._subCalcDone=false;_subUpdateCalcBtn();
  _subCycle=v;
  document.querySelectorAll('.sub-cycle-btn').forEach(b=>{
    const on=b.dataset.v===v;
    b.style.background=on?'linear-gradient(135deg,#818cf8,#6366f1)':'var(--inp-bg)';
    b.style.color=on?'#fff':'var(--text2)';
    b.style.fontWeight=on?'700':'400';
    b.style.borderColor=on?'#6366f1':'var(--inp-bd)';
    b.style.boxShadow=on?'0 4px 12px rgba(99,102,241,.3)':'none';
    b.style.transform=on?'translateY(-2px)':'translateY(0)';
  });
  const isCustom=v==='custom';
  // Show/hide custom days wrap
  const wrap=document.getElementById('subCustomDaysWrap');
  if(wrap) wrap.style.display=isCustom?'flex':'none';
  // Show/hide date row vs days-only row
  const dateRow=document.getElementById('subDateRow');
  if(dateRow) dateRow.style.display=isCustom?'none':'block';
  // If switching to custom, show preview for current default days
  if(isCustom){ setTimeout(_subUpdateDateFromDays, 0); return; }
  // Cycle and date are independent - no auto-set
}

function _subUpdateDaysLeft(){
  const dateEl=document.getElementById('subDateIn');
  const badge=document.getElementById('subDaysInline');
  if(!dateEl||!badge) return;
  const val=(dateEl.value||'').substring(0,10);
  if(!val){badge.style.display='none';return;}
  const e=new Date(val),t=new Date();
  t.setHours(0,0,0,0);e.setHours(0,0,0,0);
  const days=Math.ceil((e-t)/864e5);
  var bg,color,text,anim='';
  if(days>60){bg='linear-gradient(135deg,#d1fae5,#a7f3d0)';color='#065f46';text='🟢 还剩 '+days+' 天';}
  else if(days>=30){bg='linear-gradient(135deg,#fef9c3,#fde68a)';color='#854d0e';text='🟡 还剩 '+days+' 天';}
  else if(days>=1){bg='linear-gradient(135deg,#fee2e2,#fca5a5)';color='#991b1b';text='🔴 还剩 '+days+' 天';anim='subBadgePulse 1.8s ease-in-out infinite';}
  else{bg='linear-gradient(135deg,#fee2e2,#fca5a5)';color='#991b1b';text='🔴 已过期 '+Math.abs(days)+' 天';anim='subBadgePulse 1.8s ease-in-out infinite';}
  badge.textContent=text;
  badge.style.display='inline-block';
  badge.style.background=bg;
  badge.style.color=color;
  badge.style.animation=anim;
  badge.style.transition='all 0.3s ease';
}

function _subUpdateDateFromDays(){
  const daysInEl=document.getElementById('subCustomDaysIn');
  const preview=document.getElementById('subCustomDatePreview');
  if(!daysInEl) return;
  const days=parseInt(daysInEl.value)||0;
  window._subCalcDone=false;_subUpdateCalcBtn();
  if(days<=0){if(preview)preview.textContent='';return;}
  const d=new Date();
  d.setDate(d.getDate()+days);
  const pad=n=>String(n).padStart(2,'0');
  if(preview) preview.textContent='到期 '+d.getFullYear()+'/'+pad(d.getMonth()+1)+'/'+pad(d.getDate());
}

function _subSaveDraft(){
  const nameEl=document.getElementById('subNameIn');
  if(!nameEl) return;
  const name=(nameEl.value||'').trim();
  const dateEl=document.getElementById('subDateIn');
  const costEl=document.getElementById('subCostIn');
  const noteEl=document.getElementById('subNoteIn');
  const customDaysEl=document.getElementById('subCustomDaysIn')||document.getElementById('subCustomDaysIn');
  const cost=(costEl?costEl.value:'')||'';
  const note=(noteEl?noteEl.value:'')||'';
  const customDays=(customDaysEl?customDaysEl.value:'')||'';
  if(!name&&!cost&&!note&&!customDays) return;
  _subDraft={name:nameEl.value||'',expireDate:dateEl?dateEl.value:'',cost,cycle:_subCycle,note,customDays,renewal:window._subRenewalVal||'manual'};
}

function _subCancel(){
  var btn=document.getElementById('subCancelBtn');
  if(!btn) return;
  // Show inline confirm popover near cancel button
  var existing=document.getElementById('subCancelConfirm');
  if(existing){existing.remove();return;}
  var pop=document.createElement('div');
  pop.id='subCancelConfirm';
  pop.style.cssText='position:absolute;z-index:9999;background:#fff;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,.12);font-size:.82rem;color:#374151;white-space:nowrap;display:flex;flex-direction:column;gap:8px;';
  pop.innerHTML='<span style="font-weight:600;color:#dc2626">\u786e\u5b9a\u653e\u5f03\u5df2\u586b\u5185\u5bb9\uff1f</span>'
    +'<div style="display:flex;gap:6px">'
    +'<button onclick="_subClearDraft();clM();document.getElementById(\'subCancelConfirm\')&&document.getElementById(\'subCancelConfirm\').remove()" style="flex:1;padding:5px 10px;border-radius:7px;border:none;background:#ef4444;color:#fff;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit">\u786e\u5b9a</button>'
    +'<button onclick="document.getElementById(\'subCancelConfirm\').remove()" style="flex:1;padding:5px 10px;border-radius:7px;border:1.5px solid #e2e8f0;background:transparent;color:#6b7280;font-size:.8rem;cursor:pointer;font-family:inherit">\u8fd4\u56de</button>'
    +'</div>';
  // Position above the cancel button
  var rect=btn.getBoundingClientRect();
  var formRect=document.getElementById('subForm').getBoundingClientRect();
  pop.style.bottom=(formRect.bottom-rect.top+6)+'px';
  pop.style.left=(rect.left-formRect.left)+'px';
  document.getElementById('subForm').style.position='relative';
  document.getElementById('subForm').appendChild(pop);
  // Close on outside click
  setTimeout(function(){
    function outsideClick(e){if(!pop.contains(e.target)&&e.target!==btn){pop.remove();document.removeEventListener('click',outsideClick);}}
    document.addEventListener('click',outsideClick);
  },10);
}
function _subSaveClick(e,id){
  var r=document.createElement('span');
  var btn=e.currentTarget;
  var rect=btn.getBoundingClientRect();
  r.style='position:absolute;border-radius:50%;background:rgba(255,255,255,.6);transform:scale(0);animation:subRipple .6s linear;pointer-events:none;width:100px;height:100px;left:'+((e.clientX-rect.left-50))+'px;top:'+((e.clientY-rect.top-50))+'px';
  btn.appendChild(r);
  setTimeout(function(){r.remove();},700);
  btn.classList.add('loading');btn.disabled=true;
  setTimeout(function(){saveSub(id);},120);
}
function _subClearDraft(){ _subDraft=null; }
function _subSetRenewal(v){
  window._subRenewalVal=v;
  var m=document.getElementById('subRenMan');
  var a=document.getElementById('subRenAut');
  if(!m||!a) return;
  if(v==='manual'){
    m.classList.add('ren-on');m.style.borderColor='#c7d2fe';m.style.background='#eef2ff';m.style.color='#4338ca';
    a.classList.remove('ren-on');a.style.borderColor='#e2e8f0';a.style.background='#f8faff';a.style.color='var(--text2)';
  } else {
    a.classList.add('ren-on');a.style.borderColor='#c7d2fe';a.style.background='#eef2ff';a.style.color='#4338ca';
    m.classList.remove('ren-on');m.style.borderColor='#e2e8f0';m.style.background='#f8faff';m.style.color='var(--text2)';
  }
}
function _subUpdateProgress(){
  var name=(document.getElementById('subNameIn')||{}).value||'';
  var date=(document.getElementById('subDateIn')||{}).value||'';
  var cost=(document.getElementById('subCostIn')||{}).value||'';
  var filled=(name.trim()?1:0)+(date?1:0)+(cost?1:0);
  var pct=Math.round(filled/3*100);
  var bar=document.getElementById('subProgress');
  var lbl=document.getElementById('subProgressLbl');
  if(bar)bar.style.width=pct+'%';
  if(lbl)lbl.textContent=filled+' / 3 必填项';
}
function _subCalcDate(){
  var cd=new Date();
  var days=_subCycle==='month'?30:_subCycle==='quarter'?90:_subCycle==='year'?365:(_subCycle==='custom'?parseInt((document.getElementById('subCustomDaysIn')||{}).value)||30:30);
  cd.setDate(cd.getDate()+days);
  var p=function(n){return String(n).padStart(2,'0');};
  var datePart=cd.getFullYear()+'-'+p(cd.getMonth()+1)+'-'+p(cd.getDate());
  window._subCalcDone=true;
  _subSetDate(datePart, true);
  var dp=document.getElementById('subDatePicker');if(dp)dp.value=datePart;
  var di=document.getElementById('subDateInput');if(di)di.value=datePart.replace(/-/g,'/');
  _subUpdateCalcBtn();
}
function _subUpdateCalcBtn(){
  var btn=document.getElementById('subCalcBtn');
  if(!btn) return;
  if(window._subCalcDone){btn.textContent='✓ 已推算';btn.style.color='#22c55e';}
  else{btn.textContent='推算到期';btn.style.color='#818cf8';}
}
function _subSyncHiddenDate(){
  var el=document.getElementById('subDateIn');if(!el)return;
  var d=window._subDateVal||'';var t=window._subTimeVal||'';
  el.value=d+(t?'T'+t:'T00:00');
}
function _subOpenDatePicker(){var inp=document.getElementById('subDatePicker');if(inp)inp.showPicker?inp.showPicker():inp.click();}
function _subOpenTimePicker(){var inp=document.getElementById('subTimePicker');if(inp)inp.showPicker?inp.showPicker():inp.click();}
function _subSetDate(v,fromCalc){
  window._subDateVal=v;
  if(!fromCalc){window._subCalcDone=false;_subUpdateCalcBtn();}
  var di=document.getElementById('subDateInput');
  if(di&&v){di.value=v.replace(/-/g,'/');di.style.color='var(--text)';di.style.fontWeight='600';}
  _subSyncHiddenDate();_subUpdateDaysLeft();
}
function _subSetTime(v){
  window._subTimeVal=v;
  var ti=document.getElementById('subTimeInput');
  var clr=document.getElementById('subTimeClear');
  if(ti){ti.value=v||'';ti.style.color=v?'var(--text)':'#b4c0d8';}
  if(clr){
    if(v){clr.setAttribute('data-has-val','1');clr.style.opacity='1';clr.style.pointerEvents='auto';}
    else{clr.removeAttribute('data-has-val');clr.style.opacity='0';clr.style.pointerEvents='none';}
  }
  _subSyncHiddenDate();
}
function _subClearTime(){
  window._subTimeVal='';
  var ti=document.getElementById('subTimeInput');
  var clr=document.getElementById('subTimeClear');
  if(ti){ti.value='';ti.style.color='#b4c0d8';}
  if(clr){clr.removeAttribute('data-has-val');clr.style.opacity='0';clr.style.pointerEvents='none';}
  _subSyncHiddenDate();
}
function _subBoxMouseEnter(){
  var clr=document.getElementById('subTimeClear');
  if(clr&&clr.getAttribute('data-has-val')){clr.style.opacity='1';clr.style.pointerEvents='auto';}
}
function _subBoxMouseLeave(){
  var clr=document.getElementById('subTimeClear');
  if(clr){clr.style.opacity='0';clr.style.pointerEvents='none';}
}
function _subDateFocus(el){var b=document.getElementById('subDateTimeBox');if(b){b.style.borderColor='#6c63ff';b.style.boxShadow='0 0 0 3px rgba(108,99,255,.1)';}}
function _subDateBlur(el){var b=document.getElementById('subDateTimeBox');if(b){b.style.borderColor='#e2e8f0';b.style.boxShadow='none';}}
function _subTimeFocus(el){var b=document.getElementById('subDateTimeBox');if(b){b.style.borderColor='#6c63ff';b.style.boxShadow='0 0 0 3px rgba(108,99,255,.1)';}}
function _subTimeBlur(el){var b=document.getElementById('subDateTimeBox');if(b){b.style.borderColor='#e2e8f0';b.style.boxShadow='none';}}
function _subDateInputChange(v){
  // Accept YYYY/MM/DD or YYYY-MM-DD
  var clean=v.replace(/\//g,'-').trim();
  var ok=/^\d{4}-\d{2}-\d{2}$/.test(clean);
  var inp=document.getElementById('subDateInput');
  if(ok){
    var d=new Date(clean);
    ok=!isNaN(d.getTime());
  }
  if(ok&&inp){inp.style.borderColor='#6366f1';inp.style.boxShadow='0 0 0 3px rgba(99,102,241,.15)';}
  else if(inp){inp.style.borderColor='#ef4444';inp.style.boxShadow='0 0 0 2px rgba(239,68,68,.15)';}
  if(ok) _subSetDate(clean,false);
}
function _subTimeInputChange(v){
  var clean=v.trim();
  clean=clean.replace(/[^0-9:]/g,'');
  var ok=/^([01]?\d|2[0-3]):[0-5]\d$/.test(clean);
  var inp=document.getElementById('subTimeInput');
  if(ok){
    if(inp)inp.style.color='var(--text)';
    _subSetTime(clean);
  } else if(clean){
    if(inp)inp.style.color='#ef4444';
  } else {
    _subSetTime('');
  }
}
function _subTimeInputAuto(inp){
  var v=inp.value.replace(/[^0-9]/g,'');
  if(v.length>=2&&!inp.value.includes(':')){
    inp.value=v.substring(0,2)+':'+v.substring(2,4);
  }
}
function _subUpdateTimeChip(){
  // update clear btn visibility
  var clr=document.getElementById('subTimeClear');
  if(clr)clr.style.display=window._subTimeVal?'inline':'none';
}


function openSubModal(id){
  const s=id?subscriptions.find(x=>x.id===id):null;
  const draft=(!s&&_subDraft)?_subDraft:null;
  if(s) _subClearDraft();
  _subCycle=s?s.cycle:(draft?draft.cycle:'month');
  window._subRenewalVal=s?(s.renewal||'manual'):(draft?(draft.renewal||'manual'):'manual');

  const pad=n=>String(n).padStart(2,'0');
  const defaultDays=_subCycle==='quarter'?90:_subCycle==='year'?365:30;
  const dd=new Date();dd.setDate(dd.getDate()+defaultDays);
  const pad2=n=>String(n).padStart(2,'0');const _td=new Date();const todayStr=_td.getFullYear()+'-'+pad2(_td.getMonth()+1)+'-'+pad2(_td.getDate());
  const ds=(s?s.expireDate:(draft&&draft.expireDate?draft.expireDate:todayStr)).substring(0,10);
  window._subDateVal=ds;window._subTimeVal='';

  const cycles=[['month','\u6708\u4ed8'],['quarter','\u5b63\u4ed8'],['year','\u5e74\u4ed8'],['custom','\u81ea\u5b9a\u4e49']];
  const IS='width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:.9rem;color:var(--text);background:#f8faff;outline:none;transition:all 0.3s ease;font-family:inherit;box-sizing:border-box'
  const FEon="this.style.borderColor='#818cf8';this.style.boxShadow='0 0 0 3px rgba(129,140,248,.15)'";
  const FEoff="this.style.borderColor='var(--inp-bd)';this.style.boxShadow='none'";
  const FE='onfocus="'+FEon+'" onblur="'+FEoff+'"';
  const lbl=(t,req)=>'<label style="display:flex;align-items:center;gap:7px;font-size:.72rem;font-weight:700;color:#334155;margin-bottom:7px;letter-spacing:.5px;text-transform:uppercase"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#6366f1);flex-shrink:0"></span>'+t+(req?'<span style="color:#ef4444;margin-left:1px">*</span>':'')+'</label>';

  // Compute inline hint for initial date
  let initHint='',initHintColor='#94a3b8',initHintBg='transparent';
  let initCustomDays=30;
  if(ds){
    const e=new Date(ds),t2=new Date();
    t2.setHours(0,0,0,0);e.setHours(0,0,0,0);
    const days=Math.ceil((e-t2)/864e5);
    initCustomDays=days>0?days:30;
    if(days>30){initHint='还剩 '+days+' 天';initHintColor='#16a34a';initHintBg='#f0fdf4';}
    else if(days>=7){initHint='还剩 '+days+' 天';initHintColor='#ca8a04';initHintBg='#fefce8';}
    else if(days>=1){initHint='还剩 '+days+' 天';initHintColor='#ea580c';initHintBg='#fff7ed';}
    else if(days===0){initHint='今天到期';initHintColor='#dc2626';initHintBg='#fef2f2';}
    else{initHint='已到期';initHintColor='#dc2626';initHintBg='#fef2f2';}
  }


  const draftName=draft?esc(draft.name):'';
  const draftCost=draft?draft.cost:'';
  const draftNote=draft?esc(draft.note||''):'';
  const draftCustomDays=draft&&draft.customDays?draft.customDays:initCustomDays;
  const showCustom=_subCycle==='custom';
  const editCustomDays=s&&s.customDays?s.customDays:draftCustomDays;
  const renewal=window._subRenewalVal||'manual';
  const G='margin-bottom:16px';
  const cycleData=[['month','月付','📅','30天'],['quarter','季付','🌿','90天'],['year','年付','📆','365天'],['custom','自定义','⚙️','自设天数']];
  const cyBtns2=cycleData.map(function(row){
    var v=row[0],label=row[1],emoji=row[2],sub=row[3],on=(_subCycle===v);
    var base='flex:1;padding:10px 8px;border-radius:12px;cursor:pointer;border:1.5px solid '+(on?'#6366f1':'#e2e8f0')+';transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;overflow:hidden;background:'+(on?'linear-gradient(135deg,#818cf8,#6366f1)':'#f8faff')+';color:'+(on?'#fff':'var(--text2)')+';box-shadow:'+(on?'0 4px 12px rgba(99,102,241,.3)':'none')+';transform:'+(on?'translateY(-2px)':'translateY(0)');
    return '<button type="button" class="sub-cycle-btn" data-v="'+v+'" onclick="_subSetCycle(this.dataset.v)" style="'+base+'"><span style="font-size:1.1rem">'+emoji+'</span><span style="font-size:.85rem;font-weight:700">'+label+'</span>'+(sub?'<span style="font-size:.7rem;opacity:.8">'+sub+'</span>':'')+(on?'<span style="position:absolute;top:4px;right:6px;font-size:.65rem;color:#fff;opacity:.9">✓</span>':'')+'</button>';
  }).join('')
  const estLabel=_subCycle==='month'?'按月付 +30天':_subCycle==='quarter'?'按季付 +90天':_subCycle==='year'?'按年付 +365天':'';


  const h=
    '<style>'
    +'@keyframes subBadgePulse{0%,100%{opacity:1}50%{opacity:.5}}'
    +'@keyframes subNameShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}'
    +'@keyframes subRipple{to{transform:scale(4);opacity:0}}'
    +'#subCalcBtn:hover{background:linear-gradient(135deg,#818cf8,#6366f1)!important;color:#fff!important;border-color:transparent!important}'
    +'.sub-cycle-btn:hover{transform:translateY(-3px)!important;box-shadow:0 6px 16px rgba(99,102,241,.22)!important;border-color:#818cf8!important}'
    +'#subRenMan:hover,#subRenAut:hover{border-color:#818cf8!important;color:#6366f1!important}'
    +'#subCancelBtn:hover{border-color:#ef4444!important;color:#ef4444!important}'
    +'#subSaveBtn:hover{transform:translateY(-2px)!important;box-shadow:0 8px 24px rgba(99,102,241,.45)!important}'
    +'input::placeholder,textarea::placeholder{color:#b4c0d8}'
    +'#subNoteIn::-webkit-scrollbar{display:none}#subNoteIn{scrollbar-width:none}'
    +'#subCostIn::-webkit-inner-spin-button,#subCostIn::-webkit-outer-spin-button{display:none}#subCostIn{-moz-appearance:textfield}'
    +'#subCustomDaysIn::-webkit-inner-spin-button,#subCustomDaysIn::-webkit-outer-spin-button{display:none}#subCustomDaysIn{-moz-appearance:textfield}'
    +'@keyframes subSpin{to{transform:rotate(360deg)}}'
    +'input:focus,textarea:focus{border-color:#6c63ff!important;box-shadow:0 0 0 3px rgba(108,99,255,.1)!important}'
    +'.sub-divider{height:1px;background:linear-gradient(to right,transparent,#e8eaf6,transparent);margin:4px 0 16px}'
    +'#subSaveBtn .btn-spinner{display:none}#subSaveBtn.loading .btn-text{display:none}#subSaveBtn.loading .btn-spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:subSpin .7s linear infinite;vertical-align:middle}'
    +'</style>'
    +'<div id="subForm">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1.5px solid var(--task-bd)">'
    +'<div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#818cf8,#6366f1);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;box-shadow:0 6px 18px rgba(99,102,241,.38)">'
    +(s?'\u270f\ufe0f':'\ud83d\udce6')
    +'</div><div>'
    +'<div style="font-size:1rem;font-weight:800;color:var(--text);letter-spacing:-.4px">'+(s?'\u7f16\u8f91\u8ba2\u9605':'\u6dfb\u52a0\u8ba2\u9605')+'</div>'
    +'<div style="font-size:.74rem;color:#94a3b8;margin-top:2px">'+(s?'\u4fee\u6539\u8ba2\u9605\u4fe1\u606f':'\u8bb0\u5f55\u4e00\u4e2a\u65b0\u7684\u8ba2\u9605\u670d\u52a1')+'</div>'
    +'</div></div>'
        +'<div id="subFormErr" style="display:none"></div>'
+'<div style="'+G+'">'+lbl('服务名称',true)
    +'<input id="subNameIn" type="text" value="'+(s?esc(s.name):draftName)+'" placeholder="\u8bf7\u8f93\u5165\u8ba2\u9605\u670d\u52a1\u540d\u79f0" style="'+IS+'" '+FE+' autocomplete="off" oninput="var e=document.getElementById(\'subNameErr\');if(e&&this.value.trim())e.style.display=\'none\';">'
    +'<div id="subNameErr" style="display:none;color:#ef4444;font-size:.78rem;font-weight:600;margin-top:5px">\u26a0\ufe0f \u8bf7\u586b\u5199\u670d\u52a1\u540d\u79f0</div>'
    +'</div>'
    +'<div style="'+G+'">'+lbl('订阅周期',true)
    +'<div class="sub-divider"></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+cyBtns2+'</div>'
    +'<div id="subCustomDaysWrap" style="display:'+(showCustom?'flex':'none')+';align-items:center;gap:8px;margin-top:10px;padding:10px 14px;border:1.5px dashed #818cf8;border-radius:10px;background:#f5f3ff">'
    +'<input id="subCustomDaysIn" type="number" value="'+editCustomDays+'" placeholder="30" min="1" step="1" style="width:72px;border:1.5px solid #818cf8;border-radius:10px;padding:8px 10px;font-size:.9rem;color:#6366f1;font-weight:700;text-align:center;background:#ede9fe;outline:none;font-family:inherit;box-sizing:border-box" '+FE+' oninput="_subUpdateDateFromDays()">'
    +'<span style="font-size:.85rem;color:var(--text2)">\u5929</span>'
    +'<span id="subCustomDatePreview" style="font-size:.75rem;color:#6366f1;font-weight:600;margin-left:6px;white-space:nowrap">'+(function(){if(!showCustom||!editCustomDays)return '';var _d=new Date();_d.setDate(_d.getDate()+parseInt(editCustomDays));var _p=function(n){return String(n).padStart(2,'0');};return '到期 '+_d.getFullYear()+'/'+_p(_d.getMonth()+1)+'/'+_p(_d.getDate());})()+'</span></div>'
    +'</div>'
    // Expiry date - separate field
    +'<div class="sub-divider"></div>'
    +'<div style="'+G+'">'+'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px"><label style="display:flex;align-items:center;gap:7px;font-size:.72rem;font-weight:700;color:#334155;letter-spacing:.5px;text-transform:uppercase"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#6366f1);flex-shrink:0"></span>到期日期<span style="color:#ef4444;margin-left:1px">*</span></label><button type="button" id="subCalcBtn" onclick="_subCalcDate()" style="font-size:.74rem;color:#818cf8;background:none;border:none;cursor:pointer;font-family:inherit;padding:0;font-weight:600">推算到期</button></div>'

    +'<input id="subDateIn" type="hidden" value="'+ds+'T00:00">'
    +'<input id="subDatePicker" type="date" value="'+ds+'" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" onchange="_subSetDate(this.value)">'
    +'<input id="subTimePicker" type="time" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" onchange="_subSetTime(this.value)">'
    +'<style>'
    +'#subDateTimeBox{display:flex;align-items:stretch;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;height:44px;transition:border-color .2s,box-shadow .2s;background:var(--inp-bg);position:relative}'
    +'#subDateTimeBox:hover{border-color:#818cf8;box-shadow:0 0 0 3px rgba(129,140,248,.12)}'
    +'#subDateSide{display:flex;align-items:center;gap:6px;padding:0 8px 0 12px;cursor:text;transition:background .15s;flex:2;min-width:0;border-right:1px solid #e2e8f0}'
    +'#subTimeSide{display:flex;align-items:center;gap:6px;padding:0 10px;cursor:text;transition:background .15s;flex:1;min-width:120px}'
    +'#subDateSide:hover,#subTimeSide:hover{background:rgba(129,140,248,.07)}'
    +'#subChevronBtn{background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;flex-shrink:0;color:#8c93a8;transition:color .15s}'
    +'#subChevronBtn:hover{color:#3b5bdb}'
    +'#subTimeClear{opacity:0;pointer-events:none;cursor:pointer;color:#94a3b8;font-size:.72rem;line-height:1;flex-shrink:0;transition:opacity .15s}'
    +'#subDateTimeBox:hover #subTimeClear.has-val{opacity:1;pointer-events:auto}'
    +'</style>'
    +'<div id="subDateTimeBox" onmouseenter="_subBoxMouseEnter()" onmouseleave="_subBoxMouseLeave()">'
    +'<div id="subDateSide" onclick="document.getElementById(\'subDateInput\').focus()">'
    +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
    +'<input id="subDateInput" type="text" value="'+(ds?ds.replace(/-/g,'/'):'')+'" placeholder="YYYY/MM/DD" maxlength="10" style="border:none;outline:none;font-size:.88rem;font-weight:600;color:'+(ds?'var(--text)':'#b4c0d8')+';font-family:inherit;flex:1;min-width:0;background:transparent;cursor:text;margin-right:4px" oninput="_subDateInputChange(this.value)" onfocus="_subDateFocus(this)" onblur="_subDateBlur(this)">'
    +'<button type="button" id="subChevronBtn" onclick="_subOpenDatePicker()" title="\u6253\u5f00\u65e5\u5386"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>'
    +'</div>'
    +'<div id="subTimeSide" onclick="document.getElementById(\'subTimeInput\').focus()">'
    +'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    +'<input id="subTimeInput" type="text" placeholder="HH:MM" maxlength="5" style="border:none;outline:none;font-size:.88rem;color:#b4c0d8;font-family:inherit;flex:1;min-width:0;background:transparent;cursor:text" oninput="_subTimeInputAuto(this);_subTimeInputChange(this.value)" onfocus="_subTimeFocus(this)" onblur="_subTimeBlur(this)">'
    +'<span id="subTimeClear" onclick="event.stopPropagation();_subClearTime()" style="opacity:0;pointer-events:none;cursor:pointer;color:#94a3b8;font-size:.72rem;line-height:1;flex-shrink:0;transition:opacity .15s">\u2715</span>'
    +'</div>'
    +'</div>'
    +'<div id="subDaysInline" style="display:none;margin-top:6px;font-size:.78rem;font-weight:500;padding:3px 10px;border-radius:20px;transition:background .3s,color .3s;background:'+initHintBg+';color:'+initHintColor+'">'+initHint+'</div>'
    +'</div></div>'
    +'<div class="sub-divider"></div>'
        +'<div style="margin-top:16px;'+G+'">'+lbl('费用',true)
    +'<div style="display:flex;align-items:stretch;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#f8faff;transition:all 0.3s ease">'
    +'<span style="display:flex;align-items:center;padding:0 12px;font-size:.88rem;font-weight:600;color:#6366f1;background:#f8faff;border-right:1.5px solid #e2e8f0;flex-shrink:0;white-space:nowrap">\u00a5</span>'
    +'<input id="subCostIn" type="number" value="'+(s?s.cost:draftCost)+'" placeholder="0.00" step="0.01" min="0" style="flex:1;border:none;outline:none;padding:10px 14px;font-size:.9rem;color:var(--text);background:#f8faff;font-family:inherit;min-width:0" '+FE+'></div></div>'
    +'<div style="'+G+'">'+lbl('续期方式',false)
    +'<style>'
    +'#subRenMan,#subRenAut{position:relative;display:flex;align-items:center;gap:10px;padding:0 14px;height:52px;border-radius:10px;cursor:pointer;font-size:.88rem;font-family:inherit;font-weight:500;transition:background 150ms ease-in-out,border-color 150ms ease-in-out,color 150ms ease-in-out;overflow:hidden;text-align:left;}'
    +'#subRenMan .ren-icon,#subRenAut .ren-icon{font-size:1rem;transition:transform 150ms ease-in-out;flex-shrink:0}'
    +'#subRenMan:hover .ren-icon,#subRenAut:hover .ren-icon{transform:scale(1.15)}'
    +'#subRenMan.ren-on,#subRenAut.ren-on{border-left:4px solid #6366f1!important;background:#eef2ff!important;color:#4338ca!important;font-weight:600;border-color:#c7d2fe!important}'
    +'#subRenMan:not(.ren-on):hover,#subRenAut:not(.ren-on):hover{border-color:#818cf8!important;color:#6366f1!important}'
    +'.ren-check{width:16px;height:16px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;margin-left:auto;flex-shrink:0;font-size:.6rem;color:#fff;opacity:0;transform:scale(0);transition:opacity 150ms ease-in-out,transform 150ms ease-in-out}'
    +'.ren-on .ren-check{opacity:1;transform:scale(1)}'
    +'</style>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +'<button type="button" id="subRenMan" class="'+(renewal==='manual'?'ren-on':'')+'" onclick="_subSetRenewal(\'manual\')" style="border:1.5px solid '+(renewal==='manual'?'#c7d2fe':'#e2e8f0')+';background:'+(renewal==='manual'?'#eef2ff':'#f8faff')+';color:'+(renewal==='manual'?'#4338ca':'var(--text2)')+'">'
    +'<svg class="ren-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    +'<span>\u624b\u52a8\u7eed\u671f</span><span class="ren-check">\u2713</span></button>'
    +'<button type="button" id="subRenAut" class="'+(renewal==='auto'?'ren-on':'')+'" onclick="_subSetRenewal(\'auto\')" style="border:1.5px solid '+(renewal==='auto'?'#c7d2fe':'#e2e8f0')+';background:'+(renewal==='auto'?'#eef2ff':'#f8faff')+';color:'+(renewal==='auto'?'#4338ca':'var(--text2)')+'">'
    +'<svg class="ren-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>'
    +'<span>\u81ea\u52a8\u7eed\u671f</span><span class="ren-check">\u2713</span></button>'
    +'</div></div>'
    +'<div style="'+G+'">'+lbl('备注',false)
    +'<textarea id="subNoteIn" placeholder="\u6dfb\u52a0\u5907\u6ce8\uff0c\u5982\u8d26\u53f7\u3001\u63d0\u9192\u7b49\u2026" style="'+IS+';height:40px;resize:none;overflow-y:auto" '+FE+'>'+(s?esc(s.note||''):draftNote)+'</textarea></div>'
    +'<div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;padding-top:8px">'
    +'<button type="button" id="subCancelBtn" onclick="_subCancel()" style="padding:11px;border-radius:10px;border:1.5px solid #e2e8f0;background:transparent;color:var(--text2);font-size:.92rem;font-weight:500;cursor:pointer;transition:all 0.3s ease;font-family:inherit">\u53d6\u6d88</button>'
    +'<button type="button" id="subSaveBtn" onclick="_subSaveClick(event,'+(s?s.id:0)+')" style="padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#818cf8,#6366f1);color:#fff;font-size:.92rem;font-weight:700;cursor:pointer;transition:all 0.3s ease;font-family:inherit;box-shadow:0 4px 14px rgba(99,102,241,.35);letter-spacing:.3px;position:relative;overflow:hidden"><span class="btn-text">'+(s?'\u4fdd\u5b58\u4fee\u6539':'\u4fdd\u5b58')+'</span><span class="btn-spinner"></span></button>'
    +'</div></div>';

  document.getElementById('mBody').innerHTML=h;
  const mb=document.getElementById('mBody');
  mb.style.maxWidth='520px';mb.style.width='100%';mb.style.borderRadius='20px';
  mb.style.padding=window.innerWidth<=640?'18px 14px':'28px 30px';
  mb.style.textAlign='left';mb.style.boxSizing='border-box';
  document.getElementById('mBg').classList.add('show');
  setTimeout(()=>document.getElementById('subNameIn')&&document.getElementById('subNameIn').focus(),80);
}

function saveSub(id){
  const name=(document.getElementById('subNameIn').value||'').trim();
  const _dEl=document.getElementById('subDateIn');const expireDate=((_dEl?_dEl.value:'')||'').substring(0,10);
  const cost=parseFloat(document.getElementById('subCostIn').value)||0;
  const note=(document.getElementById('subNoteIn').value||'').trim();
  const customDaysEl=document.getElementById('subCustomDaysIn');
  const customDays=customDaysEl?parseInt(customDaysEl.value)||30:30;
  const renewal=window._subRenewalVal||'manual';
  if(!name||!expireDate){if(!name){var _ne=document.getElementById('subNameErr');var _ni=document.getElementById('subNameIn');if(_ne){_ne.style.display='block';_ne.style.animation='none';setTimeout(function(){_ne.style.animation='subNameShake .4s ease';},10);}if(_ni){_ni.scrollIntoView({behavior:'smooth',block:'center'});_ni.focus();}}return;}
  subscriptions=JSON.parse(localStorage.getItem('tuole_subs')||'[]');
  const entry={name,expireDate,expireTime:window._subTimeVal||'',cost,cycle:_subCycle,note,renewal,customDays:_subCycle==='custom'?customDays:undefined};
  if(!id){entry.id=Date.now();subscriptions.push(entry);}
  else{
    const idx=subscriptions.findIndex(x=>x.id===id);
    if(idx>=0) subscriptions[idx]=Object.assign({},subscriptions[idx],entry);
    else{entry.id=id;subscriptions.push(entry);}
  }
  localStorage.setItem('tuole_subs',JSON.stringify(subscriptions));
  _subClearDraft();
  clM();
  var mb=document.getElementById('mBody');
  if(mb){mb.style.maxWidth='';mb.style.width='';mb.style.borderRadius='';mb.style.padding='';mb.style.textAlign='';mb.style.boxSizing='';}
  rSubscriptions();
  toast('✅ 已保存');
}

function editSub(id){openSubModal(id);}

function delSub(id){
  if(confirm('\u786e\u5b9a\u5220\u9664\u6b64\u8ba2\u9605\uff1f')){
    subscriptions=JSON.parse(localStorage.getItem('tuole_subs')||'[]');
    subscriptions=subscriptions.filter(x=>x.id!==id);
    localStorage.setItem('tuole_subs',JSON.stringify(subscriptions));
    rSubscriptions();
    toast('\ud83d\uddd1\ufe0f \u5df2\u5220\u9664');
  }
}

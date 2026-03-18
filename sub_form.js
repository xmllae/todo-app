/* --- Subscription Form --- */

var _subDraft = null;

function _subSetCycle(v){
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

function _subClearDraft(){ _subDraft=null; }
function _subCalcDate(){
  var cd=new Date();
  var days=_subCycle==='month'?30:_subCycle==='quarter'?90:_subCycle==='year'?365:(_subCycle==='custom'?parseInt((document.getElementById('subCustomDaysIn')||{}).value)||30:30);
  cd.setDate(cd.getDate()+days);
  var p=function(n){return String(n).padStart(2,'0');};
  var el=document.getElementById('subDateIn');
  if(el) el.value=cd.getFullYear()+'-'+p(cd.getMonth()+1)+'-'+p(cd.getDate())+'T00:00';
  _subUpdateDaysLeft();
  var btn=document.getElementById('subCalcBtn');
  if(btn){
    var orig=btn.textContent;
    btn.textContent='✓ 已推算';
    btn.style.background='linear-gradient(135deg,#22c55e,#16a34a)';
    btn.style.color='#fff';
    btn.style.borderColor='transparent';
    setTimeout(function(){btn.textContent=orig;btn.style.background='transparent';btn.style.color='var(--acc)';btn.style.borderColor='var(--acc)';},1600);
  }
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

  const cycles=[['month','\u6708\u4ed8'],['quarter','\u5b63\u4ed8'],['year','\u5e74\u4ed8'],['custom','\u81ea\u5b9a\u4e49']];
  const IS='width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:.9rem;color:var(--text);background:#f8faff;outline:none;transition:all 0.3s ease;font-family:inherit;box-sizing:border-box'
  const FEon="this.style.borderColor='#818cf8';this.style.boxShadow='0 0 0 3px rgba(129,140,248,.15)'";
  const FEoff="this.style.borderColor='var(--inp-bd)';this.style.boxShadow='none'";
  const FE='onfocus="'+FEon+'" onblur="'+FEoff+'"';
  const lbl=(t,req)=>'<label style="display:flex;align-items:center;gap:5px;font-size:.76rem;font-weight:700;color:#334155;margin-bottom:7px;letter-spacing:.3px;text-transform:uppercase">'+t+(req?'<span style="color:#ef4444;margin-left:1px">*</span>':'')+'</label>';

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
  const cycleData=[['month','月付','📅','30天'],['quarter','季付','🌿','90天'],['year','年付','📆','365天'],['custom','自定义','⚙️','']];
  const cyBtns2=cycleData.map(function(row){
    var v=row[0],label=row[1],emoji=row[2],sub=row[3],on=(_subCycle===v);
    var base='flex:1;min-width:calc(50% - 4px);padding:10px 8px;border-radius:12px;cursor:pointer;border:1.5px solid '+(on?'#6366f1':'#e2e8f0')+';transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;overflow:hidden;background:'+(on?'linear-gradient(135deg,#818cf8,#6366f1)':'#f8faff')+';color:'+(on?'#fff':'var(--text2)')+';box-shadow:'+(on?'0 4px 12px rgba(99,102,241,.3)':'none')+';transform:'+(on?'translateY(-2px)':'translateY(0)');
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
+'<div style="'+G+'">'+lbl('📌 服务名称',true)
    +'<input id="subNameIn" type="text" value="'+(s?esc(s.name):draftName)+'" placeholder="\u8bf7\u8f93\u5165\u8ba2\u9605\u670d\u52a1\u540d\u79f0" style="'+IS+'" '+FE+' autocomplete="off" oninput="var e=document.getElementById(\'subNameErr\');if(e&&this.value.trim())e.style.display=\'none\';">'
    +'<div id="subNameErr" style="display:none;color:#ef4444;font-size:.78rem;font-weight:600;margin-top:5px">\u26a0\ufe0f \u8bf7\u586b\u5199\u670d\u52a1\u540d\u79f0</div>'
    +'</div>'
    +'<div style="'+G+'">'+lbl('🔄 订阅周期',true)
    +'<div style="display:flex;flex-wrap:wrap;gap:8px">'+cyBtns2+'</div>'
    +'<div id="subCustomDaysWrap" style="display:'+(showCustom?'flex':'none')+';align-items:center;gap:8px;margin-top:10px;padding:10px 14px;border:1.5px dashed #818cf8;border-radius:10px;background:#f5f3ff">'
    +'<input id="subCustomDaysIn" type="number" value="'+editCustomDays+'" placeholder="30" min="1" step="1" style="width:72px;border:1.5px solid #818cf8;border-radius:10px;padding:8px 10px;font-size:.9rem;color:#6366f1;font-weight:700;text-align:center;background:#ede9fe;outline:none;font-family:inherit;box-sizing:border-box" '+FE+' oninput="_subUpdateDateFromDays()">'
    +'<span style="font-size:.85rem;color:var(--text2)">\u5929</span>'
    +'<span id="subCustomDatePreview" style="font-size:.75rem;color:#6366f1;font-weight:600;margin-left:6px;white-space:nowrap">'+(function(){if(!showCustom||!editCustomDays)return '';var _d=new Date();_d.setDate(_d.getDate()+parseInt(editCustomDays));var _p=function(n){return String(n).padStart(2,'0');};return '到期 '+_d.getFullYear()+'/'+_p(_d.getMonth()+1)+'/'+_p(_d.getDate());})()+'</span></div>'
    +'</div>'
    // Expiry date - separate field
    +'<div style="'+G+'">'+lbl('📅 到期日期',true)

    +'<div style="display:flex;align-items:center;gap:8px">'
    +'<input id="subDateIn" type="datetime-local" value="'+ds+'T00:00" style="'+IS+'" '+FE+' oninput="_subUpdateDaysLeft()">'
    +'<button type="button" id="subCalcBtn" onclick="_subCalcDate()" style="white-space:nowrap;flex-shrink:0;padding:8px 12px;border-radius:8px;border:1.5px solid var(--acc);background:transparent;color:var(--acc);font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:background .2s,color .2s">\u63a8\u7b97\u5230\u671f</button>'
    +'</div>'
    +'<div id="subDaysInline" style="display:none;margin-top:6px;font-size:.78rem;font-weight:500;padding:3px 10px;border-radius:20px;transition:background .3s,color .3s;background:'+initHintBg+';color:'+initHintColor+'">'+initHint+'</div>'
    +'</div></div>'
        +'<div style="margin-top:16px;'+G+'">'+lbl('💰 费用',true)
    +'<div style="position:relative">'
    +'<span style="position:absolute;left:0;top:0;bottom:0;width:40px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#818cf8,#6366f1);border-radius:9px 0 0 9px;font-size:.88rem;font-weight:700;color:#fff;pointer-events:none">\u00a5</span>'
    +'<input id="subCostIn" type="number" value="'+(s?s.cost:draftCost)+'" placeholder="0.00" step="0.01" min="0" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px 10px 50px;font-size:.9rem;color:var(--text);background:#f8faff;outline:none;font-family:inherit;box-sizing:border-box;transition:all 0.3s ease" '+FE+'></div></div>'
    +'<div style="'+G+'">'+lbl('🔄 续期方式',false)
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +'<button type="button" id="subRenMan" onclick="window._subRenewalVal=\'manual\';var m=document.getElementById(\'subRenMan\'),a=document.getElementById(\'subRenAut\');m.style.background=\'linear-gradient(135deg,#818cf8,#6366f1)\';m.style.color=\'#fff\';m.style.borderColor=\'#6366f1\';a.style.background=\'#f8faff\';a.style.color=\'var(--text2)\';a.style.borderColor=\'#e2e8f0\';" style="padding:10px 8px;border-radius:10px;cursor:pointer;font-size:.85rem;border:1.5px solid '+(renewal==='manual'?'#6366f1':'#e2e8f0')+';transition:all 0.3s ease;font-family:inherit;font-weight:'+(renewal==='manual'?'700':'400')+';background:'+(renewal==='manual'?'linear-gradient(135deg,#818cf8,#6366f1)':'#f8faff')+';color:'+(renewal==='manual'?'#fff':'var(--text2)')+'">\u624b\u52a8\u7eed\u671f</button>'
    +'<button type="button" id="subRenAut" onclick="window._subRenewalVal=\'auto\';var m=document.getElementById(\'subRenMan\'),a=document.getElementById(\'subRenAut\');a.style.background=\'linear-gradient(135deg,#818cf8,#6366f1)\';a.style.color=\'#fff\';a.style.borderColor=\'#6366f1\';m.style.background=\'#f8faff\';m.style.color=\'var(--text2)\';m.style.borderColor=\'#e2e8f0\';" style="padding:10px 8px;border-radius:10px;cursor:pointer;font-size:.85rem;border:1.5px solid '+(renewal==='auto'?'#6366f1':'#e2e8f0')+';transition:all 0.3s ease;font-family:inherit;font-weight:'+(renewal==='auto'?'700':'400')+';background:'+(renewal==='auto'?'linear-gradient(135deg,#818cf8,#6366f1)':'#f8faff')+';color:'+(renewal==='auto'?'#fff':'var(--text2)')+'">\u81ea\u52a8\u7eed\u671f</button>'
    +'</div></div>'
    +'<div style="'+G+'">'+lbl('📝 备注',false)
    +'<textarea id="subNoteIn" placeholder="\u6dfb\u52a0\u5907\u6ce8\uff0c\u5982\u8d26\u53f7\u3001\u63d0\u9192\u7b49\u2026" style="'+IS+';height:40px;resize:none;overflow-y:auto" '+FE+'>'+(s?esc(s.note||''):draftNote)+'</textarea></div>'
    +'<div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;padding-top:8px">'
    +'<button type="button" id="subCancelBtn" onclick="clM()" style="padding:11px;border-radius:10px;border:1.5px solid #e2e8f0;background:transparent;color:var(--text2);font-size:.92rem;font-weight:500;cursor:pointer;transition:all 0.3s ease;font-family:inherit">\u53d6\u6d88</button>'
    +'<button type="button" id="subSaveBtn" onclick="(function(e){var r=document.createElement(\'span\');r.style=\'position:absolute;border-radius:50%;background:rgba(255,255,255,.6);transform:scale(0);animation:subRipple .6s linear;pointer-events:none;width:100px;height:100px;left:\'+((e.clientX-e.currentTarget.getBoundingClientRect().left-50))+\'px;top:\'+((e.clientY-e.currentTarget.getBoundingClientRect().top-50))+\'px\';e.currentTarget.appendChild(r);setTimeout(function(){r.remove();},700);saveSub('+(s?s.id:0)+');})(event)" style="padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#818cf8,#6366f1);color:#fff;font-size:.92rem;font-weight:700;cursor:pointer;transition:all 0.3s ease;font-family:inherit;box-shadow:0 4px 14px rgba(99,102,241,.35);letter-spacing:.3px;position:relative;overflow:hidden">'+(s?'\u4fdd\u5b58\u4fee\u6539':'\u4fdd\u5b58')+'</button>'
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
  const entry={name,expireDate,cost,cycle:_subCycle,note,renewal,customDays:_subCycle==='custom'?customDays:undefined};
  if(!id){entry.id=Date.now();subscriptions.push(entry);}
  else{
    const idx=subscriptions.findIndex(x=>x.id===id);
    if(idx>=0) subscriptions[idx]=Object.assign({},subscriptions[idx],entry);
    else{entry.id=id;subscriptions.push(entry);}
  }
  localStorage.setItem('tuole_subs',JSON.stringify(subscriptions));
  _subClearDraft();
  clM();
  const mb=document.getElementById('mBody');
  if(mb){mb.style.maxWidth='';mb.style.width='';mb.style.borderRadius='';mb.style.padding='';mb.style.textAlign='';mb.style.boxSizing='';}
  rSubscriptions();
  toast('\u2705 \u5df2\u4fdd\u5b58');
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

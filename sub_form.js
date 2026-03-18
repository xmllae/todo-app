/* --- Subscription Form --- */

var _subDraft = null;

function _subSetCycle(v){
  _subCycle=v;
  document.querySelectorAll('.sub-cycle-btn').forEach(b=>{
    const on=b.dataset.v===v;
    b.style.background=on?'var(--acc)':'transparent';
    b.style.color=on?'#fff':'var(--text2)';
    b.style.fontWeight=on?'600':'400';
    b.style.boxShadow=on?'0 2px 8px rgba(79,70,229,.25)':'none';
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
  // For non-custom: auto-set expiry date
  if(!isCustom){
    const dateEl=document.getElementById('subDateIn');
    if(dateEl){
      const d=new Date();
      const days=v==='month'?30:v==='quarter'?90:v==='year'?365:30;
      d.setDate(d.getDate()+days);
      const pad=n=>String(n).padStart(2,'0');
      dateEl.value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
      _subUpdateDaysLeft();
    }
  }
}

function _subUpdateDaysLeft(){
  const dateEl=document.getElementById('subDateIn');
  const inlineHint=document.getElementById('subDaysInline');
  if(!dateEl) return;
  const val=dateEl.value;
  if(!val){if(inlineHint)inlineHint.textContent='';return;}
  const e=new Date(val),t=new Date();
  t.setHours(0,0,0,0);e.setHours(0,0,0,0);
  const days=Math.ceil((e-t)/864e5);
  if(inlineHint){
    if(days>0) inlineHint.textContent='\u8fd8\u5269 '+days+' \u5929';
    else if(days===0) inlineHint.textContent='\u4eca\u5929\u5230\u671f';
    else inlineHint.textContent='\u5df2\u8fc7\u671f '+Math.abs(days)+' \u5929';
    inlineHint.style.color=days<=7?'#ef4444':days<=30?'#ea580c':'#94a3b8';
  }
}

function _subUpdateDateFromDays(){
  const daysInEl=document.getElementById('subCustomDaysIn');
  const dateEl=document.getElementById('subDateIn');
  const preview=document.getElementById('subCustomDatePreview');
  if(!daysInEl) return;
  const days=parseInt(daysInEl.value)||0;
  if(days<=0){if(preview)preview.textContent='';return;}
  const d=new Date();
  d.setDate(d.getDate()+days);
  const pad=n=>String(n).padStart(2,'0');
  if(dateEl) dateEl.value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  if(preview) preview.textContent='\u5230\u671f '+d.getFullYear()+'/'+pad(d.getMonth()+1)+'/'+pad(d.getDate());
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
function openSubModal(id){
  const s=id?subscriptions.find(x=>x.id===id):null;
  const draft=(!s&&_subDraft)?_subDraft:null;
  if(s) _subClearDraft();
  _subCycle=s?s.cycle:(draft?draft.cycle:'month');
  window._subRenewalVal=s?(s.renewal||'manual'):(draft?(draft.renewal||'manual'):'manual');

  const pad=n=>String(n).padStart(2,'0');
  const defaultDays=_subCycle==='quarter'?90:_subCycle==='year'?365:30;
  const dd=new Date();dd.setDate(dd.getDate()+defaultDays);
  const defaultDate=dd.getFullYear()+'-'+pad(dd.getMonth()+1)+'-'+pad(dd.getDate());
  const ds=s?s.expireDate:(draft&&draft.expireDate?draft.expireDate:defaultDate);

  const cycles=[['month','\u6708\u4ed8'],['quarter','\u5b63\u4ed8'],['year','\u5e74\u4ed8'],['custom','\u81ea\u5b9a\u4e49']];
  const IS='width:100%;border:1.5px solid var(--inp-bd);border-radius:10px;padding:10px 14px;font-size:.9rem;color:var(--text);background:var(--inp-bg);outline:none;transition:border-color .25s,box-shadow .25s;font-family:inherit;box-sizing:border-box';
  const FEon="this.style.borderColor='#818cf8';this.style.boxShadow='0 0 0 3px rgba(129,140,248,.15)'";
  const FEoff="this.style.borderColor='var(--inp-bd)';this.style.boxShadow='none'";
  const FE='onfocus="'+FEon+'" onblur="'+FEoff+'"';
  const lbl=(t,req)=>'<label style="display:flex;align-items:center;gap:6px;font-size:.78rem;font-weight:600;color:var(--text2);margin-bottom:7px;letter-spacing:.3px;text-transform:uppercase">'+t+(req?'<span style="color:#ef4444;margin-left:2px">*</span>':'')+'</label>';

  // Compute inline hint for initial date
  let initHint='',initHintColor='#94a3b8';
  let initCustomDays=30;
  if(ds){
    const e=new Date(ds),t2=new Date();
    t2.setHours(0,0,0,0);e.setHours(0,0,0,0);
    const days=Math.ceil((e-t2)/864e5);
    initCustomDays=days>0?days:30;
    if(days>0){initHint='\u8fd8\u5269 '+days+' \u5929';initHintColor=days<=7?'#ef4444':days<=30?'#ea580c':'#94a3b8';}
    else if(days===0){initHint='\u4eca\u5929\u5230\u671f';initHintColor='#ef4444';}
    else{initHint='\u5df2\u8fc7\u671f '+Math.abs(days)+' \u5929';initHintColor='#ef4444';}
  }

  const cyBtns=cycles.map(([v,l])=>{
    const on=_subCycle===v;
    return '<button type="button" class="sub-cycle-btn" data-v="'+v+'" onclick="_subSetCycle(\''+v+'\')">'
      // inline style via attribute
      .replace('<button','<button style="flex:1;padding:9px 4px;border-radius:8px;cursor:pointer;font-size:.84rem;border:none;transition:all .2s;'
        +'font-weight:'+(on?'600':'400')+';background:'+(on?'var(--acc)':'transparent')+';>'
        +'color:'+(on?'#fff':'var(--text2)')+';box-shadow:'+(on?'0 2px 8px rgba(79,70,229,.25)':'none')+'"')
      +l+'</button>';
  }).join('');

  const draftName=draft?esc(draft.name):'';
  const draftCost=draft?draft.cost:'';
  const draftNote=draft?esc(draft.note||''):'';
  const draftCustomDays=draft&&draft.customDays?draft.customDays:initCustomDays;
  const showCustom=_subCycle==='custom';
  const editCustomDays=s&&s.customDays?s.customDays:draftCustomDays;
  const renewal=window._subRenewalVal||'manual';
  const G='margin-bottom:16px';
  const cyBtns2=cycles.map(([v,l])=>{
    const on=_subCycle===v;
    return '<button type="button" class="sub-cycle-btn" data-v="'+v+'" onclick="_subSetCycle(\''+v+'\')" style="flex:1;padding:9px 4px;border-radius:8px;cursor:pointer;font-size:.84rem;border:none;transition:all .2s;font-weight:'+(on?'600':'400')+';background:'+(on?'var(--acc)':'transparent')+';color:'+(on?'#fff':'var(--text2)')+';box-shadow:'+(on?'0 2px 8px rgba(79,70,229,.25)':'none')+'">'+l+'</button>';
  }).join('');

  const h=
    '<style>#subNoteIn::-webkit-scrollbar{display:none}#subNoteIn{scrollbar-width:none}#subCostIn::-webkit-inner-spin-button,#subCostIn::-webkit-outer-spin-button{display:none}#subCostIn{-moz-appearance:textfield}#subCustomDaysIn::-webkit-inner-spin-button,#subCustomDaysIn::-webkit-outer-spin-button{display:none}#subCustomDaysIn{-moz-appearance:textfield}</style>'
    +'<div id="subForm">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1.5px solid var(--task-bd)">'
    +'<div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--acc-bg),var(--acc-bd));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;box-shadow:0 2px 8px rgba(79,70,229,.12)">'
    +(s?'\u270f\ufe0f':'\ud83d\udce6')
    +'</div><div>'
    +'<div style="font-size:.95rem;font-weight:700;color:var(--text);letter-spacing:-.3px">'+(s?'\u7f16\u8f91\u8ba2\u9605':'\u6dfb\u52a0\u8ba2\u9605')+'</div>'
    +'<div style="font-size:.75rem;color:var(--text3);margin-top:1px">'+(s?'\u4fee\u6539\u8ba2\u9605\u4fe1\u606f':'\u8bb0\u5f55\u4e00\u4e2a\u65b0\u7684\u8ba2\u9605\u670d\u52a1')+'</div>'
    +'</div></div>'
    +'<div style="'+G+'">'+lbl('\u670d\u52a1\u540d\u79f0',true)
    +'<input id="subNameIn" type="text" value="'+(s?esc(s.name):draftName)+'" style="'+IS+'" '+FE+' autocomplete="off"></div>'
    +'<div style="'+G+'">'+lbl('\u8ba2\u9605\u5468\u671f',true)
    +'<div style="display:flex;gap:4px;background:var(--hov);padding:4px;border-radius:10px">'+cyBtns2+'</div>'
    +'<div id="subCustomDaysWrap" style="display:'+(showCustom?'flex':'none')+';align-items:center;gap:8px;margin-top:8px">'
    +'<input id="subCustomDaysIn" type="number" value="'+editCustomDays+'" placeholder="30" min="1" step="1" style="width:80px;border:1.5px solid var(--inp-bd);border-radius:10px;padding:8px 12px;font-size:.9rem;color:var(--text);background:var(--inp-bg);outline:none;font-family:inherit;box-sizing:border-box" '+FE+' oninput="_subUpdateDateFromDays()">'
    +'<span style="font-size:.85rem;color:var(--text2)">\u5929</span>'
    +'<span id="subCustomDatePreview" style="font-size:.75rem;color:#999;margin-left:6px;white-space:nowrap">'+(function(){if(!showCustom||!editCustomDays)return '';var _d=new Date();_d.setDate(_d.getDate()+parseInt(editCustomDays));var _p=function(n){return String(n).padStart(2,'0');};return '到期 '+_d.getFullYear()+'/'+_p(_d.getMonth()+1)+'/'+_p(_d.getDate());})()+'</span></div>'
    +'<div id="subDateRow" style="margin-top:8px;display:'+(showCustom?'none':'block')+'"><div style="position:relative">'
    +'<input id="subDateIn" type="date" value="'+ds+'" style="'+IS+';padding-right:110px" '+FE+' oninput="_subUpdateDaysLeft()">'
    +'<span id="subDaysInline" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:.75rem;color:'+initHintColor+';pointer-events:none;white-space:nowrap">'+initHint+'</span>'
    +'</div></div>'
        +'<div style="margin-top:16px;'+G+'">'+lbl('\u8d39\u7528',true)
    +'<div style="display:flex;align-items:center;border:1.5px solid var(--inp-bd);border-radius:10px;overflow:hidden;background:var(--inp-bg)">' // ✅ done
    +'<span style="padding:0 8px 0 14px;font-size:.9rem;font-weight:600;color:var(--text3);flex-shrink:0">\u00a5</span>'
    +'<input id="subCostIn" type="number" value="'+(s?s.cost:draftCost)+'" placeholder="0.00" step="0.01" min="0" style="flex:1;border:none;outline:none;padding:10px 14px 10px 0;font-size:.9rem;color:var(--text);background:transparent;font-family:inherit;box-sizing:border-box" '+FE+'></div></div>'
    +'<div style="'+G+'">'+lbl('\u7eed\u671f\u65b9\u5f0f',false)
    +'<div style="display:flex;gap:4px;background:var(--hov);padding:4px;border-radius:10px">'
    +'<button type="button" id="subRenMan" onclick="window._subRenewalVal=\'manual\';var m=document.getElementById(\'subRenMan\'),a=document.getElementById(\'subRenAut\');m.style.background=\'var(--acc)\';m.style.color=\'#fff\';m.style.fontWeight=\'600\';m.style.boxShadow=\'0 2px 8px rgba(79,70,229,.25)\';a.style.background=\'transparent\';a.style.color=\'var(--text2)\';a.style.fontWeight=\'400\';a.style.boxShadow=\'none\'" style="flex:1;padding:9px 4px;border-radius:8px;cursor:pointer;font-size:.84rem;border:none;transition:all .2s;font-weight:'+(renewal==='manual'?'600':'400')+';background:'+(renewal==='manual'?'var(--acc)':'transparent')+';color:'+(renewal==='manual'?'#fff':'var(--text2)')+';box-shadow:'+(renewal==='manual'?'0 2px 8px rgba(79,70,229,.25)':'none')+'">\u624b\u52a8\u7eed\u671f</button>'
    +'<button type="button" id="subRenAut" onclick="window._subRenewalVal=\'auto\';var m=document.getElementById(\'subRenMan\'),a=document.getElementById(\'subRenAut\');a.style.background=\'var(--acc)\';a.style.color=\'#fff\';a.style.fontWeight=\'600\';a.style.boxShadow=\'0 2px 8px rgba(79,70,229,.25)\';m.style.background=\'transparent\';m.style.color=\'var(--text2)\';m.style.fontWeight=\'400\';m.style.boxShadow=\'none\'" style="flex:1;padding:9px 4px;border-radius:8px;cursor:pointer;font-size:.84rem;border:none;transition:all .2s;font-weight:'+(renewal==='auto'?'600':'400')+';background:'+(renewal==='auto'?'var(--acc)':'transparent')+';color:'+(renewal==='auto'?'#fff':'var(--text2)')+';box-shadow:'+(renewal==='auto'?'0 2px 8px rgba(79,70,229,.25)':'none')+'">\u81ea\u52a8\u7eed\u671f</button>'
    +'</div></div>'
    +'<div style="'+G+'">'+lbl('\u5907\u6ce8',false)
    +'<textarea id="subNoteIn" placeholder="\u6dfb\u52a0\u5907\u6ce8\uff0c\u5982\u8d26\u53f7\u3001\u63d0\u9192\u7b49\u2026" style="'+IS+';height:40px;resize:none;overflow-y:auto" '+FE+'>'+(s?esc(s.note||''):draftNote)+'</textarea></div>'
    +'<div style="display:flex;gap:10px;padding-top:6px">'
    +'<button type="button" onclick="clM()" style="flex:1;padding:11px;border-radius:10px;border:1.5px solid var(--inp-bd);background:transparent;color:var(--text2);font-size:.92rem;font-weight:500;cursor:pointer;transition:all .2s;font-family:inherit" onmouseover="this.style.borderColor=\'var(--text3)\';this.style.color=\'var(--text)\'" onmouseout="this.style.borderColor=\'var(--inp-bd)\';this.style.color=\'var(--text2)\'">\u53d6\u6d88</button>'
    +'<button type="button" onclick="saveSub('+(s?s.id:0)+')" style="flex:1;padding:11px;border-radius:10px;border:none;background:var(--acc);color:#fff;font-size:.92rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;box-shadow:0 4px 14px rgba(79,70,229,.3);letter-spacing:.3px" onmouseover="this.style.background=\'#4338ca\';this.style.boxShadow=\'0 6px 18px rgba(79,70,229,.4)\'" onmouseout="this.style.background=\'var(--acc)\';this.style.boxShadow=\'0 4px 14px rgba(79,70,229,.3)\'">'+(s?'\u4fdd\u5b58\u4fee\u6539':'\u4fdd\u5b58')+'</button>'
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
  const _dEl=document.getElementById('subDateIn');const expireDate=(_dEl?_dEl.value:'')||'';
  const cost=parseFloat(document.getElementById('subCostIn').value)||0;
  const note=(document.getElementById('subNoteIn').value||'').trim();
  const customDaysEl=document.getElementById('subCustomDaysIn');
  const customDays=customDaysEl?parseInt(customDaysEl.value)||30:30;
  const renewal=window._subRenewalVal||'manual';
  if(!name||!expireDate){toast('\u26a0\ufe0f \u8bf7\u586b\u5199\u540d\u79f0\u548c\u5230\u671f\u65e5\u671f');return;}
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

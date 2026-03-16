/* ─── Subscription Form – Linear/Raycast style ─── */

function _subSetCycle(v){
  _subCycle=v;
  document.querySelectorAll('.sub-cycle-btn').forEach(b=>{
    const on=b.dataset.v===v;
    b.style.background=on?'var(--acc)':'transparent';
    b.style.color=on?'#fff':'var(--text2)';
    b.style.fontWeight=on?'600':'400';
    b.style.boxShadow=on?'0 2px 8px rgba(79,70,229,.25)':'none';
  });
}

function openSubModal(id){
  const s=id?subscriptions.find(x=>x.id===id):null;
  _subCycle=s?s.cycle:'month';

  const dd=new Date();dd.setDate(dd.getDate()+30);
  const pad=n=>String(n).padStart(2,'0');
  const ds=s?s.expireDate:`${dd.getFullYear()}-${pad(dd.getMonth()+1)}-${pad(dd.getDate())}`;

  const cycles=[['month','月付'],['quarter','季付'],['year','年付'],['once','一次性']];

  const IS=[
    'width:100%',
    'border:1.5px solid var(--inp-bd)',
    'border-radius:10px',
    'padding:10px 14px 10px 38px',
    'font-size:.9rem',
    'color:var(--text)',
    'background:var(--inp-bg)',
    'outline:none',
    'transition:border-color .25s,box-shadow .25s',
    'font-family:inherit',
    'box-sizing:border-box',
  ].join(';');

  const IS_BARE=[
    'width:100%',
    'border:1.5px solid var(--inp-bd)',
    'border-radius:10px',
    'padding:10px 14px 10px 38px',
    'font-size:.9rem',
    'color:var(--text)',
    'background:var(--inp-bg)',
    'outline:none',
    'transition:border-color .25s,box-shadow .25s',
    'font-family:inherit',
    'box-sizing:border-box',
  ].join(';');

  const FE=[
    'onfocus="this.style.borderColor=\'#818cf8\';this.style.boxShadow=\'0 0 0 3px rgba(129,140,248,.15)\'"',
    'onblur="this.style.borderColor=\'var(--inp-bd)\';this.style.boxShadow=\'none\'"',
  ].join(' ');

  const lbl=(em,t,req='')=>`
    <label style="display:flex;align-items:center;gap:6px;font-size:.78rem;font-weight:600;color:var(--text2);margin-bottom:7px;letter-spacing:.3px;text-transform:uppercase">
      <span style="font-size:.95rem">${em}</span>${t}${req?'<span style="color:#ef4444;margin-left:2px">*</span>':''}
    </label>`;

  const cyBtns=cycles.map(([v,l])=>{
    const on=_subCycle===v;
    return `<button type="button" class="sub-cycle-btn" data-v="${v}" onclick="_subSetCycle('${v}')"
      style="flex:1;padding:9px 4px;border-radius:8px;cursor:pointer;font-size:.84rem;
             font-weight:${on?'600':'400'};
             background:${on?'var(--acc)':'transparent'};
             color:${on?'#fff':'var(--text2)'};
             border:none;
             box-shadow:${on?'0 2px 8px rgba(79,70,229,.25)':'none'};
             transition:all .2s">${l}</button>`;
  }).join('');

  const G='margin-bottom:18px';

  const h=`
  <style>
    #subForm .sf-field-wrap{position:relative}
    #subForm .sf-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:1rem;pointer-events:none;line-height:1}
    #subForm .sf-icon-ta{position:absolute;left:12px;top:12px;font-size:1rem;pointer-events:none;line-height:1}
  </style>
  <div id="subForm">

  <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;padding-bottom:20px;border-bottom:1.5px solid var(--task-bd)">
    <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--acc-bg),var(--acc-bd));
                display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;
                box-shadow:0 4px 12px rgba(79,70,229,.15)">
      ${s?'✏️':'✨'}
    </div>
    <div>
      <div style="font-size:1.05rem;font-weight:700;color:var(--text);letter-spacing:-.3px">${s?'编辑订阅':'添加订阅'}</div>
      <div style="font-size:.8rem;color:var(--text3);margin-top:2px">${s?'修改订阅信息':'记录一个新的订阅服务'}</div>
    </div>
  </div>

  <div style="${G}">
    ${lbl('🏷️','服务名称',true)}
    <div class="sf-field-wrap">
      <span class="sf-icon">🏷️</span>
      <input id="subNameIn" type="text" value="${s?esc(s.name):''}" placeholder="如：Netflix、Spotify、iCloud…"
        style="${IS}" ${FE} autocomplete="off">
    </div>
  </div>

  <div style="${G}">
    ${lbl('📅','到期日期',true)}
    <div class="sf-field-wrap">
      <span class="sf-icon">📅</span>
      <input id="subDateIn" type="date" value="${ds}"
        style="${IS}" ${FE}>
    </div>
  </div>

  <div style="${G}">
    ${lbl('💰','费用',true)}
    <div class="sf-field-wrap">
      <span class="sf-icon" style="font-size:.85rem;font-weight:600;color:var(--text3)">¥</span>
      <input id="subCostIn" type="number" value="${s?s.cost:''}" placeholder="0.00" step="0.01" min="0"
        style="${IS}" ${FE}>
    </div>
  </div>

  <div style="${G}">
    ${lbl('🔄','订阅周期',true)}
    <div style="display:flex;gap:4px;background:var(--hov);padding:4px;border-radius:10px">
      ${cyBtns}
    </div>
  </div>

  <div style="${G}">
    ${lbl('📝','备注','')}
    <div class="sf-field-wrap">
      <span class="sf-icon-ta">📝</span>
      <textarea id="subNoteIn"
        placeholder="添加备注，如账号、提醒等…"
        style="${IS_BARE};height:80px;resize:none"
        ${FE}>${s?esc(s.note||''):''}</textarea>
    </div>
  </div>

  <div style="display:flex;gap:10px;padding-top:6px">
    <button type="button" onclick="clM()"
      style="flex:1;padding:11px;border-radius:10px;border:1.5px solid var(--inp-bd);
             background:transparent;color:var(--text2);font-size:.92rem;font-weight:500;
             cursor:pointer;transition:all .2s;font-family:inherit"
      onmouseover="this.style.borderColor='var(--text3)';this.style.color='var(--text)'"
      onmouseout="this.style.borderColor='var(--inp-bd)';this.style.color='var(--text2)'">
      取消
    </button>
    <button type="button" onclick="saveSub(${s?s.id:0})"
      style="flex:1;padding:11px;border-radius:10px;border:none;
             background:var(--acc);color:#fff;font-size:.92rem;font-weight:600;
             cursor:pointer;transition:all .2s;font-family:inherit;
             box-shadow:0 4px 14px rgba(79,70,229,.3);letter-spacing:.3px"
      onmouseover="this.style.background='#4338ca';this.style.boxShadow='0 6px 18px rgba(79,70,229,.4)'"
      onmouseout="this.style.background='var(--acc)';this.style.boxShadow='0 4px 14px rgba(79,70,229,.3)'">
      ${s?'保存修改':'保存'}
    </button>
  </div>

  </div>`;

  document.getElementById('mBody').innerHTML=h;
  const mb=document.getElementById('mBody');
  mb.style.maxWidth='520px';
  mb.style.width='100%';
  mb.style.borderRadius='20px';
  mb.style.padding=window.innerWidth<=640?'18px 14px':'28px 30px';
  mb.style.textAlign='left';
  mb.style.boxSizing='border-box';

  document.getElementById('mBg').classList.add('show');
  setTimeout(()=>document.getElementById('subNameIn')&&document.getElementById('subNameIn').focus(),80);
}

function saveSub(id){
  const name=(document.getElementById('subNameIn').value||'').trim();
  const expireDate=(document.getElementById('subDateIn').value||'').trim();
  const cost=parseFloat(document.getElementById('subCostIn').value)||0;
  const note=(document.getElementById('subNoteIn').value||'').trim();
  if(!name||!expireDate){
    toast('⚠️ 请填写服务名称和到期日期');
    return;
  }
  subscriptions=JSON.parse(localStorage.getItem('tuole_subs')||'[]');
  const entry={name,expireDate,cost,cycle:_subCycle,note};
  if(!id){
    entry.id=Date.now();
    subscriptions.push(entry);
  }else{
    const idx=subscriptions.findIndex(x=>x.id===id);
    if(idx>=0){
      subscriptions[idx]=Object.assign({},subscriptions[idx],entry);
    }else{
      entry.id=id;
      subscriptions.push(entry);
    }
  }
  localStorage.setItem('tuole_subs',JSON.stringify(subscriptions));
  clM();
  const mb=document.getElementById('mBody');
  if(mb){mb.style.maxWidth='';mb.style.width='';mb.style.borderRadius='';mb.style.padding='';mb.style.textAlign='';mb.style.boxSizing='';}
  rSubscriptions();
  toast('✅ 已保存');
}

function editSub(id){openSubModal(id);}

function delSub(id){
  if(confirm('确定删除此订阅？')){
    subscriptions=JSON.parse(localStorage.getItem('tuole_subs')||'[]');
    subscriptions=subscriptions.filter(x=>x.id!==id);
    localStorage.setItem('tuole_subs',JSON.stringify(subscriptions));
    rSubscriptions();
    toast('🗑️ 已删除');
  }
}

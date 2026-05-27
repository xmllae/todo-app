// 订阅页状态与样式
let subscriptions = [];
let _subCycle = "month";
var _subSearch = "";
var _subSort = "days";
var _subBannerDismissed = false;
var _subMonthFilter = false;
var _subTabFilter = "all";
var _subLabelFilter = "all";
var _subPage = 1;
var _subPageSize = 10;
var _subSelected = new Set();
var _subCategorySnapshot = [];

(function () {
  if (document.getElementById("subPageStyle")) return;
  var st = document.createElement("style");
  st.id = "subPageStyle";
  st.textContent = `
#subscriptionsMode{
  --sub-font-body: "HarmonyOS Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei UI", sans-serif;
  --sub-font-head: "Source Han Sans SC", "PingFang SC", "Microsoft YaHei UI", sans-serif;
  --sub-bg-0:#f7f8ff;
  --sub-bg-1:#eef2ff;
  --sub-panel:#ffffff;
  --sub-panel-soft:#f9fbff;
  --sub-line:#e8edf7;
  --sub-line-strong:#dbe3f3;
  --sub-text:#1f2a44;
  --sub-text-2:#5b6889;
  --sub-text-3:#97a3c0;
  --sub-accent:#5960ff;
  --sub-accent-soft:#eef1ff;
  --sub-shadow:0 10px 18px -16px rgba(15,23,42,.24),0 1px 3px rgba(15,23,42,.05);
  --sub-success:#17a46d;
  --sub-warn:#f97316;
  --sub-danger:#ef4444;
  --sub-info:#4f7bff;
  display:flex;
  flex-direction:column;
  min-height:0;
  height:100%;
  flex:1;
  font-family:var(--sub-font-body);
  width:100%;
}

.dark #subscriptionsMode{
  --sub-bg-0:#101a2f;
  --sub-bg-1:#18243c;
  --sub-panel:#122036;
  --sub-panel-soft:#15263e;
  --sub-line:rgba(148,170,210,.2);
  --sub-line-strong:rgba(148,170,210,.28);
  --sub-text:#f0f4ff;
  --sub-text-2:#b6c2dd;
  --sub-text-3:#7f8daa;
  --sub-accent:#8f9dff;
  --sub-accent-soft:rgba(143,157,255,.18);
  --sub-shadow:0 10px 20px -16px rgba(0,0,0,.52),0 1px 3px rgba(0,0,0,.3);
  --sub-success:#34d399;
  --sub-warn:#fb923c;
  --sub-danger:#fb7185;
  --sub-info:#93c5fd;
}

#subscriptionsMode .sub-premium-page{
  position:relative;
  display:grid;
  grid-template-columns:240px minmax(0,1fr);
  gap:14px;
  flex:1;
  min-height:0;
  height:100%;
  align-items:stretch;
  width:100%;
  background:transparent;
  border-radius:0;
  isolation:isolate;
}

#subscriptionsMode .sub-premium-page::before{
  content:none;
}

.dark #subscriptionsMode .sub-premium-page::before{
  content:none;
}

#subscriptionsMode .sub-premium-page > *{
  position:relative;
  z-index:1;
}

#subscriptionsMode .sub-side-nav{
  display:flex;
  flex-direction:column;
  gap:14px;
  min-height:0;
  height:100%;
  background:var(--sub-panel);
  border:1px solid var(--sub-line);
  border-radius:18px;
  box-shadow:none;
  padding:14px 12px;
  backdrop-filter:none;
}

#subscriptionsMode .sub-side-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:4px 6px 10px;
  border-bottom:1px solid var(--sub-line);
}

#subscriptionsMode .sub-side-head strong{
  color:var(--sub-text);
  font-size:1rem;
  font-weight:700;
  letter-spacing:.01em;
}

#subscriptionsMode .sub-side-head span{
  color:var(--sub-text-3);
  font-size:.78rem;
}

#subscriptionsMode .sub-side-sec{
  display:flex;
  flex-direction:column;
  gap:6px;
}

#subscriptionsMode .sub-side-title{
  padding:4px 8px;
  color:var(--sub-text-3);
  font-size:.72rem;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
}

#subscriptionsMode .sub-side-item,
#subscriptionsMode .sub-cat-item,
#subscriptionsMode .sub-tool-item{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  border:none;
  border-radius:11px;
  padding:9px 10px;
  background:transparent;
  color:var(--sub-text-2);
  font-family:inherit;
  font-size:.87rem;
  font-weight:600;
  cursor:pointer;
  transition:all .2s ease;
}

#subscriptionsMode .sub-side-item span,
#subscriptionsMode .sub-cat-item span,
#subscriptionsMode .sub-tool-item span{
  display:inline-flex;
  align-items:center;
  gap:8px;
  min-width:0;
}

#subscriptionsMode .sub-side-item i,
#subscriptionsMode .sub-cat-item i,
#subscriptionsMode .sub-tool-item i{
  font-size:1rem;
  color:var(--sub-text-3);
  transition:inherit;
}

#subscriptionsMode .sub-side-item:hover,
#subscriptionsMode .sub-cat-item:hover,
#subscriptionsMode .sub-tool-item:hover{
  background:color-mix(in srgb,var(--sub-accent) 9%, transparent);
  color:var(--sub-text);
}

#subscriptionsMode .sub-side-item:hover i,
#subscriptionsMode .sub-cat-item:hover i,
#subscriptionsMode .sub-tool-item:hover i{
  color:var(--sub-accent);
}

#subscriptionsMode .sub-side-item.is-active,
#subscriptionsMode .sub-cat-item.is-active{
  background:var(--sub-accent-soft);
  color:var(--sub-accent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sub-accent) 30%, transparent);
}

#subscriptionsMode .sub-side-item.is-active i,
#subscriptionsMode .sub-cat-item.is-active i{
  color:var(--sub-accent);
}

#subscriptionsMode .sub-side-count,
#subscriptionsMode .sub-cat-count{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:24px;
  height:22px;
  padding:0 7px;
  border-radius:999px;
  background:color-mix(in srgb,var(--sub-accent) 14%, transparent);
  color:var(--sub-accent);
  font-size:.72rem;
  font-weight:700;
  line-height:1;
  flex-shrink:0;
}

#subscriptionsMode .sub-side-empty{
  border:1px dashed var(--sub-line-strong);
  border-radius:10px;
  padding:10px 12px;
  color:var(--sub-text-3);
  font-size:.8rem;
}

#subscriptionsMode .sub-main-panel{
  min-height:0;
  height:100%;
  background:var(--sub-panel);
  border:1px solid var(--sub-line);
  border-radius:20px;
  box-shadow:none;
  padding:20px;
  display:flex;
  flex-direction:column;
}

#subscriptionsMode #subList{
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
}

#subscriptionsMode .sub-page-header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:14px;
  margin-bottom:14px;
}

#subscriptionsMode .sub-page-title{
  margin:0;
  color:var(--sub-text);
  font-family:var(--sub-font-head);
  font-size:2rem;
  font-weight:700;
  letter-spacing:.01em;
}

#subscriptionsMode .sub-page-desc{
  margin:6px 0 0;
  color:var(--sub-text-2);
  font-size:.92rem;
  font-weight:500;
}

#subscriptionsMode .sub-add-btn{
  border:none;
  border-radius:12px;
  background:linear-gradient(132deg,var(--sub-accent),color-mix(in srgb,var(--sub-accent) 65%, #7a8dff));
  color:#fff;
  font-family:inherit;
  font-size:.88rem;
  font-weight:700;
  height:42px;
  padding:0 16px;
  display:inline-flex;
  align-items:center;
  gap:7px;
  cursor:pointer;
  white-space:nowrap;
  box-shadow:0 12px 28px color-mix(in srgb,var(--sub-accent) 35%, transparent);
  transition:transform .2s ease, filter .2s ease;
}

#subscriptionsMode .sub-add-btn:hover{
  transform:translateY(-1px);
  filter:brightness(1.04);
}

#subscriptionsMode #subStats{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:11px;
  margin-bottom:12px;
}

#subscriptionsMode .sub-stat-card{
  border:1px solid var(--sub-line);
  background:#fefdfd;
  border-radius:13px;
  padding:8px 11px;
  display:flex;
  flex-direction:column;
  gap:4px;
  box-sizing:border-box;
  min-height:84px;
  height:84px;
  max-height:84px;
  overflow:hidden;
  transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
}

#subscriptionsMode .sub-stat-card:hover{
  transform:translateY(-1px);
  border-color:var(--sub-line-strong);
  box-shadow:0 12px 26px rgba(29,44,89,.08);
}

#subscriptionsMode .sub-stat-card.is-clickable{
  cursor:pointer;
}

#subscriptionsMode .sub-stat-card.is-active{
  border-color:color-mix(in srgb,var(--sub-accent) 36%, var(--sub-line));
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sub-accent) 18%, transparent);
}

#subscriptionsMode .sub-stat-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:7px;
}

#subscriptionsMode .sub-stat-label{
  color:var(--sub-text-2);
  font-size:.68rem;
  font-weight:680;
  letter-spacing:.01em;
  line-height:1.2;
}

#subscriptionsMode .sub-stat-icon{
  width:32px;
  height:32px;
  border-radius:10px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  color:var(--sub-accent);
  background:color-mix(in srgb,var(--sub-accent) 12%, transparent);
}

#subscriptionsMode .sub-stat-icon svg{
  width:15px;
  height:15px;
}

#subscriptionsMode .sub-stat-icon--warn{
  color:var(--sub-warn);
  background:color-mix(in srgb,var(--sub-warn) 15%, transparent);
}

#subscriptionsMode .sub-stat-icon--success{
  color:var(--sub-success);
  background:color-mix(in srgb,var(--sub-success) 14%, transparent);
}

#subscriptionsMode .sub-stat-value{
  color:var(--sub-text);
  font-size:clamp(1.14rem,0.38vw + .66rem,1.32rem);
  font-weight:730;
  line-height:1.08;
  letter-spacing:0;
  margin-top:0;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

#subscriptionsMode .sub-stat-value.is-alert{
  color:var(--sub-danger);
  font-size:clamp(1.08rem,0.34vw + .64rem,1.26rem);
}

#subscriptionsMode .sub-stat-meta{
  color:var(--sub-text-3);
  font-size:.66rem;
  font-weight:620;
  line-height:1.2;
  margin-top:auto;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

#subscriptionsMode .sub-stat-trend{
  display:none;
}

#subscriptionsMode .sub-stat-trend.up{color:var(--sub-danger)}
#subscriptionsMode .sub-stat-trend.down{color:var(--sub-success)}
#subscriptionsMode .sub-stat-trend.flat{color:var(--sub-text-3)}

#subscriptionsMode #subBanner:empty{display:none}

#subscriptionsMode .sub-alert-banner{
  margin:2px 0 12px;
  border:1px solid color-mix(in srgb,var(--sub-warn) 34%, var(--sub-line));
  background:color-mix(in srgb,var(--sub-warn) 10%, var(--sub-panel));
  border-radius:12px;
  padding:10px 12px;
  display:flex;
  align-items:flex-start;
  gap:9px;
}

#subscriptionsMode .sub-alert-banner i{
  color:var(--sub-warn);
  font-size:1rem;
  margin-top:2px;
}

#subscriptionsMode .sub-alert-copy{
  flex:1;
  color:color-mix(in srgb,var(--sub-warn) 70%, var(--sub-text));
  font-size:.86rem;
  line-height:1.45;
}

#subscriptionsMode .sub-alert-copy strong{
  font-weight:800;
}

#subscriptionsMode .sub-alert-copy button{
  border:none;
  background:none;
  color:inherit;
  font:inherit;
  font-weight:700;
  cursor:pointer;
  padding:0;
  text-decoration:underline;
  text-underline-offset:2px;
}

#subscriptionsMode .sub-alert-close{
  border:none;
  background:none;
  color:var(--sub-text-3);
  font-size:1.05rem;
  cursor:pointer;
  line-height:1;
  padding:0;
}

#subscriptionsMode .sub-list-card{
  border:1px solid var(--sub-line);
  border-radius:16px;
  background:#fefdfd;
  display:flex;
  flex-direction:column;
  flex:1;
  min-height:0;
  overflow:hidden;
}

#subscriptionsMode .sub-list-topbar{
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  align-items:flex-start;
  gap:10px;
  margin:0;
  padding:10px 12px 9px;
  border-bottom:1px solid var(--sub-line);
}

#subscriptionsMode .sub-tab-strip{
  display:flex;
  gap:4px;
  align-items:center;
  flex-wrap:wrap;
}

#subscriptionsMode .sub-tab-btn{
  border:none;
  background:transparent;
  color:var(--sub-text-2);
  font-family:inherit;
  font-size:1.02rem;
  font-weight:700;
  letter-spacing:.01em;
  padding:6px 8px;
  border-bottom:2px solid transparent;
  cursor:pointer;
  transition:all .2s ease;
}

#subscriptionsMode .sub-tab-btn:hover{
  color:var(--sub-text);
}

#subscriptionsMode .sub-tab-btn.is-active{
  color:var(--sub-accent);
  border-bottom-color:var(--sub-accent);
}

#subscriptionsMode .sub-tab-btn .tab-count{
  color:var(--sub-text-3);
  font-size:.95em;
  margin-left:2px;
}

#subscriptionsMode .sub-tools{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:flex-end;
  gap:7px;
}

#subscriptionsMode .sub-search-wrap{
  min-width:240px;
  position:relative;
}

#subscriptionsMode .sub-search-wrap i{
  position:absolute;
  left:11px;
  top:50%;
  transform:translateY(-50%);
  color:var(--sub-text-3);
  font-size:.9rem;
}

#subscriptionsMode .sub-search-wrap input,
#subscriptionsMode .sub-select,
#subscriptionsMode .sub-page-size{
  height:40px;
  border:1px solid var(--sub-line);
  border-radius:11px;
  background:var(--sub-panel);
  color:var(--sub-text-2);
  font-size:.84rem;
  font-weight:600;
  font-family:inherit;
  transition:border-color .2s ease,box-shadow .2s ease;
}

#subscriptionsMode .sub-search-wrap input{
  width:100%;
  padding:0 34px 0 32px;
}

#subscriptionsMode .sub-search-wrap input:focus,
#subscriptionsMode .sub-select:focus,
#subscriptionsMode .sub-page-size:focus{
  outline:none;
  border-color:color-mix(in srgb,var(--sub-accent) 55%, transparent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--sub-accent) 18%, transparent);
}

#subscriptionsMode .sub-search-clear{
  position:absolute;
  right:9px;
  top:50%;
  transform:translateY(-50%);
  width:20px;
  height:20px;
  border:none;
  border-radius:999px;
  background:color-mix(in srgb,var(--sub-accent) 10%, transparent);
  color:var(--sub-text-2);
  cursor:pointer;
  display:none;
}

#subscriptionsMode .sub-search-clear.show{display:inline-flex;align-items:center;justify-content:center}

#subscriptionsMode .sub-select{
  min-width:140px;
  padding:0 34px 0 12px;
}

#subscriptionsMode .sub-table-wrap{
  border:none;
  border-radius:0;
  overflow:hidden;
  background:transparent;
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
}

#subscriptionsMode .sub-table-head,
#subscriptionsMode .sub-table-row{
  display:grid;
  grid-template-columns:minmax(220px,2fr) minmax(112px,1fr) 120px 170px 96px 110px 130px;
  column-gap:12px;
  align-items:center;
}

#subscriptionsMode .sub-table-head{
  min-height:48px;
  padding:0 16px;
  background:color-mix(in srgb,var(--sub-accent) 6%, var(--sub-panel));
  color:var(--sub-text-2);
  font-size:.78rem;
  font-weight:800;
  letter-spacing:.03em;
  text-transform:uppercase;
  border-bottom:1px solid var(--sub-line);
}

#subscriptionsMode .sub-table-body{
  background:var(--sub-panel);
  flex:1;
  min-height:0;
  overflow:auto;
}

#subscriptionsMode .sub-table-row{
  min-height:62px;
  padding:9px 16px;
  border-top:1px solid var(--sub-line);
  transition:background .2s ease;
}

#subscriptionsMode .sub-table-row:first-child{
  border-top:none;
}

#subscriptionsMode .sub-table-row:hover{
  background:color-mix(in srgb,var(--sub-accent) 4%, transparent);
}

#subscriptionsMode .sub-table-row.is-selected{
  background:color-mix(in srgb,var(--sub-accent) 10%, transparent);
}

#subscriptionsMode .sub-table-row.is-soon:not(.is-selected){
  background:color-mix(in srgb,var(--sub-warn) 7%, transparent);
}

#subscriptionsMode .sub-table-row.is-expired:not(.is-selected){
  background:color-mix(in srgb,var(--sub-danger) 7%, transparent);
}

#subscriptionsMode .sub-table-row.is-flash{
  animation:subRowFlash 1.15s ease;
}

@keyframes subRowFlash{
  0%{background:color-mix(in srgb,var(--sub-info) 24%, transparent)}
  100%{background:inherit}
}

#subscriptionsMode .sub-service-cell{
  display:flex;
  align-items:center;
  gap:10px;
  min-width:0;
}

#subscriptionsMode .sub-service-check{
  width:15px;
  height:15px;
  accent-color:var(--sub-accent);
  cursor:pointer;
  flex-shrink:0;
}

#subscriptionsMode .sub-service-avatar{
  width:32px;
  height:32px;
  border-radius:10px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:.92rem;
  font-weight:700;
  color:#fff;
  background:linear-gradient(145deg,#7682ff,#4e56f0);
  flex-shrink:0;
}

#subscriptionsMode .sub-service-avatar.is-emoji{
  background:color-mix(in srgb,var(--sub-accent) 14%, transparent);
  color:var(--sub-accent);
}

#subscriptionsMode .sub-service-avatar--entertainment{background:linear-gradient(145deg,#ff8f6d,#ff6262)}
#subscriptionsMode .sub-service-avatar--work{background:linear-gradient(145deg,#6d89ff,#5d62f3)}
#subscriptionsMode .sub-service-avatar--learning{background:linear-gradient(145deg,#41b5ff,#5388ff)}
#subscriptionsMode .sub-service-avatar--cloud{background:linear-gradient(145deg,#2dc7b0,#4a97ff)}
#subscriptionsMode .sub-service-avatar--life{background:linear-gradient(145deg,#f5b64c,#f5904b)}
#subscriptionsMode .sub-service-avatar--other{background:linear-gradient(145deg,#9aa5c3,#6f7f9c)}

#subscriptionsMode .sub-service-main{
  min-width:0;
}

#subscriptionsMode .sub-service-name{
  color:var(--sub-text);
  font-size:.92rem;
  font-weight:700;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

#subscriptionsMode .sub-service-sub{
  margin-top:2px;
  color:var(--sub-text-3);
  font-size:.78rem;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

#subscriptionsMode .sub-tag-group{
  display:flex;
  align-items:center;
  gap:6px;
  flex-wrap:wrap;
}

#subscriptionsMode .sub-tag{
  display:inline-flex;
  align-items:center;
  height:24px;
  padding:0 8px;
  border-radius:8px;
  border:1px solid transparent;
  font-size:.75rem;
  font-weight:700;
}

#subscriptionsMode .sub-tag--danger{
  background:color-mix(in srgb,var(--sub-danger) 12%, transparent);
  color:var(--sub-danger);
  border-color:color-mix(in srgb,var(--sub-danger) 30%, transparent);
}

#subscriptionsMode .sub-tag--violet{
  background:color-mix(in srgb,var(--sub-accent) 10%, transparent);
  color:var(--sub-accent);
  border-color:color-mix(in srgb,var(--sub-accent) 32%, transparent);
}

#subscriptionsMode .sub-tag--warm{
  background:color-mix(in srgb,var(--sub-warn) 11%, transparent);
  color:var(--sub-warn);
  border-color:color-mix(in srgb,var(--sub-warn) 34%, transparent);
}

#subscriptionsMode .sub-tag--sky{
  background:color-mix(in srgb,var(--sub-info) 11%, transparent);
  color:var(--sub-info);
  border-color:color-mix(in srgb,var(--sub-info) 28%, transparent);
}

#subscriptionsMode .sub-tag--mint{
  background:color-mix(in srgb,var(--sub-success) 12%, transparent);
  color:var(--sub-success);
  border-color:color-mix(in srgb,var(--sub-success) 30%, transparent);
}

#subscriptionsMode .sub-tag--muted,
#subscriptionsMode .sub-tag--neutral{
  background:color-mix(in srgb,var(--sub-text-3) 12%, transparent);
  color:var(--sub-text-2);
  border-color:color-mix(in srgb,var(--sub-text-3) 22%, transparent);
}

#subscriptionsMode .sub-status-pill{
  display:inline-flex;
  align-items:center;
  gap:6px;
  color:var(--sub-text-2);
  font-size:.82rem;
  font-weight:700;
}

#subscriptionsMode .sub-status-dot{
  width:7px;
  height:7px;
  border-radius:999px;
  background:var(--sub-success);
}

#subscriptionsMode .sub-status-dot.is-warn{background:var(--sub-warn)}
#subscriptionsMode .sub-status-dot.is-danger{background:var(--sub-danger)}

#subscriptionsMode .sub-due-main{
  font-size:.88rem;
  font-weight:780;
  color:var(--sub-text);
  line-height:1.15;
}

#subscriptionsMode .sub-due-main.is-warn{color:var(--sub-warn)}
#subscriptionsMode .sub-due-main.is-danger{color:var(--sub-danger)}

#subscriptionsMode .sub-due-sub{
  margin-top:4px;
  font-size:.77rem;
  color:var(--sub-text-3);
}

#subscriptionsMode .sub-cycle-pill{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:48px;
  height:24px;
  border-radius:8px;
  background:color-mix(in srgb,var(--sub-text-3) 10%, transparent);
  border:1px solid color-mix(in srgb,var(--sub-text-3) 20%, transparent);
  color:var(--sub-text-2);
  font-size:.78rem;
  font-weight:700;
}

#subscriptionsMode .sub-amount{
  color:var(--sub-text);
  font-weight:750;
  font-size:.9rem;
}

#subscriptionsMode .sub-row-actions{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:6px;
}

#subscriptionsMode .sub-op-btn,
#subscriptionsMode .sub-more-btn,
#subscriptionsMode .sub-batch-btn,
#subscriptionsMode .sub-empty-btn,
#subscriptionsMode .sub-card-btn{
  border:none;
  border-radius:8px;
  background:transparent;
  color:var(--sub-text-2);
  font-family:inherit;
  font-weight:700;
  cursor:pointer;
  transition:all .2s ease;
}

#subscriptionsMode .sub-op-btn{
  height:30px;
  padding:0 10px;
  border:1px solid color-mix(in srgb,var(--sub-accent) 25%, var(--sub-line));
  background:color-mix(in srgb,var(--sub-accent) 8%, transparent);
  color:var(--sub-accent);
  font-size:.78rem;
}

#subscriptionsMode .sub-op-btn:hover{
  background:var(--sub-accent);
  border-color:var(--sub-accent);
  color:#fff;
}

#subscriptionsMode .sub-op-btn.is-danger{
  border-color:color-mix(in srgb,var(--sub-danger) 36%, transparent);
  background:color-mix(in srgb,var(--sub-danger) 9%, transparent);
  color:var(--sub-danger);
}

#subscriptionsMode .sub-op-btn.is-danger:hover{
  background:var(--sub-danger);
  border-color:var(--sub-danger);
  color:#fff;
}

#subscriptionsMode .sub-more-btn{
  width:30px;
  height:30px;
  border:1px solid var(--sub-line);
  color:var(--sub-text-3);
}

#subscriptionsMode .sub-more-btn:hover{
  border-color:var(--sub-line-strong);
  color:var(--sub-text);
}

#subscriptionsMode .sub-batch-bar{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
  min-height:44px;
  padding:8px 12px;
  border-bottom:1px solid var(--sub-line);
  background:color-mix(in srgb,var(--sub-accent) 8%, var(--sub-panel));
}

#subscriptionsMode .sub-batch-text{
  color:var(--sub-accent);
  font-size:.84rem;
  font-weight:750;
  margin-right:auto;
}

#subscriptionsMode .sub-batch-btn{
  height:31px;
  padding:0 10px;
  border:1px solid transparent;
  border-radius:8px;
  font-size:.76rem;
}

#subscriptionsMode .sub-batch-btn.danger{
  background:var(--sub-danger);
  color:#fff;
}

#subscriptionsMode .sub-batch-btn.primary{
  background:var(--sub-info);
  color:#fff;
}

#subscriptionsMode .sub-batch-btn.ghost{
  border-color:color-mix(in srgb,var(--sub-accent) 32%, transparent);
  color:var(--sub-accent);
}

#subscriptionsMode .sub-table-empty{
  padding:34px 18px;
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  color:var(--sub-text-3);
}

#subscriptionsMode .sub-empty-title{
  margin-top:8px;
  color:var(--sub-text-2);
  font-size:.95rem;
  font-weight:700;
}

#subscriptionsMode .sub-empty-desc{
  margin-top:6px;
  font-size:.82rem;
}

#subscriptionsMode .sub-empty-btn{
  margin-top:12px;
  height:34px;
  padding:0 14px;
  border:1px solid color-mix(in srgb,var(--sub-accent) 28%, transparent);
  color:var(--sub-accent);
  font-size:.82rem;
  font-weight:700;
}

#subscriptionsMode .sub-empty-btn:hover{
  background:color-mix(in srgb,var(--sub-accent) 9%, transparent);
}

#subscriptionsMode .sub-table-foot{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  min-height:50px;
  padding:0 13px;
  border-top:1px solid var(--sub-line);
  background:color-mix(in srgb,var(--sub-panel) 82%, var(--sub-bg-0));
}

#subscriptionsMode .sub-foot-total{
  color:var(--sub-text-3);
  font-size:.78rem;
  font-weight:700;
}

#subscriptionsMode .sub-foot-right{
  display:flex;
  align-items:center;
  gap:9px;
}

#subscriptionsMode .sub-pager{
  display:flex;
  align-items:center;
  gap:6px;
}

#subscriptionsMode .sub-page-btn{
  min-width:32px;
  height:32px;
  border:1px solid var(--sub-line);
  border-radius:9px;
  background:var(--sub-panel);
  color:var(--sub-text-2);
  font-size:.8rem;
  font-weight:700;
  font-family:inherit;
  cursor:pointer;
  padding:0 8px;
}

#subscriptionsMode .sub-page-btn:hover{
  border-color:var(--sub-line-strong);
  color:var(--sub-text);
}

#subscriptionsMode .sub-page-btn.is-active{
  border-color:color-mix(in srgb,var(--sub-accent) 40%, transparent);
  background:var(--sub-accent-soft);
  color:var(--sub-accent);
}

#subscriptionsMode .sub-page-btn:disabled{
  opacity:.45;
  cursor:not-allowed;
}

#subscriptionsMode .sub-page-size{
  width:72px;
  padding:0 8px;
  color:var(--sub-text-2);
}

#subscriptionsMode .sub-mobile-list{
  display:none;
}

#subscriptionsMode .sub-mobile-card{
  border:1px solid var(--sub-line);
  border-radius:14px;
  padding:12px;
  background:var(--sub-panel);
}

#subscriptionsMode .sub-mobile-head{
  display:flex;
  align-items:flex-start;
  gap:8px;
}

#subscriptionsMode .sub-mobile-meta{
  margin-top:8px;
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
}

#subscriptionsMode .sub-mobile-kv small{
  display:block;
  color:var(--sub-text-3);
  font-size:.74rem;
}

#subscriptionsMode .sub-mobile-kv strong{
  display:block;
  color:var(--sub-text-2);
  margin-top:3px;
  font-size:.83rem;
}

#subscriptionsMode .sub-mobile-actions{
  margin-top:10px;
  display:flex;
  gap:7px;
}

#subscriptionsMode .sub-card-btn{
  height:32px;
  padding:0 10px;
  border:1px solid var(--sub-line);
  color:var(--sub-text-2);
  font-size:.8rem;
}

#subscriptionsMode .sub-card-btn.primary{
  color:var(--sub-accent);
  border-color:color-mix(in srgb,var(--sub-accent) 32%, transparent);
  background:color-mix(in srgb,var(--sub-accent) 8%, transparent);
}

#subscriptionsMode .sub-card-btn.danger{
  color:var(--sub-danger);
  border-color:color-mix(in srgb,var(--sub-danger) 36%, transparent);
  background:color-mix(in srgb,var(--sub-danger) 9%, transparent);
}

@media (max-width:1280px){
  #subscriptionsMode #subStats{grid-template-columns:repeat(2,minmax(0,1fr));}
}

@media (max-width:1024px){
  #subscriptionsMode .sub-premium-page{
    grid-template-columns:1fr;
    gap:14px;
  }

  #subscriptionsMode .sub-side-nav{
    order:2;
    min-height:auto;
  }

  #subscriptionsMode .sub-main-panel{
    order:1;
  }
}

@media (max-width:860px){
  #subscriptionsMode .sub-main-panel{padding:14px;}

  #subscriptionsMode .sub-page-title{font-size:1.64rem;}

  #subscriptionsMode .sub-page-header{
    flex-direction:column;
    align-items:flex-start;
  }

  #subscriptionsMode .sub-list-topbar{
    flex-direction:column;
    align-items:stretch;
  }

  #subscriptionsMode .sub-tools{
    justify-content:stretch;
  }

  #subscriptionsMode .sub-search-wrap,
  #subscriptionsMode .sub-select{
    min-width:0;
    width:100%;
  }

  #subscriptionsMode .sub-table-wrap{
    display:none;
  }

  #subscriptionsMode .sub-mobile-list{
    display:flex;
    flex-direction:column;
    gap:8px;
    padding:10px 12px 12px;
  }

  #subscriptionsMode .sub-side-nav{
    display:none;
  }
}

@media (max-width:560px){
  #subscriptionsMode #subStats{grid-template-columns:1fr;}

  #subscriptionsMode .sub-tab-btn{font-size:.94rem;padding:6px 4px;}

  #subscriptionsMode .sub-mobile-meta{grid-template-columns:1fr;}
}

body:has(#subscriptionsMode:not(.hidden)) .multi-bar{
  display:none !important;
}

#appMain.show .app:has(#subscriptionsMode:not(.hidden)){
  max-width:var(--layout-shell-max-width,1568px);
}

@media (min-width:1181px){
  #appMain.show .app:has(#subscriptionsMode:not(.hidden)){
    padding-left:0;
    padding-right:0;
  }
}
`;
  document.head.appendChild(st);
})();

function addT(){
  const inp=document.getElementById("tIn"),txt=inp.value.trim();
  if(!txt)return;
  if(!T[sel])T[sel]=[];
  const dur=parseInt(document.getElementById("durIn").value)||0;
  T[sel].push(mkTask(txt,document.getElementById("pSel").value,document.getElementById("tTime").value,dur));
  inp.value="";
  document.getElementById("tTime").value="";
  document.getElementById("durIn").value="";
  rCal();
  rT();
  rTagDropdownContent();
  save();
  toast("\u4efb\u52a1\u5df2\u6dfb\u52a0","task-add");
  hideAddTaskInline();
}

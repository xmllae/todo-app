function del(id){
  pushUndo("\u4efb\u52a1\u5df2\u5220\u9664");
  T[sel]=T[sel].filter(x=>x.id!==id);
  if(!T[sel].length)delete T[sel];
  rCal();
  rT();
  save();
}

function del(id){
  var task=null;
  var taskDate=sel;
  var dayTasks=T[sel]||[];
  for(var i=0;i<dayTasks.length;i++){
    if(+dayTasks[i].id===+id){
      task=dayTasks[i];
      taskDate=sel;
      break;
    }
  }
  if(!task){
    for(var ds in T){
      var arr=T[ds]||[];
      for(var j=0;j<arr.length;j++){
        if(+arr[j].id===+id){
          task=arr[j];
          taskDate=ds;
          break;
        }
      }
      if(task)break;
    }
  }
  if(!task)return;

  var rid=task.recurRuleId?String(task.recurRuleId):"";

  pushUndo("\u4efb\u52a1\u5df2\u5220\u9664");

  if(rid){
    if(typeof deleteRecurRule==="function"){
      try{
        deleteRecurRule(rid,true);
      }catch(e){}
    }else{
      if(Array.isArray(recurRules))recurRules=recurRules.filter(function(r){return r.id!==rid});
      for(var ds2 in T){
        (T[ds2]||[]).forEach(function(t){
          if(t.recurRuleId===rid)t.recurRuleId="";
        });
      }
    }
  }

  if(T[taskDate]){
    T[taskDate]=T[taskDate].filter(function(x){return +x.id!==+id});
    if(!T[taskDate].length)delete T[taskDate];
  }
  rCal();
  rT();
  if(typeof rKanban==="function")rKanban();
  save();
  toast("\ud83d\uddd1\ufe0f \u5df2\u5220\u9664");
}

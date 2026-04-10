(function(){
  var dot=document.getElementById("headerStatusDot");
  if(dot){
    dot.className="user-status-dot";
    dot.removeAttribute("title");
  }

  if(typeof updateSyncStatus==="function"){
    var originalUpdateSyncStatus=updateSyncStatus;
    updateSyncStatus=function(s){
      if(!s){
        var clearDot=document.getElementById("headerStatusDot");
        var live=document.getElementById("syncStatus");
        clearTimeout(window._syncFade);
        if(live)live.textContent="";
        if(clearDot){
          clearDot.className="user-status-dot";
          clearDot.removeAttribute("title");
        }
        return;
      }
      return originalUpdateSyncStatus(s);
    };
  }

  if(typeof loginAs==="function"){
    var originalLoginAs=loginAs;
    loginAs=function(user,userData){
      updateSyncStatus(typeof isGuest!=="undefined"&&isGuest?"offline":"saved");
      return originalLoginAs(user,userData);
    };
  }
})();

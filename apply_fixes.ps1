[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# FIX 1: Update closeTaskMoreFloat to also remove is-open class
$old1 = "function closeTaskMoreFloat(){if(_taskMoreFloatEl){_taskMoreFloatEl.remove();_taskMoreFloatEl=null}}"
$new1 = "function closeTaskMoreFloat(){if(_taskMoreFloatEl){_taskMoreFloatEl.remove();_taskMoreFloatEl=null}document.querySelectorAll('.task-more-btn.is-open').forEach(function(b){b.classList.remove('is-open')})}"

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "FIX 1 OK: closeTaskMoreFloat updated"
} else {
    Write-Host "FIX 1 FAIL: old string not found"
}

# FIX 2: Add btn.classList.add('is-open') at the end of openTaskMoreFloat (before closing of function toggleTaskMoreMenu)
# Find the line that ends openTaskMoreFloat: el.style.zIndex='200'}function toggleTaskMoreMenu
$old2 = "el.style.zIndex='200'}function toggleTaskMoreMenu"
$new2 = "el.style.zIndex='200';btn.classList.add('is-open')}function toggleTaskMoreMenu"

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "FIX 2 OK: openTaskMoreFloat adds is-open class"
} else {
    Write-Host "FIX 2 FAIL: old string not found"
}

# FIX 3: Update toggleTaskMoreMenu to not call rT(), use direct DOM manipulation
$old3 = "function toggleTaskMoreMenu(id){cancelDelayedToggleExpand();taskMoreMenuId=taskMoreMenuId===id?null:id;closeTaskMoreFloat();rT();if(taskMoreMenuId!=null)requestAnimationFrame(function(){openTaskMoreFloat(taskMoreMenuId)})}"
$new3 = "function toggleTaskMoreMenu(id){cancelDelayedToggleExpand();var wasOpen=taskMoreMenuId===id;taskMoreMenuId=wasOpen?null:id;closeTaskMoreFloat();if(!wasOpen){requestAnimationFrame(function(){openTaskMoreFloat(taskMoreMenuId)})}}"

if ($content.Contains($old3)) {
    $content = $content.Replace($old3, $new3)
    Write-Host "FIX 3 OK: toggleTaskMoreMenu no longer calls rT()"
} else {
    Write-Host "FIX 3 FAIL: old string not found"
}

# FIX 4: Update toggleExpand to not close more menu on expand
$old4 = "function toggleExpand(id){cancelDelayedToggleExpand();closeTaskMoreFloat();taskMoreMenuId=null;expandedId=expandedId===id?null:id;editingId=null;editingTimeId=null;editingSubId=null;ppOpenId=null;rT()}"
$new4 = "function toggleExpand(id){cancelDelayedToggleExpand();expandedId=expandedId===id?null:id;editingId=null;editingTimeId=null;editingSubId=null;ppOpenId=null;rT()}"

if ($content.Contains($old4)) {
    $content = $content.Replace($old4, $new4)
    Write-Host "FIX 4 OK: toggleExpand no longer closes more menu"
} else {
    Write-Host "FIX 4 FAIL: old string not found"
}

# FIX 5: Update document click handler to not call rT() when closing dropdown
$old5 = "    if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
    if (e.target.closest && (e.target.closest('.task-more-wrap') || e.target.closest('.task-more-float'))) return;
    if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
    taskMoreMenuId = null;
    if (typeof rT === 'function') rT();
  }, true);
  if (!window._taskMoreScrollClose) {
    window._taskMoreScrollClose = true;
    document.addEventListener('scroll', function () {
      if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
      if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
      taskMoreMenuId = null;
      if (typeof rT === 'function') rT();
    }, true);"
$new5 = "    if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
    if (e.target.closest && (e.target.closest('.task-more-wrap') || e.target.closest('.task-more-float'))) return;
    if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
    taskMoreMenuId = null;
  }, true);
  if (!window._taskMoreScrollClose) {
    window._taskMoreScrollClose = true;
    document.addEventListener('scroll', function () {
      if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
      if (typeof closeTaskMoreFloat === 'function') closeTaskMoreFloat();
      taskMoreMenuId = null;
    }, true);"

if ($content.Contains($old5)) {
    $content = $content.Replace($old5, $new5)
    Write-Host "FIX 5 OK: document click and scroll handlers no longer call rT()"
} else {
    Write-Host "FIX 5 FAIL: old string not found"
}

[System.IO.File]::WriteAllText("D:\todo-app-main\index.html", $content, [System.Text.Encoding]::UTF8)
Write-Host "All fixes applied and file saved."

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# FIX 5: Fix the exact content
$old5 = "if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
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
    }, true);
  }
}"
$new5 = "if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;
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
    }, true);
  }
}"

if ($content.Contains($old5)) {
    $content = $content.Replace($old5, $new5)
    [System.IO.File]::WriteAllText("D:\todo-app-main\index.html", $content, [System.Text.Encoding]::UTF8)
    Write-Host "FIX 5 OK: removed rT() from document click and scroll handlers"
} else {
    Write-Host "FIX 5 FAIL: old string not found"
}

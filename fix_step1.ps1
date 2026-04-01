[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# Check what we need to fix
$tests = @(
    "closeTaskMoreFloat();rT();if(taskMoreMenuId!=null)",
    "closeTaskMoreFloat();taskMoreMenuId=null;expandedId",
    "taskMoreMenuId=taskMoreMenuId===id?null:id;closeTaskMoreFloat();rT()",
    "expandedId=expandedId===id?null:id;editingId=null;editingTimeId=null;editingSubId=null;ppOpenId=null;rT()",
    "closeTaskMoreFloat();taskMoreMenuId=null",
    "function closeTaskMoreFloat(){if(_taskMoreFloatEl){_taskMoreFloatEl.remove();_taskMoreFloatEl=null}}"
)

foreach ($test in $tests) {
    $idx = $content.IndexOf($test)
    if ($idx -ge 0) {
        Write-Host "FOUND: [$test]"
        Write-Host "  at index: $idx"
    } else {
        Write-Host "NOT FOUND: [$test]"
    }
}

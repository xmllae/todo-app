$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)
$idx = $content.IndexOf("取消冷冻")
if ($idx -ge 0) {
    Write-Host "Found at: $idx"
    $start = [Math]::Max(0, $idx - 50)
    $end = [Math]::Min($content.Length, $idx + 100)
    Write-Host "[$($content.Substring($start, $end - $start))]"
} else {
    Write-Host "Not found (trying alternative)"
    # Try binary search
    $bytes = [System.IO.File]::ReadAllBytes("D:\todo-app-main\index.html")
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    $idx2 = $text.IndexOf("取消冷冻")
    Write-Host "In bytes as UTF8: $idx2"
    
    # Check the closeTaskMoreFloat function
    $idx3 = $content.IndexOf("function closeTaskMoreFloat")
    Write-Host "closeTaskMoreFloat at: $idx3"
    Write-Host "[$($content.Substring($idx3, 200))]"
}

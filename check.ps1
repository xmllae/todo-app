$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)
$idx = $content.IndexOf("function toggleExpand")
if ($idx -ge 0) {
    Write-Host "toggleExpand at: $idx"
    Write-Host "[$($content.Substring($idx, 280))]"
} else {
    Write-Host "Not found"
}

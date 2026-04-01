[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# Check document click handler
$idx = $content.IndexOf("if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;")
if ($idx -ge 0) {
    Write-Host "doc handler at: $idx"
    Write-Host "[$($content.Substring($idx, 500))]"
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# Find the exact doc handler section
$idx = $content.IndexOf("if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;")
Write-Host "First doc handler at: $idx"

# Show 800 chars from there
Write-Host "---"
Write-Host $content.Substring($idx, 800)

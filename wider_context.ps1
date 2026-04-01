[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# Check wider context around first rT at 375523
Write-Host "=== AROUND FIRST RT (375523) ==="
Write-Host $content.Substring(375200, 500)

Write-Host ""
Write-Host "=== AROUND SECOND RT (375895) ==="
Write-Host $content.Substring(375550, 500)

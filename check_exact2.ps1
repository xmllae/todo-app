[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# Check the exact content around the scroll handler
$idx = 375613
Write-Host "Content at 375613:"
Write-Host $content.Substring($idx, 250)

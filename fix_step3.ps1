[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# Check scroll handler
$idx = $content.IndexOf("document.addEventListener('scroll', function () {")
$candidate = $idx + $content.Substring($idx).IndexOf("if (typeof taskMoreMenuId")
Write-Host "scroll handler starts at: $idx"
Write-Host "taskMoreMenuId scroll check at: $candidate"
Write-Host "[$($content.Substring($candidate, 200))]"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# First check how many times rT appears in taskMore context
$matches = @()
$start = 0
while (($idx = $content.IndexOf("if (typeof rT === 'function') rT();", $start)) -ge 0) {
    $matches += $idx
    $start = $idx + 1
}
Write-Host "Found $($matches.Count) occurrences of 'if (typeof rT === 'function') rT();'"
foreach ($m in $matches) {
    Write-Host "  at: $m"
    Write-Host "  context: [$($content.Substring($m - 50, 100))]"
}

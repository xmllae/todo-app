[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText("D:\todo-app-main\index.html", [System.Text.Encoding]::UTF8)

# Find the section
$idx = $content.IndexOf("if (typeof taskMoreMenuId === 'undefined' || taskMoreMenuId == null) return;")
Write-Host "Section starts at: $idx"

# Get the text we want to replace
$text = $content.Substring($idx, 600)

# Find the closing }
$endIdx = $text.IndexOf("}")
Write-Host "End of handler block at offset: $endIdx"
$block = $text.Substring(0, $endIdx + 1)
Write-Host "---BLOCK TO REPLACE---"
Write-Host $block
Write-Host "---END BLOCK---"

# Save to file for reference
$block | Out-File -FilePath "D:\todo-app-main\block_to_replace.txt" -Encoding UTF8
Write-Host "Block saved to block_to_replace.txt"

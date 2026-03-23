$c = Get-Content 'd:\todo-app-main\subscriptions.js' -Raw
$i = $c.IndexOf('function clearAllSubs()')
Write-Host $c.Substring($i, 600)

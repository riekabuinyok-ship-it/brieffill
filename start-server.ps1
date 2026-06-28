$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node.exe"
$psi.Arguments = "C:\Users\X1 CARBON\Desktop\BriefFill\backend\server.js"
$psi.WorkingDirectory = "C:\Users\X1 CARBON\Desktop\BriefFill\backend"
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true
$p = [System.Diagnostics.Process]::Start($psi)
Write-Output $p.Id

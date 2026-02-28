Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
$port = Get-NetTCPConnection -LocalPort 3333 -ErrorAction SilentlyContinue
if ($port) { Write-Host "ADVERTENCIA: Puerto 3333 sigue ocupado por PID $($port.OwningProcess)" }
else { Write-Host "Puerto 3333 libre" }
Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "c:\Users\lklklkm\Desktop\Proyectos personales\NoticIAs" -WindowStyle Hidden
Start-Sleep -Seconds 2
Write-Host "Servidor iniciado"

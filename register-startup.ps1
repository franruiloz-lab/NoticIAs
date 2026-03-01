# Registra PM2 como tarea de inicio de sesión en Windows
$pm2Path = "$env:APPDATA\npm\pm2.cmd"
$action  = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$pm2Path`" resurrect"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
Register-ScheduledTask `
  -TaskName   "PM2_NoticIAs" `
  -Action     $action `
  -Trigger    $trigger `
  -Settings   $settings `
  -RunLevel   Highest `
  -Force
Write-Host "Tarea registrada. NoticIAs arrancará automáticamente al iniciar sesión."

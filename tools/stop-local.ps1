$ErrorActionPreference = 'Stop'
$workspace = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $workspace
$pidFile = Join-Path $workspace '.runtime\services.json'
if (Test-Path -LiteralPath $pidFile) {
    $services = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
    foreach ($service in $services) {
        $process = Get-Process -Id $service.processId -ErrorAction SilentlyContinue
        if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $service.startedAt) {
            $command = Get-CimInstance Win32_Process -Filter "ProcessId = $($service.processId)"
            if ($command.CommandLine.Contains($service.script)) {
                Stop-Process -Id $service.processId
                Write-Output "Stopped $($service.name)."
            }
        }
    }
}
& docker compose --env-file recovered/.env stop
if ($LASTEXITCODE -ne 0) { throw 'Database stop failed.' }
Write-Output 'Local services stopped. Database data retained.'

$ErrorActionPreference = 'Stop'
$workspace = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $workspace
function Check-Exit([string]$step) { if ($LASTEXITCODE -ne 0) { throw "$step failed (exit $LASTEXITCODE)." } }
. (Join-Path $PSScriptRoot 'docker-ready.ps1')
& node -e "const [major,minor]=process.versions.node.split('.').map(Number); if(major<24||(major===24&&minor<11)){console.error('Node.js >=24.11.0 is required.');process.exit(1)}"
Check-Exit 'Check Node.js version'
if (-not (Test-Path -LiteralPath (Join-Path $workspace 'node_modules'))) {
    & npm.cmd ci
    Check-Exit 'npm ci'
}
& node (Join-Path $PSScriptRoot 'init-local.cjs')
Check-Exit 'Initialize local configuration'
if (-not (Test-LocalDockerEngine)) {
    $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path -LiteralPath $dockerDesktop)) { throw 'Docker Desktop is required for the local database.' }
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    $deadline = (Get-Date).AddSeconds(60)
    do {
        Start-Sleep -Seconds 2
        if (Test-LocalDockerEngine) { break }
    } while ((Get-Date) -lt $deadline)
    if (-not (Test-LocalDockerEngine)) { throw 'Docker Desktop engine did not become ready within 60 seconds.' }
}
& docker compose --env-file recovered/.env up -d --wait --wait-timeout 60
Check-Exit 'Start isolated local database'
& node (Join-Path $PSScriptRoot 'bootstrap-database.cjs')
Check-Exit 'Import inferred local schema'
$nodeExe = (Get-Command node.exe).Source
$runtimeDir = Join-Path $workspace '.runtime'
$pidFile = Join-Path $runtimeDir 'services.json'
$previous = if (Test-Path -LiteralPath $pidFile) { Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json } else { @() }
$envValues = @{}
foreach ($line in Get-Content -LiteralPath (Join-Path $workspace 'recovered\.env')) {
    if ($line -match '^([A-Z_]+)=(.*)$') { $envValues[$Matches[1]] = $Matches[2] }
}
$services = @(
    @{ name = 'main'; file = 'recovered\MAIN_SERVER\main_server.js'; port = [int]$envValues.MAIN_SERVER_PORT },
    @{ name = 'zalo'; file = 'recovered\ZL_SERVER\zl_server.js'; port = [int]$envValues.ZL_SERVER_PORT },
    @{ name = 'files'; file = 'recovered\FILES_SERVER\files_server.js'; port = [int]$envValues.FILES_SERVER_PORT },
    @{ name = 'ui'; file = 'ui\server.cjs'; port = $(if ($envValues.UI_PORT) { [int]$envValues.UI_PORT } else { 13103 }) }
)
$running = @()
foreach ($service in $services) {
    $old = $previous | Where-Object name -EQ $service.name | Select-Object -First 1
    $oldProcess = if ($old) { Get-Process -Id $old.processId -ErrorAction SilentlyContinue } else { $null }
    if ($oldProcess -and $oldProcess.StartTime.ToUniversalTime().ToString('o') -eq $old.startedAt) {
        $running += $old
        Write-Output "$($service.name) already running (PID $($old.processId))."
        continue
    }
    $listener = Get-NetTCPConnection -State Listen -LocalPort $service.port -ErrorAction SilentlyContinue
    if ($listener) { throw "Port $($service.port) is occupied. No existing process was stopped." }
    $scriptFile = Join-Path $workspace $service.file
    $process = Start-Process -FilePath $nodeExe -ArgumentList @("`"$scriptFile`"") -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir "$($service.name).out.log") -RedirectStandardError (Join-Path $runtimeDir "$($service.name).err.log")
    $running += [pscustomobject]@{ name = $service.name; processId = $process.Id; startedAt = $process.StartTime.ToUniversalTime().ToString('o'); script = $scriptFile }
    $running | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $pidFile -Encoding utf8
    Write-Output "Started $($service.name) (PID $($process.Id))."
}
& node (Join-Path $PSScriptRoot 'smoke-local.cjs')
Check-Exit 'Verify local services'
Write-Output 'PA03 ready. Open http://127.0.0.1:13103 to view the interface. See .runtime/LOCAL-ACCESS.txt for local backend credentials.'

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspace = Split-Path $PSScriptRoot -Parent
$distDir = Join-Path $workspace 'dist'
[System.IO.Directory]::CreateDirectory($distDir) | Out-Null
$zipPath = Join-Path $distDir 'PA03-khoi-phuc.zip'
$tempPath = Join-Path $distDir ('PA03-' + [guid]::NewGuid().ToString('N') + '.zip')
$files = @()
foreach ($name in @('README.md', 'START.cmd', 'STOP.cmd', '.env.example', '.gitignore', 'package.json', 'package-lock.json', 'compose.yaml')) {
    $files += Get-Item -LiteralPath (Join-Path $workspace $name)
}
foreach ($dir in @('recovered', 'analysis', 'database', 'docs', 'tools', 'web', 'ui', 'tests')) {
    $files += Get-ChildItem -LiteralPath (Join-Path $workspace $dir) -File -Recurse -Force
}
$zip = [System.IO.Compression.ZipFile]::Open($tempPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($workspace.Length + 1).Replace('\', '/')
        if ($relative -eq 'recovered/.env' -or $relative.StartsWith('recovered/FILES_SERVER/files/')) { continue }
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $zip.Dispose() }
Move-Item -LiteralPath $tempPath -Destination $zipPath -Force
$verifyZip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $forbidden = @($verifyZip.Entries | Where-Object { $_.FullName -eq 'recovered/.env' -or $_.FullName.StartsWith('.runtime/') -or $_.FullName.StartsWith('node_modules/') })
    if ($forbidden.Count -gt 0) { throw 'Unexpected private/runtime files in source bundle.' }
    $sources = @($verifyZip.Entries | Where-Object { $_.FullName.StartsWith('recovered/') -and $_.FullName.EndsWith('.js') })
    if ($sources.Count -ne 73) { throw "Expected 73 recovered JS files; found $($sources.Count)." }
    Write-Output "Source bundle verified: $($verifyZip.Entries.Count) entries, 73 recovered JS files, private environment excluded."
} finally { $verifyZip.Dispose() }
Get-FileHash -LiteralPath $zipPath -Algorithm SHA256 | Select-Object Algorithm,Hash
Get-Item -LiteralPath $zipPath | Select-Object FullName,Length

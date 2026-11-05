$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspace = Split-Path $PSScriptRoot -Parent
$sourceDir = Join-Path $workspace 'source-documents'
$outDir = Join-Path $workspace 'recovered'
$encoding = [System.Text.UTF8Encoding]::new($false)
$manifest = @()
foreach ($doc in Get-ChildItem -LiteralPath $sourceDir -Filter '*.docx' | Sort-Object Name) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($doc.FullName)
    try {
        $entry = $zip.GetEntry('word/document.xml')
        $reader = [System.IO.StreamReader]::new($entry.Open())
        try { [xml]$xml = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $ns = [System.Xml.XmlNamespaceManager]::new($xml.NameTable)
        $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        $lines = foreach ($p in $xml.SelectNodes('//w:body//w:p', $ns)) {
            $parts = foreach ($n in $p.SelectNodes('.//w:t | .//w:tab | .//w:br | .//w:cr', $ns)) {
                switch ($n.LocalName) {
                    't' { $n.InnerText }
                    'tab' { "`t" }
                    default { "`n" }
                }
            }
            $parts -join ''
        }
        $name = $doc.Name -replace '\.docx$', ''
        if ($name -match '^(MAIN_SERVER|ZL_SERVER|FILES_SERVER|FRONTEND)_(.+)$') {
            $service = $Matches[1]
            $relative = $Matches[2]
            if ($relative -match '^(config|controllers|middleware|routes|utils)_(.+)$') {
                $relative = Join-Path $Matches[1] $Matches[2]
            }
            $target = Join-Path (Join-Path $outDir $service) $relative
        } else { throw "Unrecognized source name: $name" }
        [System.IO.Directory]::CreateDirectory((Split-Path $target -Parent)) | Out-Null
        if ($lines.Count -gt 0 -and $lines[0] -match '^File:\s+') { $lines = @($lines | Select-Object -Skip 1) }
        $content = ($lines -join "`n") + "`n"
        [System.IO.File]::WriteAllText($target, $content, $encoding)
        $manifest += [pscustomobject]@{ document = $doc.Name; file = $target.Substring($workspace.Length + 1).Replace('\', '/'); lines = $lines.Count; sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLower() }
    } finally { $zip.Dispose() }
}
[System.IO.File]::WriteAllText((Join-Path $outDir 'source-manifest.json'), ($manifest | ConvertTo-Json -Depth 4), $encoding)
Write-Output "Recovered $($manifest.Count) JavaScript files."

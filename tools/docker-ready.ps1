function Test-LocalDockerEngine {
    # Windows PowerShell promotes native stderr to NativeCommandError with Stop.
    # A stopped engine is an expected probe result, so inspect the exit code.
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previousPreference
    }
}

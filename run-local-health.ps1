param(
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$healthUrl = "http://localhost:$Port/api/health"
$pwshPath = (Get-Command pwsh).Path
$nodePath = (Get-Command node).Path
$tsxCli = Join-Path $repoRoot "node_modules\tsx\dist\cli.mjs"
$localApiScript = Join-Path $repoRoot "scripts\local-api.ts"

if (-not (Test-Path (Join-Path $repoRoot ".env.local"))) {
  throw ".env.local is missing in $repoRoot"
}

if (-not (Test-Path $tsxCli)) {
  throw "tsx CLI was not found in node_modules. Run npm install first."
}

Write-Host "Starting local API..."
Write-Host "Runtime logs will stay visible in a separate PowerShell window."

$serverCommand = "& '$nodePath' --env-file-if-exists=.env.local '$tsxCli' watch --clear-screen=false '$localApiScript'"

$process = Start-Process `
  -FilePath $pwshPath `
  -ArgumentList @(
    "-NoLogo",
    "-NoProfile",
    "-NoExit",
    "-Command",
    $serverCommand
  ) `
  -WorkingDirectory $repoRoot `
  -WindowStyle Normal `
  -PassThru

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$ready = $false

while ((Get-Date) -lt $deadline) {
  if ($process.HasExited) {
    throw "Local API exited before it became reachable."
  }

  Start-Sleep -Milliseconds 500

  try {
    Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 3 | Out-Null
    $ready = $true
    break
  } catch {
    if ($_.Exception.Response) {
      $ready = $true
      break
    }
  }
}

if (-not $ready) {
  try {
    Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
  } catch {
  }

  throw "Local API did not become reachable within $TimeoutSeconds seconds."
}

Start-Process $healthUrl | Out-Null

Write-Host ""
Write-Host "Local API process id: $($process.Id)"
Write-Host "Health URL: $healthUrl"
Write-Host "The browser should now be open."
Write-Host "Press Ctrl+C in the server window to stop the API."
Write-Host "Press q here to close this launcher."

while (-not $process.HasExited) {
  if ([Console]::KeyAvailable) {
    $key = [Console]::ReadKey($true)
    if ($key.Key -eq [ConsoleKey]::q) {
      Write-Host "Stopping local API..."
      Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
      break
    }
  }

  Start-Sleep -Milliseconds 200
}

if ($process.HasExited) {
  Write-Host "Local API stopped."
}

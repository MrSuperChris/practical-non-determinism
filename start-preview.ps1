param([switch]$Eco, [int]$Port = 8896)
$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) { $nodePath = $nodeCommand.Source }
else { $nodePath = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Install Node.js 22 or newer to run the local preview.' }
$appArgs = @((Join-Path $PSScriptRoot 'tools/serve.mjs'), "--port=$Port")
if ($Eco) { $appArgs += '--eco' }
& $nodePath @appArgs

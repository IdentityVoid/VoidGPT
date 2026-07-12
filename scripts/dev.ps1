# dev.ps1 — Start the dev server on Windows.
# Run from PowerShell:  powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
#
# This is a thin wrapper around `bun run dev`. If `bun` is missing on PATH,
# run scripts/install.ps1 first.

$ErrorActionPreference = 'Stop'

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
  Write-Host "==> bun not found on PATH. Run scripts/install.ps1 first." -ForegroundColor Red
  exit 1
}

Write-Host "==> starting Vite dev server on http://localhost:5173" -ForegroundColor Cyan
Write-Host "(Ctrl+C to stop)`n"

& bun run dev

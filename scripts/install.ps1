# install.ps1 — One-click-ish installer for Void Coder on Windows (PowerShell).
#
# What it does, in order:
#   1. Detects Bun. Installs it via the official PS installer if missing.
#   2. Runs `bun install`.
#   3. Creates `.env.local` from `.env.example` (only if it doesn't already exist).
#   4. Prompts for a Convex deployment URL, writes it to `.env.local`,
#      and runs `bunx convex dev --once` to deploy the backend.
#   5. Prints "how to start the dev server" at the end.
#
# Run from the project root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1

$ErrorActionPreference = 'Stop'

function Step($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "[ok] $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "[!] $msg" -ForegroundColor Magenta }
function Fail($msg)  { Write-Host "[x] $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Void Coder - installer" -ForegroundColor Magenta
Write-Host "(this script needs network for: Bun install, npmjs.org, convex.dev)" -ForegroundColor DarkGray
Write-Host ""

# 1. Bun detection / install
Step "Checking for Bun"
$bun = Get-Command bun -ErrorAction SilentlyContinue
if ($bun) {
  $ver = & bun --version
  Ok "Bun $ver found"
} else {
  Step "Bun not found - installing via the official PowerShell installer (irm bun.sh/install.ps1 | iex)"
  try {
    irm bun.sh/install.ps1 | iex
  } catch {
    Fail "Bun install failed. Install Bun manually from https://bun.sh and re-run this script."
  }
  $env:Path = "$env:USERPROFILE\.bun\bin;$env:Path"
  [System.Environment]::SetEnvironmentVariable('Path', $env:Path, 'User')
  $bun = Get-Command bun -ErrorAction SilentlyContinue
  if (-not $bun) {
    Fail "Bun not on PATH after install. Restart PowerShell and re-run this script."
  }
  $ver = & bun --version
  Ok "Bun $ver installed"
}

# 2. Install dependencies
Step "Installing dependencies (bun install)"
& bun install
Ok "Dependencies installed"

# 3. .env.local
Step "Creating .env.local"
if (Test-Path .env.local) {
  Warn ".env.local already exists - leaving it alone (existing config preserved)"
} else {
  if (-not (Test-Path .env.example)) {
    Fail ".env.example missing from the repo root. Cannot bootstrap .env.local."
  }
  Copy-Item .env.example .env.local
  Ok ".env.local created from .env.example"
  Ok "Edit it later if you want to change LLM_MODEL, SITE_NAME, etc."
}

# 4. Convex deployment - interactive
Write-Host ""
Write-Host "--- Convex setup ---" -ForegroundColor Magenta
Write-Host "Your chat UI needs a live Convex deployment. One manual step:"
Write-Host "  1. Open https://dashboard.convex.dev and create a new project."
Write-Host "  2. Copy the deployment URL - it looks like:"
Write-Host "     https://kind-animal-123.convex.cloud"
Write-Host "  3. Paste it below. (Press Enter to skip and set it up manually later.)"
Write-Host ""
$convexUrl = Read-Host "Convex deployment URL [Enter to skip]"
Write-Host ""

if ($convexUrl) {
  if ($convexUrl -notmatch '^https://.*\.convex\.(cloud|site)$') {
    Warn "URL does not match the usual Convex shape. Writing it anyway."
  }
  $content = Get-Content .env.local -Raw
  if ($content -match '(?m)^VITE_CONVEX_URL=.*') {
    $content = [regex]::Replace($content, '(?m)^VITE_CONVEX_URL=.*', "VITE_CONVEX_URL=$convexUrl")
  } else {
    $content += "`nVITE_CONVEX_URL=$convexUrl`n"
  }
  Set-Content -Path .env.local -Value $content -NoNewline
  Ok "VITE_CONVEX_URL written to .env.local"

  Step "Deploying backend (bunx convex dev --once)"
  try {
    & bunx convex dev --once
    Ok "Convex backend deployed"
  } catch {
    Warn "Convex deploy failed. Run it manually from the project root:"
    Warn "    bunx convex dev --once"
  }
} else {
  Warn "Skipped Convex setup. Set it up later with:"
  Warn "    1. Create a project at https://dashboard.convex.dev"
  Warn "    2. bunx convex dev --once"
  Warn "    3. Add VITE_CONVEX_URL=<url> to .env.local"
}

Write-Host ""
Write-Host "--- Install complete ---" -ForegroundColor Green
Write-Host ""
Write-Host "To start the dev server:"
Write-Host "    bun run dev" -ForegroundColor Cyan
Write-Host "    (or: powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1)"
Write-Host ""
Write-Host "Then open http://localhost:5173"
Write-Host ""

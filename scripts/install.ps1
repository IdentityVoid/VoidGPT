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

# 4. Setup wizard - handles Convex + OpenRouter auth in one interactive session.
#    Opens the browser to the relevant sign-up pages, prompts for the OpenRouter
#    key, and runs `bunx convex dev --once` for the backend.
Step "Running setup wizard (Convex + OpenRouter)"
Write-Host "  Opens the browser for the two required logins; you just paste an" -ForegroundColor DarkGray
Write-Host "  OpenRouter key when prompted. Idempotent - skips what is already done." -ForegroundColor DarkGray
Write-Host ""

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Warn "node not found. The setup wizard needs Node 22+. Skipping."
  Warn "After installing Node (https://nodejs.org), re-run: node scripts\setup-wizard.mjs"
} else {
  try {
    & node scripts\setup-wizard.mjs
    Ok "Setup wizard complete"
  } catch {
    Warn "Setup wizard exited non-zero. You can re-run it any time:"
    Warn "    node scripts\setup-wizard.mjs"
    Warn "    (or: bun run setup)"
  }
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

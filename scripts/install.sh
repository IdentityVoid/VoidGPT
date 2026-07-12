#!/usr/bin/env bash
# install.sh — One-click-ish installer for Void Coder on Linux and macOS.
#
# What it does, in order:
#   1. Detects Bun. Installs it via the official installer if missing.
#   2. Runs `bun install`.
#   3. Creates `.env.local` from `.env.example` (only if it doesn't already exist).
#   4. Runs scripts/setup-wizard.mjs, which handles Convex + OpenRouter auth
#      in one interactive session by opening the relevant browser pages and
#      prompting only for the OpenRouter key.
#   5. Prints "how to start the dev server" at the end.
#
# Run from the project root:  bash scripts/install.sh

set -euo pipefail

PINK='\033[1;35m'
CYAN='\033[1;36m'
GREEN='\033[1;32m'
RED='\033[1;31m'
DIM='\033[2m'
RESET='\033[0m'

step() { printf "${CYAN}==>${RESET} %s\n" "$1"; }
ok()   { printf "${GREEN}✓${RESET} %s\n" "$1"; }
warn() { printf "${PINK}!${RESET} %s\n" "$1"; }
fail() { printf "${RED}✗${RESET} %s\n" "$1"; exit 1; }

echo
echo -e "${PINK}Void Coder — installer${RESET}"
echo -e "${DIM}(this script needs network for: Bun install, npmjs.org, convex.dev, openrouter.ai)${RESET}"
echo

# 1. Bun detection / install
step "Checking for Bun"
if command -v bun >/dev/null 2>&1; then
  ok "Bun $(bun --version) found"
else
  step "Bun not found — installing via the official script"
  if ! command -v curl >/dev/null 2>&1; then
    fail "curl is required to install Bun. Install curl and re-run."
  fi
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  if ! command -v bun >/dev/null 2>&1; then
    fail "Bun not on PATH after install. Run: source $HOME/.bun/bin/activate (then re-run this script)."
  fi
  ok "Bun $(bun --version) installed"
fi

# 2. Install dependencies
step "Installing dependencies (bun install)"
bun install
ok "Dependencies installed"

# 3. .env.local
step "Creating .env.local"
if [ -f .env.local ]; then
  warn ".env.local already exists — leaving it alone (existing config preserved)"
else
  if [ ! -f .env.example ]; then
    fail ".env.example missing from the repo root. Cannot bootstrap .env.local."
  fi
  cp .env.example .env.local
  ok ".env.local created from .env.example"
  ok "Edit it later if you want to change LLM_MODEL, deploy's SITE_NAME, etc."
fi

# 4. Setup wizard — handles Convex + OpenRouter auth in one interactive session.
#    Opens the browser to the relevant sign-up pages, prompts for the OpenRouter
#    key, and runs `bunx convex dev --once` for the backend.
step "Running setup wizard (Convex + OpenRouter)"
echo -e "${DIM}  Opens the browser for the two required logins; you just paste an${RESET}"
echo -e "${DIM}  OpenRouter key when prompted. Idempotent — skips what is already done.${RESET}"
echo
if ! command -v node >/dev/null 2>&1; then
  warn "node not found. The setup wizard needs Node 22+. Skipping."
  warn "After installing Node (https://nodejs.org):  node scripts/setup-wizard.mjs"
else
  if node scripts/setup-wizard.mjs; then
    ok "Setup wizard complete"
  else
    warn "Setup wizard exited non-zero. You can re-run it any time:"
    warn "    node scripts/setup-wizard.mjs"
    warn "    (or: bun run setup)"
  fi
fi

echo
echo -e "${GREEN}--- Install complete ---${RESET}"
echo
echo -e "To start the dev server:"
echo -e "    ${CYAN}bun run dev${RESET}"
echo -e "    (or: bash scripts/dev.sh)"
echo
echo "Then open http://localhost:5173"
echo

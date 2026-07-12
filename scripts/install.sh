#!/usr/bin/env bash
# install.sh — One-click-ish installer for Void Coder on Linux and macOS.
#
# What it does, in order:
#   1. Detects Bun. Installs it via the official installer if missing.
#   2. Runs `bun install`.
#   3. Creates `.env.local` from `.env.example` (only if it doesn't already exist).
#   4. Prompts for a Convex deployment URL, writes it to `.env.local`,
#      and runs `bunx convex dev --once` to deploy the backend.
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
echo -e "${DIM}(this script needs network for: Bun install, npmjs.org, convex.dev)${RESET}"
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

# 4. Convex deployment — interactive
echo
echo -e "${PINK}--- Convex setup ---${RESET}"
echo "Your chat UI needs a live Convex deployment. There is one manual step:"
echo "  1. Open ${CYAN}https://dashboard.convex.dev${RESET} and create a new project."
echo "  2. Copy the deployment URL — it looks like:"
echo "     ${DIM}https://kind-animal-123.convex.cloud${RESET}"
echo "  3. Paste it below. (Press Enter to skip and set it up manually later.)"
echo
read -rp "Convex deployment URL [Enter to skip]: " CONVEX_URL
echo

if [ -n "${CONVEX_URL}" ]; then
  case "$CONVEX_URL" in
    https://*\.convex\.cloud|https://*\.convex\.site) ;;
    *) warn "URL doesn't match the usual Convex shape. Writing it anyway." ;;
  esac

  # Write or replace VITE_CONVEX_URL line in .env.local
  if grep -q "^VITE_CONVEX_URL=" .env.local; then
    sed -i.bak "s|^VITE_CONVEX_URL=.*|VITE_CONVEX_URL=${CONVEX_URL}|" .env.local
    rm -f .env.local.bak
  else
    printf "\nVITE_CONVEX_URL=%s\n" "$CONVEX_URL" >> .env.local
  fi
  ok "VITE_CONVEX_URL written to .env.local"

  step "Deploying backend (bunx convex dev --once)"
  if bunx convex dev --once; then
    ok "Convex backend deployed"
  else
    warn "Convex deploy failed. Run it manually from the project root:"
    warn "    bunx convex dev --once"
  fi
else
  warn "Skipped Convex setup. Set it up later with:"
  warn "    1. Create a project at https://dashboard.convex.dev"
  warn "    2. bunx convex dev --once"
  warn "    3. Add VITE_CONVEX_URL=<url> to .env.local"
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

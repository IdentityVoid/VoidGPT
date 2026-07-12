#!/usr/bin/env bash
# dev.sh — Start the dev server on Linux/macOS.
# Run from the project root:  bash scripts/dev.sh
#
# This is a thin wrapper around `bun run dev` with a friendlier banner and
# pass-through of Ctrl+C. If `bun` is missing on PATH, install it via
# scripts/install.sh or directly: https://bun.sh

set -euo pipefail

CYAN='\033[1;36m'
DIM='\033[2m'
RESET='\033[0m'

if ! command -v bun >/dev/null 2>&1; then
  printf "%s==>%s bun not found on PATH. Run scripts/install.sh first.\n" \
    "$CYAN" "$RESET" >&2
  exit 1
fi

printf "%s==>%s starting Vite dev server on http://localhost:5173\n" \
  "$CYAN" "$RESET"
printf "%s(count: Ctrl+C to stop)%s\n\n" "$DIM" "$RESET"

exec bun run dev

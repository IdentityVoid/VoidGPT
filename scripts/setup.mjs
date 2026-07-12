#!/usr/bin/env node
// scripts/setup.mjs — Cross-platform setup entry point.
//
// Run via:    bun run setup      (or:    npm run setup   /   node scripts/setup.mjs)
//
// Detects the host platform and spawns the matching installer:
//   - win32:   scripts/install.ps1
//   - linux / darwin: scripts/install.sh
//
// Forwards exit code. Works inside GitHub Actions, devcontainers, etc.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const platform = process.platform;
const isWin = platform === "win32";

const script = isWin
  ? resolve(root, "scripts/install.ps1")
  : resolve(root, "scripts/install.sh");

if (!existsSync(script)) {
  console.error(`[!] installer not found: ${script}`);
  process.exit(1);
}

let cmd, args;
if (isWin) {
  // Use PowerShell with -File so the script runs in a fresh process and stdin
  // reaches Read-Host properly.
  cmd = "powershell.exe";
  args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    script,
  ];
} else {
  cmd = "bash";
  args = [script];
}

const child = spawn(cmd, args, {
  stdio: "inherit",
  cwd: root,
  shell: false,
  windowsHide: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
child.on("error", (err) => {
  console.error(`[!] failed to spawn installer: ${err.message}`);
  process.exit(1);
});

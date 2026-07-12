#!/usr/bin/env node
/**
 * scripts/install-cli.mjs — install the compiled voidcoder CLI into a PATH-friendly location.
 *
 * Two targets, picked via prompt or flag:
 *   --user  -> ~/.local/bin/voidcoder (no sudo, recommended)
 *   --system -> /usr/local/bin/voidcoder (may need sudo)
 *
 * Default if neither flag is given: --user.
 *
 * Throws if the binary doesn't exist at bin/voidcoder (or bin/voidcoder.exe on Windows).
 */

import { existsSync, copyFileSync, mkdirSync, chmodSync, statSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join, resolve } from "node:path";
import { argv, env, platform, exit } from "node:process";

const args = argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));

if (flags.has("--help") || flags.has("-h")) {
  console.log(`usage: bun run cli:install [--user | --system]`);
  exit(0);
}

const wantSystem = flags.has("--system");
const wantUser = flags.has("--user") || (!wantSystem);

const isWin = platform === "win32";
const exeName = isWin ? "voidcoder.exe" : "voidcoder";

const sourceCandidates = [
  resolve(`bin/${exeName}`),
  resolve(`dist/${exeName}`),
];
const source = sourceCandidates.find((p) => existsSync(p));
if (!source) {
  console.error(`error: compiled CLI not found. look in bin/ or dist/. run first:`);
  console.error(`    bun run build:cli`);
  exit(1);
}

let target;
if (wantSystem) {
  target = isWin
    ? join(env.ProgramFiles || "C:\\Program Files", "voidcoder", exeName)
    : "/usr/local/bin/voidcoder";
} else {
  const userBin = isWin
    ? join(env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "Programs", "voidcoder")
    : join(homedir(), ".local", "bin");
  target = join(userBin, exeName);
}

try {
  mkdirSync(resolve(target, ".."), { recursive: true });
  copyFileSync(source, target);
  if (!isWin) chmodSync(target, 0o755);
} catch (err) {
  if (wantSystem && !isWin) {
    console.error(`error: ${err.message}`);
    console.error(`hint: try \`bun run cli:install --user\` instead — installs to ~/.local/bin without sudo.`);
    exit(1);
  }
  throw err;
}

const st = statSync(target);
console.log(`installed: ${target}  (${st.size} bytes)`);
if (!isWin) {
  const { PATH = "" } = env;
  const inPath = PATH.split(":").some((d) => resolve(target).startsWith(resolve(d)));
  if (!inPath) {
    const userBin = resolve(target, "..");
    console.log(`note: ${userBin} is not on PATH. add to your shell rc:`);
    console.log(`    export PATH="${userBin}:$PATH"`);
  } else {
    console.log(`note: ${userBin} is on PATH. try: \`voidcoder -v\``);
  }
} else {
  console.log(`note: on Windows, the binary is at \`${target}\`. Add its directory to PATH or run it directly.`);
}

const user = userInfo ? userInfo().username : "<user>";
console.log(`(current user: ${user}, install mode: ${wantSystem ? "system" : "user"}, platform: ${platform})`);

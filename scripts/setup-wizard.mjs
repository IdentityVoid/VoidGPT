#!/usr/bin/env node
/**
 * scripts/setup-wizard.mjs — terminal setup wizard for the Void Coder toolchain.
 *
 * What it does, in order:
 *   1. Skips if ~/.voidcoder/config.json already has BOTH a real deploymentUrl
 *      AND a real apiKey — just runs `voidcoder status` and exits.
 *   2. Otherwise figures out what is missing.
 *   3. For Convex (backend):
 *        - Runs `bunx convex dev --once` to deploy the schema/actions and
 *          print the deployment URL. Convex CLI handles its own browser
 *          auth/Creation flow.
 *        - Strips the URL out of the output (or from .env.local afterward)
 *          and writes it to ~/.voidcoder/config.json and .env.local.
 *   4. For OpenRouter (LLM access):
 *        - Cross-platform opens https://openrouter.ai/keys in the user's
 *          default browser.
 *        - readline-prompts "paste your sk-or-v1-... key" with sane validation.
 *        - Writes the key to ~/.voidcoder/config.json.
 *   5. Re-runs `voidcoder status` and reports.
 *
 * Designed to be called from scripts/install.sh, scripts/install.ps1, or directly:
 *     node scripts/setup-wizard.mjs
 *     bun run setup
 *
 * Idempotent: each step checks what's already configured before redoing work.
 */

import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { platform, env as processEnv } from "node:process";
import { createInterface } from "node:readline";

const execFileP = promisify(execFile);

// ───────────────────────────────────────────────────────────────────────
// Paths and constants
// ───────────────────────────────────────────────────────────────────────

const VOIDCODER_DIR = join(homedir(), ".voidcoder");
const CONFIG_PATH = join(VOIDCODER_DIR, "config.json");
const ENV_LOCAL_PATH = resolve(process.cwd(), ".env.local");
const REPO_ROOT = process.cwd();

const CONVEX_URL_REGEX = /https:\/\/[a-z0-9-]+\.convex\.(cloud|site)/g;
const OPENROUTER_KEY_REGEX = /^sk-or-(v1-)?[A-Za-z0-9_-]{16,}$/;

const PLACEHOLDER_PATTERNS = [
  "placeholder",
  "example.com",
  "your-deployment",
  "kind-animal",
];

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const C = {
  ok: (s) => `${ANSI.green}✓${ANSI.reset} ${s}`,
  warn: (s) => `${ANSI.yellow}!${ANSI.reset} ${s}`,
  err: (s) => `${ANSI.red}✗${ANSI.reset} ${s}`,
  step: (s) => `${ANSI.cyan}==>
${ANSI.reset}${s}`,
  dim: (s) => `${ANSI.dim}${s}${ANSI.reset}`,
  bold: (s) => `${ANSI.bold}${s}${ANSI.reset}`,
};

// ───────────────────────────────────────────────────────────────────────
// I/O helpers
// ───────────────────────────────────────────────────────────────────────

function openBrowser(url) {
  let cmd;
  let args;
  switch (platform) {
    case "darwin":
      cmd = "open";
      args = [url];
      break;
    case "win32":
      // cmd /c start "" <url>  (the empty quoted string is the window title)
      cmd = "cmd";
      args = ["/c", "start", '""', url];
      break;
    default:
      cmd = "xdg-open";
      args = [url];
  }
  try {
    const child = spawn(cmd, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", () => {});
    child.unref?.();
    return true;
  } catch {
    return false;
  }
}

function prompt(question) {
  return new Promise((resolvePrompt) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolvePrompt(answer.trim());
    });
  });
}

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  mkdirSync(VOIDCODER_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n");
}

function readEnvLocal() {
  if (!existsSync(ENV_LOCAL_PATH)) return {};
  const out = {};
  for (const line of readFileSync(ENV_LOCAL_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function writeEnvLocal(obj) {
  const lines = Object.entries(obj)
    .filter(([k]) => /^[A-Z_][A-Z0-9_]*$/.test(k))
    .map(([k, v]) => `${k}=${v}`);
  writeFileSync(ENV_LOCAL_PATH, lines.join("\n") + "\n");
}

function isPlaceholderUrl(u) {
  if (!u || typeof u !== "string") return true;
  if (!u.startsWith("https://")) return true;
  return PLACEHOLDER_PATTERNS.some((p) => u.toLowerCase().includes(p));
}

function pickConvexUrl(...sources) {
  for (const s of sources) {
    if (typeof s !== "string") continue;
    const m = s.match(/(https:\/\/[a-z0-9-]+\.convex\.(cloud|site))/);
    if (m) return m[1];
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────
// Step 1: Convex
// ───────────────────────────────────────────────────────────────────────

async function setupConvex(cfg) {
  if (!isPlaceholderUrl(cfg.deploymentUrl)) {
    C.ok(`Convex URL already set: ${cfg.deploymentUrl}`);
    return cfg.deploymentUrl;
  }

  C.step("Setting up the Convex backend (≈ 30 s)");
  console.log(
    C.dim(
      "  If you already have a Convex account, your browser will pop up\n" +
        "  to sign in. If you don't, the same page will guide you through\n" +
        "  a free account + project creation."
    )
  );
  console.log("");

  // Open the convex dashboard in the user's browser so the user can
  // sign in / sign up before convex dev asks them to.
  openBrowser("https://dashboard.convex.dev");
  C.dim(
    "  (browser opened — sign in / create a free project, then come back)"
  );
  await prompt("  press Enter when ready to deploy… ");

  if (!existsSync("package.json")) {
    C.err("No package.json in CWD. Run this from the project root.");
    process.exit(1);
  }

  // bunx convex dev --once handles: re-auth, create project if missing,
  // deploy schema/actions, print deployment URL.
  let stdout = "";
  let stderr = "";
  const exitCode = await new Promise((resolveExit) => {
    const child = spawn("bunx", ["convex", "dev", "--once"], {
      cwd: REPO_ROOT,
      stdio: ["inherit", "pipe", "pipe"],
    });
    child.stdout.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write(s);
    });
    child.on("exit", resolveExit);
  });

  // Look for URL in our captured output, the .env.local, and the convex.json
  const envLocal = readEnvLocal();
  const convexJson = existsSync(join(REPO_ROOT, "convex.json"))
    ? safeReadJson(join(REPO_ROOT, "convex.json"))
    : null;
  const candidates = [
    pickConvexUrl(stdout),
    pickConvexUrl(stderr),
    pickConvexUrl(convexJson?.deploymentUrl || ""),
    envLocal.CONVEX_DEPLOYMENT || envLocal.VITE_CONVEX_URL,
  ];
  const url = candidates.find((u) => u && u.startsWith("https://")) || null;

  if (exitCode !== 0 || !url) {
    C.err(
      "convex dev --once did not produce a deployment URL we could read.\n" +
        "  The two most common causes:\n" +
        "    - you closed the browser tab without signing in\n" +
        "    - you didn't create a project in the dashboard\n" +
        "  Run manually: bunx convex dev --once  (paste the URL it prints),\n" +
        "  then: voidcoder config set deploymentUrl=<that url>"
    );
    process.exit(1);
  }

  C.ok(`Convex backend deployed: ${url}`);
  saveConfig({ ...cfg, deploymentUrl: url });
  writeEnvLocal({ ...envLocal, VITE_CONVEX_URL: url });
  return url;
}

function safeReadJson(p) {
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Step 2: OpenRouter
// ───────────────────────────────────────────────────────────────────────

async function setupOpenRouter(cfg) {
  if (cfg.apiKey && cfg.apiKey.startsWith("sk-or")) {
    C.ok(`OpenRouter key already set (${cfg.apiKey.slice(0, 12)}…)`);
    return cfg.apiKey;
  }

  C.step("Setting up OpenRouter (LLM provider)");
  console.log(
    C.dim(
      "  Opening browser to https://openrouter.ai/keys — sign in or\n" +
        "  sign up (free), then click 'Create Key', copy it, and paste below."
    )
  );
  console.log("");
  openBrowser("https://openrouter.ai/keys");

  while (true) {
    const key = await prompt("  paste sk-or-v1-... key (or Enter to skip): ");
    if (!key) {
      C.warn(
        "skipped. chat will run with whatever the deployment allows.\n" +
          "         set later: voidcoder config set apiKey=sk-or-v1-..."
      );
      return null;
    }
    if (!OPENROUTER_KEY_REGEX.test(key)) {
      C.warn(
        `that doesn't look like a typical OpenRouter key (it should start with sk-or-). ` +
          `press Enter to skip, or try again.`
      );
      continue;
    }
    C.ok(`OpenRouter key saved (${key.slice(0, 12)}…)`);
    saveConfig({ ...cfg, apiKey: key });
    return key;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Step 3: Verify via voidcoder status
// ───────────────────────────────────────────────────────────────────────

async function verifyStatus() {
  C.step("Verifying with `voidcoder status`");
  await new Promise((resolveExit) => {
    const child = spawn("voidcoder", ["status"], {
      cwd: REPO_ROOT,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("exit", resolveExit);
  });
}

// ───────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log(C.bold("Void Coder — setup wizard"));
  console.log("");

  // 1. Make sure deps are installed.
  if (!existsSync(join(REPO_ROOT, "node_modules"))) {
    console.log(C.dim("node_modules missing — running bun install"));
    await new Promise((resolveExit) => {
      const child = spawn("bun", ["install"], {
        cwd: REPO_ROOT,
        stdio: "inherit",
        windowsHide: true,
      });
      child.on("exit", resolveExit);
    });
  }

  let cfg = readConfig();

  // 2. Short-circuit: if both are real values already, skip straight to verify.
  const needsConvex = isPlaceholderUrl(cfg.deploymentUrl);
  const needsOpenRouter = !cfg.apiKey || !cfg.apiKey.startsWith("sk-or");

  if (!needsConvex && !needsOpenRouter) {
    C.ok(`config looks complete: deploymentUrl + apiKey both set`);
  } else {
    console.log(C.dim("what is missing:"));
    console.log(
      `  deploymentUrl: ${
        needsConvex
          ? `${ANSI.yellow}not set or placeholder${ANSI.reset}`
          : `${ANSI.green}${cfg.deploymentUrl}${ANSI.reset}`
      }`
    );
    console.log(
      `  apiKey: ${
        needsOpenRouter
          ? `${ANSI.yellow}not set${ANSI.reset}`
          : `${ANSI.green}${cfg.apiKey.slice(0, 12)}…${ANSI.reset}`
      }`
    );
    console.log("");

    if (needsConvex) {
      try {
        const url = await setupConvex(cfg);
        cfg = { ...cfg, deploymentUrl: url };
      } catch (err) {
        C.err(`convex step failed: ${err.message ?? err}`);
        process.exit(1);
      }
      console.log("");
    }

    if (needsOpenRouter) {
      try {
        const key = await setupOpenRouter(cfg);
        cfg = { ...cfg, apiKey: key ?? cfg.apiKey };
      } catch (err) {
        C.err(`openrouter step failed: ${err.message ?? err}`);
        process.exit(1);
      }
      console.log("");
    }
  }

  // 3. Verify
  await verifyStatus();

  // 4. Final summary
  console.log("");
  const finalCfg = readConfig();
  const ready =
    !isPlaceholderUrl(finalCfg.deploymentUrl) &&
    finalCfg.apiKey &&
    finalCfg.apiKey.startsWith("sk-or");
  if (ready) {
    console.log(C.bold(C.ok("ready.")));
    console.log("");
    console.log("  run the web app:    bun run dev");
    console.log("                      open http://localhost:5173");
    console.log("");
    console.log("  or use the CLI:      voidcoder chat \"your prompt here\"");
    console.log("                      voidcoder analyze src/lib/api.ts");
  } else {
    console.log(C.warn("partially set up. re-run this script when ready,"));
    console.log(C.warn("or set values manually:"));
    console.log("    voidcoder config set deploymentUrl=https://your-deployment.convex.cloud");
    console.log("    voidcoder config set apiKey=sk-or-v1-...");
  }
  console.log("");
}

main().catch((err) => {
  console.error(`${ANSI.red}fatal:${ANSI.reset} ${err.stack ?? err}`);
  process.exit(1);
});

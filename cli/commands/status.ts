/**
 * cli/commands/status.ts — diagnostic report.
 *
 * Runs five checks and prints a red/amber/green board with copy-pasteable
 * fixes. Exit code: 0 if everything is green, 0 if warns only, 1 if anything
 * failed.
 *
 * Checks:
 *   1. config file present
 *   2. deploymentUrl present + reachable (HEAD against the deploy URL)
 *   3. OpenRouter key present + valid (GET /api/v1/auth/key, no quota cost)
 *   4. model resolves to a real OpenRouter catalog id (GET /api/v1/models)
 *   5. system prompt present (informational)
 *
 * Optional flags:
 *   --no-fetch     skip the network checks, just report local config state
 */

import { existsSync, statSync } from "node:fs";
import { loadConfig, CONFIG_PATHS, defaultModel, defaultSystemPrompt } from "../config";
import { red, green, dim, cyan, bold, yellow } from "../lib/render";

type Status = "ok" | "warn" | "fail";

const SYMBOL: Record<Status, string> = {
  ok: green("✓"),
  warn: yellow("!"),
  fail: red("✗"),
};

interface CheckResult {
  name: string;
  status: Status;
  detail: string;
  fix?: string;
}

interface StatusOptions {
  noFetch: boolean;
}

export async function statusCommand(args: string[]): Promise<number> {
  const options: StatusOptions = { noFetch: args.includes("--no-fetch") };

  console.log("");
  console.log(`${bold("voidcoder status")}  ${dim("diagnostics")}`);
  if (options.noFetch) console.log(dim("(local config only — network checks skipped)"));
  console.log("");

  const cfg = loadConfig();
  const checks: CheckResult[] = [];

  // 1. config file
  const fileMissing = !existsSync(CONFIG_PATHS.file);
  checks.push({
    name: "config file",
    status: fileMissing ? "warn" : "ok",
    detail: fileMissing
      ? `${dim(CONFIG_PATHS.file)}  ${dim("(first run — write values below)")}`
      : `${dim(CONFIG_PATHS.file)}  ${dim(formatBytes(statSync(CONFIG_PATHS.file).size))}`,
    fix: fileMissing ? "the `set` steps below will create it" : undefined,
  });

  // 2. deploymentUrl — present + reachable
  if (!cfg.deploymentUrl) {
    checks.push({
      name: "deploymentUrl",
      status: "fail",
      detail: "not set",
      fix: "voidcoder config set deploymentUrl=https://your-deployment.convex.cloud",
    });
  } else if (options.noFetch) {
    checks.push({
      name: "deploymentUrl",
      status: "ok",
      detail: cfg.deploymentUrl,
    });
  } else {
    const reach = await pingDeployment(cfg.deploymentUrl);
    checks.push(reach);
  }

  // 3. OpenRouter key — present + valid (cheaper than a chat completion)
  if (!cfg.apiKey) {
    checks.push({
      name: "OpenRouter key",
      status: "warn",
      detail: "not set",
      fix: "voidcoder config set apiKey=sk-or-v1-...  (free tier requires an account)",
    });
  } else if (options.noFetch) {
    checks.push({
      name: "OpenRouter key",
      status: "ok",
      detail: `${dim("set")} ${dim(`(${cfg.apiKey.slice(0, 8)}…)`)}`,
    });
  } else {
    checks.push(await checkOpenRouterKey(cfg.apiKey));
  }

  // 4. model resolvable in OpenRouter catalog
  const modelId = cfg.model ?? defaultModel();
  if (!cfg.apiKey && !options.noFetch) {
    checks.push({
      name: "model resolvable",
      status: "warn",
      detail: `${modelId}  ${dim("(skipped — no apiKey)")}`,
      fix: "set apiKey to verify the model id against OpenRouter's catalog",
    });
  } else if (options.noFetch) {
    checks.push({
      name: "model resolvable",
      status: "ok",
      detail: modelId,
    });
  } else {
    checks.push(await resolveModel(modelId, cfg.apiKey));
  }

  // 5. system prompt (informational)
  const sys = cfg.systemPrompt ?? "(bundled senior-engineer prompt — see cli/config.ts)";
  const preview = sys.length > 60 ? `${sys.slice(0, 60)}…` : sys;
  checks.push({
    name: "system prompt",
    status: "ok",
    detail: `${dim(`${sys.length} chars`)}  ${dim(preview)}`,
  });

  // Render the report
  const nameWidth = Math.max(...checks.map((c) => c.name.length)) + 2;
  for (const c of checks) {
    console.log(`  ${SYMBOL[c.status]}  ${bold(c.name.padEnd(nameWidth))}  ${c.detail}`);
    if (c.fix) {
      console.log(`     ${dim("→")} ${cyan(c.fix)}`);
    }
  }
  console.log("");

  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  const oks = checks.filter((c) => c.status === "ok").length;
  const summary =
    `${bold("summary")}  ${green(`${oks} ok`)}  ` +
    (warns > 0 ? yellow(`${warns} warn`) : dim(`${warns} warn`)) +
    "  " +
    (fails > 0 ? red(`${fails} fail`) : dim(`${fails} fail`));
  console.log(summary);
  console.log("");

  if (fails > 0) {
    console.log(red("not ready. fix the red items above, then re-run `voidcoder status`."));
    return 1;
  }
  if (warns > 0) {
    console.log(yellow("ready with caveats. chat will fall back to anonymous OpenRouter access (rate-limited) until the warning resolves."));
  } else {
    console.log(green("ready. run: voidcoder chat \"your prompt here\""));
  }
  return 0;
}

// ───────────────────────────────────────────────────────────────────────
// Individual checks
// ───────────────────────────────────────────────────────────────────────

async function pingDeployment(url: string): Promise<CheckResult> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
      redirect: "manual",
    });
    // 2xx, 3xx, even a 405 from a Convex router = reachable. 5xx = "URL reachable but the
    // service broke". 0 = opaque redirect, also reachable.
    if (res.status >= 200 && res.status < 500) {
      return { name: "deploymentUrl", status: "ok", detail: `${url}  ${dim("(reachable)")}` };
    }
    return {
      name: "deploymentUrl",
      status: "fail",
      detail: `${url}  ${dim(`HTTP ${res.status}`)}`,
      fix: "the URL is reachable but the deployment returned an error. re-run `bunx convex dev --once` on your project.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      name: "deploymentUrl",
      status: "fail",
      detail: `${url}  ${dim("unreachable: " + msg)}`,
      fix: "verify the URL, your network, or that the deployment has been started with `bunx convex dev --once`.",
    };
  }
}

async function checkOpenRouterKey(apiKey: string): Promise<CheckResult> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        name: "OpenRouter key",
        status: "fail",
        detail: `HTTP ${res.status}  ${dim(body.slice(0, 80))}`,
        fix: "the key may be revoked or expired — create a new one at https://openrouter.ai → Keys.",
      };
    }
    const data = (await res.json().catch(() => ({}))) as {
      data?: { label?: string; limit?: number | null; usage?: number; free?: boolean };
    };
    const label = data?.data?.label ?? "anonymous";
    const limit = data?.data?.limit;
    const usage = data?.data?.usage ?? 0;
    const isFree = data?.data?.free;
    let credit = "";
    if (typeof limit === "number") {
      credit = dim(`(credit $${((limit - usage) / 100).toFixed(2)} of $${(limit / 100).toFixed(2)})`);
    } else if (isFree) {
      credit = dim(`(free tier)`);
    }
    return {
      name: "OpenRouter key",
      status: "ok",
      detail: `${dim(apiKey.slice(0, 12) + "…")}  ${dim("·")}  ${label}  ${credit}`,
    };
  } catch (err) {
    return {
      name: "OpenRouter key",
      status: "fail",
      detail: `couldn't reach openrouter.ai  ${dim("(" + (err instanceof Error ? err.message : String(err)) + ")")}`,
      fix: "check your network.",
    };
  }
}

async function resolveModel(modelId: string, apiKey: string | undefined): Promise<CheckResult> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        name: "model resolvable",
        status: "warn",
        detail: `${modelId}  ${dim(`(couldn't query OpenRouter, HTTP ${res.status})`)}`,
        fix: "the model name will be sent as-is to /v1/chat/completions; check spelling if chat fails.",
      };
    }
    const data = (await res.json()) as { data?: { id: string }[] };
    const ids = (data?.data ?? []).map((m) => m.id);
    if (ids.includes(modelId)) {
      return { name: "model resolvable", status: "ok", detail: `${modelId}  ${dim("(found in OpenRouter catalog)")}` };
    }
    const close = ids.find((id) => id.toLowerCase().includes(modelId.toLowerCase().split(":")[0]));
    if (close) {
      return {
        name: "model resolvable",
        status: "warn",
        detail: `${modelId}  ${dim(`(not in catalog — did you mean: ${close}?)`)}`,
        fix: `voidcoder config set model=${close}`,
      };
    }
    return {
      name: "model resolvable",
      status: "fail",
      detail: `${modelId}  ${dim("(not found in OpenRouter catalog)")}`,
      fix: "pick a different LLM_MODEL — see https://openrouter.ai/models",
    };
  } catch (err) {
    return {
      name: "model resolvable",
      status: "warn",
      detail: `${modelId}  ${dim("(network error during catalog query)")}`,
    };
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

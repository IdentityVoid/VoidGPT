/**
 * cli/commands/config.ts — show / set ~/.voidcoder/config.json values.
 *
 *   voidcoder config show
 *   voidcoder config set deploymentUrl=https://xxx.convex.cloud
 *   voidcoder config set apiKey=sk-or-v1-...
 *   voidcoder config set model=qwen/qwen-2.5-coder-32b-instruct
 *   voidcoder config set systemPrompt="..."
 *   voidcoder config unset model
 */

import { CONFIG_PATHS, loadConfig, saveConfig, type CliConfig } from "../config";
import { dim, cyan, bold, red } from "../lib/render";

const VALID_KEYS = new Set([
  "deploymentUrl",
  "apiKey",
  "model",
  "systemPrompt",
]);

export async function configCommand(args: string[]): Promise<void> {
  const sub = args[0];

  if (sub === "show" || sub === undefined) {
    const cfg = loadConfig();
    const redacted: Record<string, string | undefined> = {
      deploymentUrl: cfg.deploymentUrl,
      apiKey: cfg.apiKey ? `${cfg.apiKey.slice(0, 8)}…${cfg.apiKey.slice(-4)}` : undefined,
      model: cfg.model,
      systemPrompt: cfg.systemPrompt ? `${cfg.systemPrompt.length} chars` : undefined,
    };
    console.log("");
    console.log(`${bold("config")}  ${dim(CONFIG_PATHS.file)}`);
    console.log(JSON.stringify(redacted, null, 2));
    console.log("");
    return;
  }

  if (sub === "set") {
    const pairs = args.slice(1);
    if (pairs.length === 0) {
      console.log(`${cyan("usage:")} voidcoder config set key=value [key=value ...]`);
      return;
    }
    const cfg = loadConfig();
    for (const pair of pairs) {
      const eq = pair.indexOf("=");
      if (eq <= 0) {
        process.stderr.write(`${red("error:")} expected key=value, got: ${pair}\n`);
        process.exit(1);
      }
      const key = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (!VALID_KEYS.has(key)) {
        process.stderr.write(`${red("error:")} unknown key: ${key} (allowed: ${[...VALID_KEYS].join(", ")})\n`);
        process.exit(1);
      }
      (cfg as Record<string, string>)[key] = value;
    }
    saveConfig(cfg);
    console.log(dim(`saved to ${CONFIG_PATHS.file}`));
    console.log(JSON.stringify(stripApiKey(cfg), null, 2));
    return;
  }

  if (sub === "unset") {
    const key = args[1];
    if (!key || !VALID_KEYS.has(key)) {
      process.stderr.write(`${red("error:")} usage: voidcoder config unset <key>\n`);
      process.exit(1);
    }
    const cfg = loadConfig();
    delete (cfg as Record<string, string | undefined>)[key];
    saveConfig(cfg);
    console.log(dim(`cleared ${key}`));
    return;
  }

  if (sub === "path") {
    console.log(CONFIG_PATHS.file);
    return;
  }

  console.log(`${cyan("usage:")}`);
  console.log(`  voidcoder config show                    show current config (apiKey redacted)`);
  console.log(`  voidcoder config set key=value ...       set config values`);
  console.log(`  voidcoder config unset <key>             remove a key`);
  console.log(`  voidcoder config path                    print config file path`);
}

function stripApiKey(cfg: CliConfig): Record<string, string | undefined> {
  return {
    deploymentUrl: cfg.deploymentUrl,
    apiKey: cfg.apiKey ? `${cfg.apiKey.slice(0, 8)}…${cfg.apiKey.slice(-4)}` : undefined,
    model: cfg.model,
    systemPrompt: cfg.systemPrompt,
  };
}

/**
 * cli/config.ts — load/save the CLI's config from ~/.voidcoder/config.json.
 *
 * Schema:
 *   {
 *     "deploymentUrl": "<Convex deployment base URL>",
 *     "apiKey": "<OpenRouter key, optional>",
 *     "model": "<default model id, optional>",
 *     "systemPrompt": "<override bundled system prompt, optional>"
 *   }
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

export interface CliConfig {
  deploymentUrl?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
}

const CONFIG_DIR = join(homedir(), ".voidcoder");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export const CONFIG_PATHS = { dir: CONFIG_DIR, file: CONFIG_PATH };

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as CliConfig) : {};
  } catch {
    return {};
  }
}

export function saveConfig(cfg: CliConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n");
}

export function requireDeploymentUrl(): string {
  const { deploymentUrl } = loadConfig();
  if (!deploymentUrl) {
    throw new Error(
      `no deployment URL configured. run:\n` +
        `    voidcoder config set deploymentUrl=https://your-deployment.convex.cloud`
    );
  }
  return deploymentUrl.replace(/\/+$/, "");
}

export function defaultModel(): string {
  return loadConfig().model ?? "qwen/qwen-2.5-coder-32b-instruct";
}

export function defaultSystemPrompt(): string {
  return (
    loadConfig().systemPrompt ??
    "You are a senior software engineer. Lead with code that runs, prose only when it explains something non-obvious."
  );
}

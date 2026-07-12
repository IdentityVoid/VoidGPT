/**
 * cli/commands/chat.ts — chat command.
 *
 * Two modes:
 *   - One-shot: `voidcoder chat "fix this regex"`, prints response.
 *   - REPL:    `voidcoder chat` (no args), drops into a readline prompt with
 *              /help, /clear, /model, /quit and persistent history.
 */

import * as readline from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { callChat } from "../lib/api";
import { renderResponse, dim, cyan, bold, red } from "../lib/render";
import { defaultModel, loadConfig } from "../config";

interface ChatOptions {
  interactive: boolean;
}

export async function chatCommand(args: string[], opts: ChatOptions): Promise<void> {
  const prompt = args.join(" ").trim();

  if (prompt.length > 0) {
    await runOneShot(prompt);
    return;
  }

  // No prompt and no --interactive requested
  if (!opts.interactive) {
    console.log(`usage: voidcoder chat "<prompt>"   (omit prompt to start REPL)`);
    console.log(`       voidcoder chat              (start REPL)`);
    return;
  }

  await runRepl();
}

async function runOneShot(prompt: string): Promise<void> {
  process.stdout.write(dim(`${defaultModel()}  thinking…\n`));
  try {
    const res = await callChat({ prompt });
    process.stdout.write("\n" + renderResponse(res.content) + "\n");
  } catch (err) {
    process.stderr.write(`${red("error:")} ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

async function runRepl(): Promise<void> {
  const historyPath = join(homedir(), ".voidcoder", "history");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: `${cyan("›")} `,
  });

  // Load history (readline history is a "private" field; we type-cast to bypass)
  if (existsSync(historyPath)) {
    try {
      const lines = readFileSync(historyPath, "utf-8").split("\n").filter(Boolean);
      // @ts-expect-error readline history is unofficial
      rl.history = lines;
    } catch {
      /* ignore */
    }
  }

  console.log("");
  console.log(`${bold("voidcoder")}  ${dim(defaultModel())}  ${dim("(type /help, /quit to exit)")}`);
  console.log("");

  let isOpen = true;
  rl.on("close", () => {
    isOpen = false;
    saveHistory(rl, historyPath);
    console.log("");
    console.log(dim("bye."));
    process.exit(0);
  });

  rl.prompt();

  rl.on("line", async (raw) => {
    if (!isOpen) return;
    const line = raw.trim();

    if (line === "/quit" || line === "/exit") {
      rl.close();
      return;
    }

    if (line === "/help") {
      printReplHelp();
      rl.prompt();
      return;
    }

    if (line === "/clear") {
      process.stdout.write("\x1b[2J\x1b[H");
      rl.prompt();
      return;
    }

    if (line === "/model") {
      console.log(dim(`current model: ${defaultModel()}`));
      console.log(dim(`set with: voidcoder config set model=<id>`));
      rl.prompt();
      return;
    }

    if (line === "/config") {
      const cfg = loadConfig();
      const filtered: Record<string, string> = {};
      if (cfg.deploymentUrl) filtered.deploymentUrl = cfg.deploymentUrl;
      if (cfg.apiKey) filtered.apiKey = cfg.apiKey.replace(/(.{8}).+(.{4})/, "$1…$2");
      if (cfg.model) filtered.model = cfg.model;
      console.log(JSON.stringify(filtered, null, 2));
      rl.prompt();
      return;
    }

    if (line.length === 0) {
      rl.prompt();
      return;
    }

    process.stdout.write(dim("thinking…\n"));
    try {
      const res = await callChat({ prompt: line });
      process.stdout.write("\n" + renderResponse(res.content) + "\n\n");
    } catch (err) {
      process.stderr.write(`${red("error:")} ${err instanceof Error ? err.message : String(err)}\n\n`);
    }

    if (isOpen) rl.prompt();
  });
}

function saveHistory(rl: readline.Interface, historyPath: string): void {
  try {
    mkdirSync(join(homedir(), ".voidcoder"), { recursive: true });
    // @ts-expect-error readline history is unofficial
    const lines = (rl.history ?? []).join("\n");
    writeFileSync(historyPath, lines + "\n");
  } catch {
    /* ignore */
  }
}

function printReplHelp(): void {
  console.log("");
  console.log(`${bold("in-repl commands")}:`);
  console.log(`  ${cyan("/help")}    show this`);
  console.log(`  ${cyan("/model")}   show current model`);
  console.log(`  ${cyan("/config")}  show config (api key redacted)`);
  console.log(`  ${cyan("/clear")}   clear screen`);
  console.log(`  ${cyan("/quit")}    exit (or Ctrl+D)`);
  console.log(`  any other line is sent as a prompt`);
  console.log("");
}

#!/usr/bin/env bun
/**
 * cli/index.ts — entry point for the Void Coder CLI.
 *
 * Compiled to a single binary via `bun build --compile`. Routes to subcommands:
 *   - chat     one-shot or interactive REPL
 *   - analyze  file → structured code review
 *   - config   show / set ~/.voidcoder/config.json
 *   - help     usage
 *
 * With no subcommand, falls into the chat REPL.
 */

import { parseArgs } from "node:util";
import { helpCommand } from "./commands/help";
import { configCommand } from "./commands/config";
import { chatCommand } from "./commands/chat";
import { analyzeCommand } from "./commands/analyze";

const VERSION = "0.1.0";

const args = parseArgs({
  options: {
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
  },
  allowPositionals: true,
  strict: false,
});

if (args.values.version) {
  console.log(`voidcoder ${VERSION}`);
  process.exit(0);
}

if (args.values.help) {
  helpCommand();
  process.exit(0);
}

const cmd = args.positionals[0];

try {
  switch (cmd) {
    case undefined:
    case "repl":
    case "interactive":
      await chatCommand([], { interactive: true });
      break;
    case "chat":
      await chatCommand(args.positionals.slice(1), { interactive: false });
      break;
    case "analyze":
    case "review":
      await analyzeCommand(args.positionals.slice(1));
      break;
    case "config":
      await configCommand(args.positionals.slice(1));
      break;
    case "help":
      helpCommand();
      break;
    default:
      console.error(`unknown command: ${cmd}`);
      console.error("run: voidcoder help");
      process.exit(1);
  }
} catch (err) {
  console.error(`fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

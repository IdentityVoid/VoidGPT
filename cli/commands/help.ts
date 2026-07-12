/**
 * cli/commands/help.ts — usage text.
 */

import { cyan, bold, dim } from "../lib/render";

export function helpCommand(): void {
  console.log(`
${bold("voidcoder")} — terminal interface to the same Convex backend as the web app.

${bold("usage")}:
  ${cyan("voidcoder")}                              start interactive REPL
  ${cyan("voidcoder chat")} "<prompt>"              one-shot prompt → response
  ${cyan("voidcoder analyze")} <file>               structured code review on a file
  ${cyan("voidcoder config")} show|set|unset|path   manage ~/.voidcoder/config.json
  ${cyan("voidcoder -h")}                           this text
  ${cyan("voidcoder -v")}                           version

${bold("first-time setup")}:
  ${dim("voidcoder config set deploymentUrl=https://your-deployment.convex.cloud")}
  ${dim("voidcoder config set apiKey=sk-or-v1-...")}   ${dim("# optional, raises rate limits")}
  ${dim("voidcoder chat \"write a postgres upsert\"")}

${bold("config keys")}:
  deploymentUrl   ${dim("required. base url of your Convex deployment.")}
  apiKey          ${dim("optional. OpenRouter key passed as Bearer to /v1.")}
  model           ${dim("optional. defaults to qwen/qwen-2.5-coder-32b-instruct.")}
  systemPrompt    ${dim("optional. defaults to a senior-engineer prompt.")}
  ${dim("config file: ~/.voidcoder/config.json")}

${bold("in REPL")}:
  ${cyan("/help")}    show REPL commands
  ${cyan("/model")}   print current model
  ${cyan("/config")}  print current config (api key redacted)
  ${cyan("/clear")}   clear screen
  ${cyan("/quit")}    exit  ${dim("(also Ctrl+D)")}
  any other line is sent as a prompt.
`);
}

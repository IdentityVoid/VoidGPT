/**
 * cli/commands/analyze.ts — code review for a file.
 *
 * Reads the file, infers language from extension, posts to the deployment's
 * /v1/chat/completions endpoint with a senior-engineer system prompt, and
 * prints the structured review.
 */

import { existsSync, readFileSync } from "node:fs";
import { callChat } from "../lib/api";
import { renderResponse, dim, red } from "../lib/render";

const REVIEW_SYSTEM_PROMPT = `You are a senior code reviewer and security engineer.

Given a code snippet, return a structured analysis with these sections:

1. **Bugs / correctness** — off-by-one, unhandled nulls, missing edge cases, wrong types.
2. **Security** — injection (SQL, command, template), authz/authn gaps, deserialization, secrets in code, weak crypto, missing input validation. Be concrete about exploit scenarios.
3. **Performance** — algorithmic complexity, unnecessary allocations, hot-path I/O.
4. **Readability / style** — naming, structure, idiomatic patterns for the language.
5. **Suggested patches** — concrete code blocks fixing the most important issues.

Be specific. Use bullet lists. Reference line numbers or function names where possible. Skip filler like "this is a nice function". If anything is fine in a section, say so in one line and move on.`;

const LANG_BY_EXT: Record<string, string> = {
  ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
  py: "python", rb: "ruby", go: "go", rs: "rust",
  java: "java", cpp: "cpp", c: "c", cs: "csharp",
  php: "php", swift: "swift", kt: "kotlin", sh: "bash",
  sql: "sql", html: "html", css: "css", json: "json",
  yaml: "yaml", yml: "yaml", md: "markdown", toml: "toml",
  vue: "vue", svelte: "svelte",
};

export async function analyzeCommand(args: string[]): Promise<void> {
  const target = args[0];
  if (!target) {
    console.log("usage: voidcoder analyze <file>");
    return;
  }

  if (!existsSync(target)) {
    process.stderr.write(`${red("error:")} file not found: ${target}\n`);
    process.exit(1);
  }

  let code: string;
  try {
    code = readFileSync(target, "utf-8");
  } catch (err) {
    process.stderr.write(`${red("error:")} failed to read ${target}: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }

  const lang = inferLanguage(target);
  const prompt = `Language: ${lang}\nFile: ${target}\n\n\`\`\`${lang}\n${code}\n\`\`\``;

  process.stdout.write(dim(`reviewing ${target} (${lang}, ${code.length} chars)…\n`));
  try {
    const res = await callChat({ prompt, systemPrompt: REVIEW_SYSTEM_PROMPT });
    process.stdout.write("\n" + renderResponse(res.content) + "\n");
  } catch (err) {
    process.stderr.write(`${red("error:")} ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

function inferLanguage(path: string): string {
  const m = path.match(/\.([^.]+)$/);
  const ext = m?.[1]?.toLowerCase();
  if (!ext) return "text";
  return LANG_BY_EXT[ext] ?? ext;
}

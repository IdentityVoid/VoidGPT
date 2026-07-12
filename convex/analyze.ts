"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { callOpenRouter } from "./lib/openrouter";

const MODEL = process.env.LLM_MODEL ?? "qwen/qwen-2.5-coder-32b-instruct";

/**
 * Senior code reviewer prompt used by the /analyze route. Issues a structured
 * report on bugs, security, performance, readability, and suggested patches.
 */
const ANALYSIS_SYSTEM_PROMPT = `You are a senior code reviewer and security engineer.

Given a code snippet, return a structured analysis in this order:

1. **Bugs / correctness** — anything likely broken, off-by-one errors, unhandled nulls, missing edge cases.
2. **Security** — injection (SQL, command, template), authz/authn gaps, deserialization, secrets in code, weak crypto, missing input validation. Reference line numbers when possible.
3. **Performance** — algorithmic complexity, unnecessary allocations, N+1 hot paths, blocking I/O.
4. **Readability / style** — naming, structure, idiomatic patterns for the language.
5. **Suggested patches** — concrete code blocks fixing the most important issues. Include only the fixes that matter, not nits.

Be specific and concise. Prefer bullet lists over prose. Reference line numbers or function names where possible.`;

const FOCUS_PRESETS: Record<string, string> = {
  bugs: "Focus especially on bugs and correctness. Trim the security/performance/style sections to only critical findings.",
  security: "Focus especially on security. Call out concrete exploit scenarios for any vulnerability found.",
  performance: "Focus especially on performance. Include big-O analysis, hot paths, and concurrency concerns.",
  style: "Focus especially on readability, idiomatic patterns, and naming. Structural improvements are welcome.",
  all: "Cover all five areas with roughly equal weight.",
};

export const analyzeCode = action({
  args: {
    code: v.string(),
    language: v.optional(v.string()),
    focus: v.optional(v.string()),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{ ok: boolean; content?: string; error?: string }> => {
    try {
      const focus = args.focus ?? "all";
      const preset = FOCUS_PRESETS[focus] ?? FOCUS_PRESETS["all"];
      const sys = `${ANALYSIS_SYSTEM_PROMPT}\n\nFocus adjustment for this analysis: ${preset}`;

      const userContent = args.language
        ? `Language: ${args.language}\n\n\`\`\`${args.language}\n${args.code}\n\`\`\``
        : `\`\`\`\n${args.code}\n\`\`\``;

      const reply = await callOpenRouter({
        model: MODEL,
        systemPrompt: sys,
        messages: [{ role: "user", content: userContent }],
      });
      return { ok: true, content: reply };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

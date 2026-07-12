/**
 * cli/lib/render.ts — minimal ANSI renderer for model output.
 *
 * Detects fenced code blocks (with optional language tag), inline backtick
 * spans, bold, and italic. Doesn't try to do per-language syntax highlighting
 * inside code blocks — that'd need a heavy dep. Comments and keyword tinting
 * are out of scope for the MVP.
 */

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const ITAL = "\x1b[3m";
const UNDER = "\x1b[4m";

const FG_CYAN = "\x1b[36m";
const FG_DIM = "\x1b[90m";

const BG_CODE = "\x1b[48;5;236m";

export function renderResponse(text: string): string {
  if (!text) return "";

  // Strip a leading BOM if present
  let out = text.replace(/^\uFEFF/, "");

  // Fenced code blocks
  out = out.replace(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const label = lang ? lang : "code";
    const trimmed = code.replace(/\n$/, "");
    return `\n${BG_CODE}${FG_DIM}  ${label}  ${RESET}\n${BG_CODE}${DIM}${trimmed}${RESET}\n${BG_CODE}${FG_DIM}        ${RESET}\n`;
  });

  // Inline code
  out = out.replace(/`([^`\n]+)`/g, (_match, code) => `${FG_CYAN}${code}${RESET}`);

  // Bold
  out = out.replace(/\*\*([^*\n]+)\*\*/g, (_match, t) => `${BOLD}${t}${RESET}`);
  // Italic
  out = out.replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, (_match, pre, t, post) => `${pre}${ITAL}${t}${RESET}${post}`);

  // Underlined "headers" — markdown # at line start
  out = out.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes: string, t: string) => {
    const lvl = hashes.length;
    return `${BOLD}${UNDER}${" ".repeat(0)}${t}${RESET}`;
  });

  return out;
}

export function dim(s: string): string {
  return `${DIM}${s}${RESET}`;
}

export function bold(s: string): string {
  return `${BOLD}${s}${RESET}`;
}

export function cyan(s: string): string {
  return `${FG_CYAN}${s}${RESET}`;
}

export function red(s: string): string {
  return `\x1b[31m${s}${RESET}`;
}

export function green(s: string): string {
  return `\x1b[32m${s}${RESET}`;
}

export function yellow(s: string): string {
  return `\x1b[33m${s}${RESET}`;
}

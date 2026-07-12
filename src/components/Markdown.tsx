import type { ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";

interface MarkdownProps {
  content: string;
}

type Block =
  | { type: "code"; lang?: string; text: string }
  | { type: "text"; text: string };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const regex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", text: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: "code",
      lang: match[1] || undefined,
      text: match[2],
    });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    blocks.push({ type: "text", text: content.slice(lastIndex) });
  }
  return blocks;
}

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /`([^`\n]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={`t${key++}`} className="whitespace-pre-wrap">
          {text.slice(last, m.index)}
        </span>
      );
    }
    parts.push(
      <code
        key={`c${key++}`}
        className="rounded bg-secondary/70 px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
      >
        {m[1]}
      </code>
    );
    last = regex.lastIndex;
  }
  if (last < text.length) {
    parts.push(
      <span key={`t${key++}`} className="whitespace-pre-wrap">
        {text.slice(last)}
      </span>
    );
  }
  return parts;
}

export function Markdown({ content }: MarkdownProps): ReactNode {
  const blocks = parseBlocks(content);
  return (
    <div className="text-sm leading-relaxed">
      {blocks.map((b, i) =>
        b.type === "code" ? (
          <CodeBlock key={i} language={b.lang} code={b.text.replace(/\n$/, "")} />
        ) : (
          <div key={i}>{renderInline(b.text)}</div>
        )
      )}
    </div>
  );
}

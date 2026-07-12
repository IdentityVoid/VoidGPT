import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "~convex/_generated/api";
import type { Id } from "~convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "./Markdown";
import { Send, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: Id<"conversations">;
}

type ChatMessage = {
  _id: string;
  _creationTime: number;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export function ChatWindow({ conversationId }: ChatWindowProps): ReactNode {
  const messages = useQuery(api.messages.listForConversation, {
    conversationId,
  }) as ChatMessage[] | undefined;
  const sendMessage = useAction(api.chat.sendMessage);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    setDraft("");
    try {
      const result = await sendMessage({ conversationId, content });
      if (!result.ok) {
        setError(result.error ?? "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6">
        {!messages || messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((m) => (
              <div
                key={m._id}
                className={cn(
                  "flex animate-fade-in gap-3",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role === "assistant" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-lg px-4 py-3",
                    m.role === "user"
                      ? "bg-primary/15 text-foreground"
                      : "bg-card text-foreground/90"
                  )}
                >
                  <Markdown content={m.content} />
                </div>
                {m.role === "user" && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}
            {sending && <TypingIndicator />}
            {error && (
              <div className="mx-auto max-w-3xl rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border/60 bg-background/80 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything — paste code, share an error, or describe what to build..."
              rows={3}
              disabled={sending}
              className="resize-none border-0 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
              <span className="text-[11px] text-muted-foreground">
                <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> send ·{" "}
                <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> newline
              </span>
              <Button onClick={handleSend} disabled={sending || !draft.trim()} size="sm">
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator(): ReactNode {
  return (
    <div className="flex animate-fade-in gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
        <Bot className="h-4 w-4 animate-pulse" />
      </span>
      <div className="rounded-lg bg-card px-4 py-3">
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]" />
        </span>
      </div>
    </div>
  );
}

function EmptyState(): ReactNode {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
        <Bot className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-xl font-semibold">Open-weight coding assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask me to debug, refactor, draft a feature, or explain a stack. Open weights, free tier, easy to swap models.
        </p>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          "Debug a TypeScript error",
          "Refactor this React component",
          "Write a Postgres query",
          "Explain this regex",
        ].map((s) => (
          <span
            key={s}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
          >
            “{s}”
          </span>
        ))}
      </div>
    </div>
  );
}

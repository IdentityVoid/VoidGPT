import { useState, type ReactNode } from "react";
import { useAction } from "convex/react";
import { api } from "~convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";
import {
  Sparkles,
  Bug,
  ShieldAlert,
  Gauge,
  BookOpen,
  ScanSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const FOCUS_AREAS = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "bugs", label: "Bugs", icon: Bug },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "style", label: "Readability", icon: BookOpen },
];

export function Analyze(): ReactNode {
  // Cast `api` to bypass stale codegen: the cached convex/_generated/api.d.ts
  // was generated before `convex/analyze.ts` was added. After the next
  // `bunx convex dev --once`, the cast becomes a real ActionBuilder reference.
  const analyze = useAction((api as any).analyze.analyzeCode);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [focus, setFocus] = useState("all");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    const trimmed = code.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await analyze({
        code: trimmed,
        language: language.trim() || undefined,
        focus,
      });
      if (r.ok && r.content) setResult(r.content);
      else setError(r.error ?? "Unknown error");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <ScanSearch className="h-3 w-3" />
            Code review
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Senior-engineer pass on a snippet
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Paste code, pick a focus, get a structured report on bugs, security,
            performance, readability, and concrete patches. Backed by a
            coder-specialized open-weight model on your choice of provider.
          </p>
        </motion.div>

        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base">Input</CardTitle>
            <CardDescription>
              Language tag is optional but helps the model context-switch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              placeholder="// paste a snippet here…"
              className="resize-y font-mono text-[13px] leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Focus:</span>
              {FOCUS_AREAS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFocus(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    focus === f.id
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <f.icon className="h-3 w-3" />
                  {f.label}
                </button>
              ))}
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="language tag (optional)"
                className="ml-auto h-9 w-56 rounded-md border border-border bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                onClick={handleRun}
                disabled={loading || !code.trim()}
                size="sm"
              >
                <ScanSearch className="h-3.5 w-3.5" />
                {loading ? "Running review…" : "Run review"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-5 border-destructive/40 bg-destructive/10">
            <CardContent className="py-3 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {loading && !result && (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]" />
              </span>
              Reading the snippet…
            </CardContent>
          </Card>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review</CardTitle>
                <CardDescription>
                  Generated by the configured coder-specialized model.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Markdown content={result} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  );
}

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Zap,
  History,
  ScanSearch,
  KeyRound,
  ArrowRight,
  Check,
  Github,
  Lock,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Sparkles,
    title: "Open-weight, coder-specialized",
    body: "Defaults to Qwen 2.5 Coder 32B on OpenRouter — strong code-specialist checkpoint. Swap to Llama 3.3 70B, Mixtral, DeepSeek Coder, or your own self-hosted vLLM with one env var.",
  },
  {
    icon: Code2,
    title: "Code-first interface",
    body: "Streaming chat with language-aware code blocks, copy-to-clipboard, and clean monospace rendering. Made for shipping, not filing reports.",
  },
  {
    icon: ScanSearch,
    title: "Senior code review",
    body: "Paste any snippet at /analyze for a structured report on bugs, security, performance, readability, and concrete patches. Pick a focus area — at /analyze.",
  },
  {
    icon: Zap,
    title: "Free tier, no card",
    body: "Free models on OpenRouter work anonymously with no signup. Drop your own key in (or pass it as a bearer header at the API endpoint) to remove rate limits.",
  },
  {
    icon: KeyRound,
    title: "OpenAI-compatible API",
    body: "Your Convex deployment exposes /v1/chat/completions. Drive the model from your editor, langchain, or any OpenAI SDK with the same Authorization bearer pattern.",
  },
  {
    icon: History,
    title: "Saved conversations",
    body: "Threads persist via Convex. Pick up where you left off, or compare two solutions side-by-side.",
  },
];

const exampleCurl = `curl https://<your-deployment>.convex.site/v1/chat/completions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen/qwen-2.5-coder-32b-instruct",
    "messages": [
      { "role": "user", "content": "Write a postgres RPC for upserting a row by slug." }
    ]
  }'`;

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. The default provider is OpenRouter's free tier (Llama 3.3 70B, no card). Add a paid OpenRouter key when you want higher limits, a stronger coder model, or to remove rate caps.",
  },
  {
    q: "Which model does it use by default?",
    a: "Qwen 2.5 Coder 32B Instruct (paid but cheap, ~$0.10/M input tokens). Strong coder-specialist. Override via LLM_MODEL env — Llama 3.3 70B free tier, Mixtral, DeepSeek Coder, abliterated community finetunes, or any OpenAI-compatible endpoint work.",
  },
  {
    q: "Where do my conversations go?",
    a: "Stored on your project's Convex deployment. There's no separate SaaS account — data flows through your own backend.",
  },
  {
    q: "What does the /analyze page do?",
    a: "You paste a snippet, optionally pick a focus (all / bugs / security / performance / readability), and the model runs a senior-engineer pass: bugs, security issues, performance, readability, and concrete patches you can apply.",
  },
  {
    q: "Can I drive it from my editor or CLI?",
    a: "Yes — the /v1/chat/completions endpoint is OpenAI-compatible. Point any OpenAI SDK at it with the deployment URL, pass OpenRouter key as Authorization: Bearer, and use it like any other chat completion endpoint.",
  },
  {
    q: "Can I self-host this?",
    a: "Yes. Fork it, deploy to Vercel/Fly/Render, point at your own Convex and your own model endpoint, and you're done.",
  },
];

export function Landing(): ReactNode {
  return (
    <main className="relative overflow-y-auto">
      <section className="relative isolate px-6 pt-20 pb-24 sm:pt-32 sm:pb-32">
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,hsl(142_70%_45%/_0.18),transparent_60%)]" />
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="default" className="mx-auto">
              OpenAI-compatible · Coder-specialized · Free tier
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl"
          >
            <span className="gradient-text">A coder in your browser.</span>
            <br />
            Open-weight, swap-anytime, and Coder-specialized by default.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground"
          >
            Void Coder is a chat-first coding assistant backed by{" "}
            <span className="font-medium text-foreground">
              Qwen 2.5 Coder 32B
            </span>{" "}
            on open weights. Get a structured code review at{" "}
            <Link
              to="/analyze"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              /analyze
            </Link>
            , drive the same model from your editor via the{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              /v1/chat/completions
            </code>{" "}
            endpoint, and bring your own key for higher limits.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/chat">
              <Button size="lg">
                Start coding free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/analyze">
              <Button size="lg" variant="outline">
                <ScanSearch className="h-4 w-4" />
                Try code review
              </Button>
            </Link>
            <a
              href="https://github.com/IdentityVoid/VoidGPT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                <Github className="h-4 w-4" />
                Fork on GitHub
              </Button>
            </a>
          </motion.div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> Qwen 2.5 Coder 32B
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> Llama 3.3 70B
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> DeepSeek Coder V2
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> OpenAI-compatible
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> Conversation history
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="overflow-hidden rounded-xl border border-border shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-2 border-b border-border/60 bg-card px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ml-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Terminal className="h-3 w-3" />
                void-coder · /chat
              </span>
            </div>
            <div className="bg-[hsl(222_47%_5%)] px-6 py-10 font-mono text-[13px] leading-relaxed text-foreground/90">
              <p>
                <span className="text-primary">›</span> write a typescript function that batches async work
                with a concurrency cap of 4
              </p>
              <div className="mt-4 space-y-0.5 text-foreground/80">
                <p>{"// here's a tiny async pool:"}</p>
                <p>
                  <span className="text-sky-300">export async function</span>{" "}
                  <span className="text-amber-200">pool</span>(
                  <span className="text-foreground">items</span>: T[],
                  <span className="text-foreground">n</span>: number,
                  <span className="text-foreground">fn</span>: (item: T) <span className="text-foreground">=&gt;</span> Promise&lt;R&gt;): Promise&lt;R[]&gt; {"{"}
                </p>
                <p className="pl-4">
                  <span className="text-sky-300">const</span> results: R[] = []
                  <span className="text-muted-foreground">;</span>
                </p>
                <p className="pl-4">
                  <span className="text-sky-300">const</span> workers = Array.from(
                  {"{"}length: Math.min(n, items.length){"}"},{" "}
                  <span className="text-sky-300">async</span> () <span className="text-foreground">=&gt;</span> {"{"}
                </p>
                <p className="pl-8">
                  <span className="text-sky-300">while</span> (items.length) {"{"}
                </p>
                <p className="pl-12">
                  <span className="text-sky-300">const</span> item = items.shift()
                  <span className="text-amber-200">!</span>
                  <span className="text-muted-foreground">;</span>
                </p>
                <p className="pl-12">
                  results.push(<span className="text-sky-300">await</span> fn(item))
                  <span className="text-muted-foreground">;</span>
                </p>
                <p className="pl-8">{"}"}<span className="text-muted-foreground">;</span></p>
                <p className="pl-4">{"}"}<span className="text-muted-foreground">;</span></p>
                <p className="pl-4">
                  <span className="text-sky-300">return</span> Promise.all(workers).then(
                  () <span className="text-foreground">=&gt;</span> results)
                  <span className="text-muted-foreground">;</span>
                </p>
                <p>{"}"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for shipping code, not filing reports
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Six small decisions: coder-specialized weights, focused chat UI, code-review page, free by default, persistent threads, and an open-API endpoint.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="transition-all hover:border-primary/40">
                <CardHeader>
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{f.body}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <Card className="overflow-hidden">
            <CardHeader>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Terminal className="h-3 w-3" />
                OpenAI-compatible
              </span>
              <CardTitle className="text-2xl">
                Drive the same model from your editor, CLI, or any OpenAI SDK
              </CardTitle>
              <CardDescription>
                Your Convex deployment exposes{" "}
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                  /v1/chat/completions
                </code>
                . Pass <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">OPENROUTER_API_KEY</code> as a Bearer token on the request, or fall back to the deploy's bundled key.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg border border-border bg-[hsl(222_47%_4%)] px-4 py-4 font-mono text-[12.5px] leading-relaxed text-foreground/85">
                <code>{exampleCurl}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-gradient-to-b from-card to-background p-10 text-center shadow-lg">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold">Free to preview. Pay only if you want more.</h2>
          <p className="mt-2 text-muted-foreground">
            Default provider is OpenRouter's free tier — no card, no signup. Drop in your own{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">OPENROUTER_API_KEY</code>{" "}
            (or any provider's key) in the env to remove rate limits.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/chat">
              <Button size="lg">Start coding free</Button>
            </Link>
            <Link to="/analyze">
              <Button size="lg" variant="outline">
                Try code review
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">FAQ</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((item) => (
              <Card key={item.q}>
                <CardHeader>
                  <CardTitle className="text-base">{item.q}</CardTitle>
                  <CardDescription className="leading-relaxed">{item.a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-8 text-center text-xs text-muted-foreground">
        Built with Vite, React, Convex, Tailwind, and Bun. Open weights, open codebase.
      </footer>
    </main>
  );
}

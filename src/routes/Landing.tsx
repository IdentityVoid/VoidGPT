import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Zap,
  History,
  GitBranch,
  KeyRound,
  ArrowRight,
  Check,
  Github,
  Lock,
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
    title: "Open-weight models",
    body: "Default to Llama 3.3 70B on OpenRouter's free tier. Swap to Qwen 2.5 Coder, Mixtral, abliterated community variants — one env var.",
  },
  {
    icon: Code2,
    title: "Code-first interface",
    body: "Streaming chat with language-aware code blocks, copy-to-clipboard, and clean monospace rendering. Made for shipping.",
  },
  {
    icon: Zap,
    title: "Free tier, no card",
    body: "Start on OpenRouter's free tier with no signup and no card. Add your own API key to unlock higher limits.",
  },
  {
    icon: History,
    title: "Saved conversations",
    body: "Threads persist via Convex. Pick up where you left off, or compare two solutions side-by-side.",
  },
  {
    icon: GitBranch,
    title: "Open codebase",
    body: "Standard Vite + React + TS + Tailwind + Convex stack. Easy to fork, customize, and ship.",
  },
  {
    icon: KeyRound,
    title: "Bring your own key",
    body: "Any OpenAI-compatible endpoint: OpenRouter, Together, Groq, or your own self-hosted vLLM. No vendor lock-in.",
  },
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. The default provider is OpenRouter's free tier with no credit card. Add a paid OpenRouter key when you want higher limits or premium models.",
  },
  {
    q: "Which model does it use by default?",
    a: "Llama 3.3 70B Instruct (free tier). Override via LLM_MODEL — Qwen 2.5 Coder 32B, Mistral, Mixtral, and abliterated community finetunes all work.",
  },
  {
    q: "Where do my conversations go?",
    a: "Stored on your project's Convex deployment. There's no separate SaaS account — data flows through your own backend.",
  },
  {
    q: "Can I self-host this?",
    a: "Yes. Fork it, deploy to Vercel/Fly/Render, point at your own Convex, and you're done.",
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
              Open weights · Free tier · No card required
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
            Open-weight, free, swap-anytime models.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground"
          >
            Void Coder is a chat-first coding assistant built on top of open-weight LLMs. Default to the free
            tier, swap to a stronger code-specialized model when you need it, and bring your own key if you
            want zero rate-limits.
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
              <Check className="h-3 w-3 text-primary" /> Llama 3.3 70B
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" /> Qwen 2.5 Coder 32B
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
              <span className="ml-3 text-xs text-muted-foreground">void-coder · /chat</span>
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
                  <span className="text-foreground">fn</span>: (item: T) =&gt; Promise&lt;R&gt;): Promise&lt;R[]&gt; {"{"}
                </p>
                <p className="pl-4">
                  <span className="text-sky-300">const</span> results: R[] = []
                  <span className="text-muted-foreground">;</span>
                </p>
                <p className="pl-4">
                  <span className="text-sky-300">const</span> workers = Array.from(
                  {"{"}length: Math.min(n, items.length){"}"},{" "}
                  <span className="text-sky-300">async</span> () =&gt; {"{"}
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
                  <span className="text-sky-300">return</span> Promise.all(workers).then(() =&gt; results)
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
              Six small decisions: open weights, focused chat UI, free by default, persistent threads, open
              codebase, swappable endpoints.
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

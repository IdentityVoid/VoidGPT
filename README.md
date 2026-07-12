# Void Coder

Open-weight, free-to-use AI coding assistant. Built on the standard Freebuff stack: **Vite + React + TypeScript + Tailwind + Convex + Bun**.

## Highlights

- **Open-weight by default** — `LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free` on OpenRouter's free tier (no card, no signup).
- **Swap-anytime** — `LLM_MODEL=qwen/qwen-2.5-coder-32b-instruct` for code-specialist, or any OpenAI-compatible endpoint (Together, Groq, self-hosted vLLM, abliterated community finetune).
- **Persistent threads** via Convex. Threads are scoped to a per-browser session id stored in localStorage so each browser gets its own conversation history.
- **Code-first UI** — language-aware code blocks, copy-to-clipboard, monospace rendering.
- **Standard Freebuff stack** — easy to fork, deploy, and customize.

## Stack

- Vite 5 + React 18 + TypeScript
- Tailwind CSS 3 + shadcn-style primitives (custom-built, no CLI generator)
- Convex (queries, mutations, actions)
- Framer Motion for landing-page animations
- Bun for package management
- lucide-react for icons

## Quick start

### One-click (cross-platform)

```sh
bun run setup
# or:  npm run setup
# or:  node scripts/setup.mjs
```

`bun run setup` detects your OS and runs the right installer:

- **Windows** → `scripts/install.ps1`
- **Linux / macOS** → `scripts/install.sh`

Both installers:
1. Detect Bun and install it via the official installer if missing.
2. Run `bun install`.
3. Copy `.env.example` to `.env.local` (your real config).
4. Prompt for your Convex deployment URL (one manual step at https://dashboard.convex.dev).
5. Deploy the backend (`bunx convex dev --once`).
6. Print how to start the dev server.

Then start it:

```sh
bun run dev
# or:  bun run dev:linux  /  bun run dev:windows
```

Open http://localhost:5173.

### Manual / step-by-step

If you'd rather skip the installer and do each step yourself:

```sh
# 1. Install Bun (skip if already installed)
curl -fsSL https://bun.sh/install | bash       # Linux/macOS
irm bun.sh/install.ps1 | iex                   # Windows PowerShell

# 2. Install dependencies
bun install

# 3. Bootstrap env
cp .env.example .env.local

# 4. Create a Convex deployment at https://dashboard.convex.dev,
#    paste the deployment URL into VITE_CONVEX_URL in .env.local,
#    then deploy the backend:
bunx convex dev --once

# 5. Start the dev server
bun run dev
```

## Environment variables

Set these via the project's Keys/API-keys UI (or `.env.local` for dev). Do not commit a `.env` file.

| Var | Purpose | Default |
|---|---|---|
| `VITE_CONVEX_URL` | Convex deployment URL | placeholder |
| `OPENROUTER_API_KEY` | OpenRouter key for higher limits + paid models | optional |
| `LLM_MODEL` | Any OpenRouter / OpenAI-compatible model id | `meta-llama/llama-3.3-70b-instruct:free` |
| `SYSTEM_PROMPT` | Override the assistant's behavior | bundled coder prompt |
| `SITE_URL` / `SITE_NAME` | Recommended by OpenRouter for ranking on `:free` | optional |

`VITE_CONVEX_URL` lives on the client; `OPENROUTER_API_KEY`, `LLM_MODEL`, `SYSTEM_PROMPT`, `SITE_URL`, `SITE_NAME` are read in the Convex action.

## Switching models

```sh
# Code-specialist (paid but cheap)
LLM_MODEL=qwen/qwen-2.5-coder-32b-instruct bun run dev

# Bigger general
LLM_MODEL=meta-llama/llama-3.1-70b-instruct bun run dev

# Bring-your-own endpoint (any OpenAI-compatible)
LLM_MODEL=my-deployment.example.com/v1 bun run dev
```

## Project layout

```
/                     marketing landing page
/chat                 chat UI (sidebar + thread)
/chat/:id             existing thread
convex/                 backend (schema, queries, mutations, action, OpenRouter client)
src/components/        UI primitives, chat window, sidebar, navbar, code block
src/lib/               utils, convex client provider
src/routes/            routed page components
```

## License

MIT.

/**
 * cli/lib/api.ts — thin client around the deployment's /v1/chat/completions.
 *
 * Single request per call (no streaming in MVP). Reads deploymentUrl/apiKey/model
 * from ~/.voidcoder/config.json via loadConfig().
 */

import { loadConfig } from "../config";

export interface ChatRequest {
  prompt: string;
  model?: string;
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  finishReason: string;
}

export async function callChat(req: ChatRequest): Promise<ChatResponse> {
  const cfg = loadConfig();
  if (!cfg.deploymentUrl) {
    throw new Error(
      "no deployment URL configured. run: voidcoder config set deploymentUrl=https://your-deployment.convex.cloud"
    );
  }

  const endpoint = `${cfg.deploymentUrl.replace(/\/+$/, "")}/v1/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;

  const model = req.model ?? cfg.model ?? "qwen/qwen-2.5-coder-32b-instruct";
  const systemPrompt =
    req.systemPrompt ??
    cfg.systemPrompt ??
    "You are a senior software engineer. Lead with code that runs.";

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: req.prompt },
    ],
  };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `network error contacting ${endpoint}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    model?: string;
  };

  const choice = data.choices?.[0];
  const content = choice?.message?.content ?? "";
  if (!content) {
    throw new Error("API returned empty completion");
  }
  return {
    content,
    model: data.model ?? model,
    finishReason: choice?.finish_reason ?? "stop",
  };
}

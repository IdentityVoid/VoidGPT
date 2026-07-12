/**
 * OpenRouter HTTP client. Calls any OpenAI-compatible chat completion endpoint.
 *
 * Set OPENROUTER_API_KEY in the env for higher rate limits and access to paid models.
 * Without a key, requests still work for `:free` models but at strict anonymous limits.
 */
export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallOpenRouterArgs {
  model: string;
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function callOpenRouter(args: CallOpenRouterArgs): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  const siteUrl = process.env.SITE_URL;
  const siteName = process.env.SITE_NAME;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: apiKey ? `Bearer ${apiKey}` : "",
  };
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  if (siteName) headers["X-Title"] = siteName;

  const body = {
    model: args.model,
    messages: [
      { role: "system" as const, content: args.systemPrompt },
      ...args.messages,
    ],
    temperature: 0.2,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("OpenRouter returned an empty completion");
  }
  return content;
}

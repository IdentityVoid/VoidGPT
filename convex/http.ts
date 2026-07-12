import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { callOpenRouter } from "./lib/openrouter";
import { DEFAULT_SYSTEM_PROMPT } from "./_system";

const DEFAULT_MODEL =
  process.env.LLM_MODEL ?? "qwen/qwen-2.5-coder-32b-instruct";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;

const http = httpRouter();

/**
 * OpenAI-compatible /v1/chat/completions endpoint.
 *
 * Any OpenAI client (the official SDK, curl, langchain, etc.) can drive this
 * Convex deployment by pointing at:
 *   <CONVEX_SITE>/v1/chat/completions
 *
 * Auth: pass `Authorization: Bearer <OPENROUTER_API_KEY>` per request to use
 * the caller's OpenRouter key. Without a key, the deploy's bundled
 * OPENROUTER_API_KEY (if any) is used.
 */
http.route({
  path: "/v1/chat/completions",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    try {
      // Drop trailing slash, then split off "Bearer ".
      const authHeader = request.headers.get("Authorization") ?? "";
      const callerKey = authHeader.replace(/^Bearer\s+/i, "").trim();
      const bearerKey =
        callerKey && callerKey.toLowerCase() !== "none" ? callerKey : undefined;

      const body = (await request.json().catch(() => ({}))) as {
        model?: string;
        messages?: { role: "system" | "user" | "assistant"; content: string }[];
        stream?: boolean;
      };

      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(
          JSON.stringify({
            error: {
              message: "`messages` must be a non-empty array",
              type: "invalid_request_error",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const systemMessages = body.messages.filter((m) => m.role === "system");
      const sysPrompt =
        systemMessages.length > 0
          ? systemMessages.map((m) => m.content).join("\n\n")
          : SYSTEM_PROMPT;

      const userMessages = body.messages.filter(
        (m) => m.role !== "system"
      ) as { role: "user" | "assistant"; content: string }[];

      const reply = await callOpenRouter({
        model: body.model ?? DEFAULT_MODEL,
        systemPrompt: sysPrompt,
        messages: userMessages,
        apiKeyOverride: bearerKey,
      });

      return new Response(
        JSON.stringify({
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: body.model ?? DEFAULT_MODEL,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: reply },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({
          error: { message: msg, type: "server_error" },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;

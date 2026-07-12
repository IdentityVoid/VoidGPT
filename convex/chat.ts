"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { callOpenRouter } from "./lib/openrouter";
import { DEFAULT_SYSTEM_PROMPT } from "./_system";

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;
const MODEL = process.env.LLM_MODEL ?? "qwen/qwen-2.5-coder-32b-instruct";

export const sendMessage = action({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      await ctx.runMutation(internal.messages.appendUser, {
        conversationId: args.conversationId,
        content: args.content,
      });

      const messages = await ctx.runQuery(internal.messages.list, {
        conversationId: args.conversationId,
      });

      const reply = await callOpenRouter({
        model: MODEL,
        systemPrompt: SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      await ctx.runMutation(internal.messages.appendAssistant, {
        conversationId: args.conversationId,
        content: reply,
      });

      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  },
});

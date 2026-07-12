import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

// Public query — used by the chat UI to render messages for the current conversation.
export const listForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

// Internal — used by the chat action to build the context for LLM calls.
export const list = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

// Internal — append a user message and auto-rename the conversation based on its content.
export const appendUser = internalMutation({
  args: { conversationId: v.id("conversations"), content: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "user",
      content: args.content,
      createdAt: Date.now(),
    });
    const convo = await ctx.db.get(args.conversationId);
    if (convo && (convo.title === "New thread" || convo.title === "")) {
      const trimmed = args.content.slice(0, 60).replace(/\s+/g, " ").trim();
      await ctx.db.patch(args.conversationId, { title: trimmed || "New thread" });
    }
  },
});

// Internal — append the assistant's reply.
export const appendAssistant = internalMutation({
  args: { conversationId: v.id("conversations"), content: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

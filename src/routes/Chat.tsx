import { useEffect, useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "~convex/_generated/api";
import type { Id } from "~convex/_generated/dataModel";
import { ChatWindow } from "@/components/ChatWindow";
import { ConversationSidebar } from "@/components/ConversationSidebar";

const SESSION_KEY = "void-coder:session-id";

function generateSessionId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateSessionId();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function Chat(): ReactNode {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [sessionId] = useState(getOrCreateSessionId);
  const createConversation = useMutation(api.conversations.create);

  useEffect(() => {
    if (!id) {
      void (async () => {
        const newId = await createConversation({ title: "New thread", sessionId });
        navigate(`/chat/${newId}`, { replace: true });
      })();
    }
  }, [id, sessionId, createConversation, navigate]);

  if (!id) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        Preparing a fresh thread…
      </div>
    );
  }

  const conversationId = id as Id<"conversations">;

  return (
    <div className="flex h-full">
      <ConversationSidebar
        sessionId={sessionId}
        activeId={conversationId}
        onSelect={(cid) => navigate(`/chat/${cid}`)}
        onNew={async () => {
          const newId = await createConversation({ title: "New thread", sessionId });
          navigate(`/chat/${newId}`);
        }}
      />
      <div className="min-w-0 flex-1">
        <ChatWindow key={conversationId} conversationId={conversationId} />
      </div>
    </div>
  );
}

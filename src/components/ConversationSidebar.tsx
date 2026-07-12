import type { ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "~convex/_generated/api";
import type { Id } from "~convex/_generated/dataModel";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Conversation = {
  _id: Id<"conversations">;
  _creationTime: number;
  title: string;
  sessionId: string;
  createdAt: number;
};

interface ConversationSidebarProps {
  sessionId: string;
  activeId: Id<"conversations"> | null;
  onSelect: (id: Id<"conversations">) => void;
  onNew: () => void;
}

export function ConversationSidebar({
  sessionId,
  activeId,
  onSelect,
  onNew,
}: ConversationSidebarProps): ReactNode {
  const conversations = useQuery(api.conversations.listForSession, {
    sessionId,
  }) as Conversation[] | undefined;
  const remove = useMutation(api.conversations.remove);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-card/30">
      <div className="flex items-center justify-between border-b border-border/60 p-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/90">Threads</h2>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onNew}
          title="New thread"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations === undefined && (
          <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>
        )}
        {conversations && conversations.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">No threads yet.</div>
        )}
        {conversations?.map((c) => (
          <div
            key={c._id}
            className={cn(
              "group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-secondary/40",
              c._id === activeId && "bg-primary/15"
            )}
            onClick={() => onSelect(c._id)}
          >
            <span className="flex items-center gap-2 truncate">
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{c.title || "Untitled"}</span>
            </span>
            <button
              type="button"
              aria-label="Delete thread"
              className="invisible text-muted-foreground hover:text-foreground group-hover:visible"
              onClick={async (e) => {
                e.stopPropagation();
                await remove({ id: c._id });
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

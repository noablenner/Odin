"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/hooks/useChat";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const sources = (message.sources_used || []).filter(
    (s: any) => s && (s.source || s.sources?.length)
  );

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {message.content || (message.streaming ? "…" : "")}
        {message.streaming && <span className="ml-0.5 animate-pulse">▍</span>}

        {!isUser && sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-border/40 pt-2">
            {sources.map((s: any, i: number) => (
              <Badge key={i} variant="muted">
                {s.source || (s.sources || []).filter(Boolean).join(", ") || s.tool}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

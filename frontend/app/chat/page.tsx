"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost } from "@/lib/api";
import { cn, relativeTime } from "@/lib/utils";

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadConversations = () =>
    apiGet("/api/chat/conversations").then((rows) => {
      setConversations(rows);
      if (!active && rows.length) setActive(rows[0].id);
    });

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newConversation = async () => {
    const conv = await apiPost("/api/chat/conversations");
    setConversations((c) => [conv, ...c]);
    setActive(conv.id);
  };

  const filtered = conversations.filter((c) =>
    (c.title || "Untitled").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-7rem)] gap-4">
        {/* History sidebar */}
        <div className="hidden w-64 flex-col rounded-lg border bg-card md:flex">
          <div className="p-3 space-y-2">
            <Button onClick={newConversation} className="w-full" size="sm">
              <Plus className="h-4 w-4" /> New chat
            </Button>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 h-9"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm",
                  active === c.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                )}
              >
                <div className="truncate font-medium">{c.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground">
                  {relativeTime(c.last_message_at)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 rounded-lg border bg-card">
          <ChatWindow key={active} conversationId={active} />
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, streamChat } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources_used?: any[];
  streaming?: boolean;
}

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (conversationId) {
      apiGet(`/api/chat/conversations/${conversationId}/messages`)
        .then((rows) =>
          setMessages(
            rows
              .filter((r: any) => r.role !== "tool")
              .map((r: any) => ({
                id: r.id,
                role: r.role,
                content: r.content,
                sources_used: r.sources_used,
              }))
          )
        )
        .catch(() => {});
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return;
      setSending(true);
      setActiveTool(null);

      const userMsg: ChatMessage = {
        id: `local-${idRef.current++}`,
        role: "user",
        content: text,
      };
      const assistantMsg: ChatMessage = {
        id: `local-${idRef.current++}`,
        role: "assistant",
        content: "",
        streaming: true,
        sources_used: [],
      };
      setMessages((m) => [...m, userMsg, assistantMsg]);

      try {
        await streamChat(text, conversationId, (event) => {
          if (event.type === "text") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id
                  ? { ...msg, content: msg.content + event.text }
                  : msg
              )
            );
          } else if (event.type === "tool") {
            setActiveTool(event.tool);
          } else if (event.type === "done") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id
                  ? { ...msg, streaming: false, sources_used: event.sources }
                  : msg
              )
            );
          } else if (event.type === "error") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id
                  ? { ...msg, streaming: false, content: `⚠️ ${event.error}` }
                  : msg
              )
            );
          }
        });
      } catch (e: any) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantMsg.id
              ? { ...msg, streaming: false, content: `⚠️ ${e.message}` }
              : msg
          )
        );
      } finally {
        setSending(false);
        setActiveTool(null);
      }
    },
    [conversationId, sending]
  );

  return { messages, send, sending, activeTool };
}

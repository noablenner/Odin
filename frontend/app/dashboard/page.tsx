"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  MessageSquare,
  Database,
  Zap,
  Smartphone,
  Send,
  Globe,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { formatBytes, relativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {error && <p className="text-destructive">{error}</p>}
      {!data ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={MessageSquare} label="Messages today" value={data.stats.messages_today} />
            <Stat icon={Zap} label="Tokens (in/out)" value={`${data.stats.tokens_in}/${data.stats.tokens_out}`} />
            <Stat icon={Database} label="Memory docs" value={data.memory.doc_count} sub={`${data.memory.chunk_count} chunks · ${formatBytes(data.memory.storage_bytes)}`} />
            <Stat icon={Activity} label="Total messages" value={data.stats.total_messages} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Activity feed */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity feed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.activity.length === 0 && (
                  <p className="text-sm text-muted-foreground">No activity yet. Start a chat.</p>
                )}
                {data.activity.map((m: any) => (
                  <div key={m.id} className="flex items-start gap-3 text-sm">
                    <Badge variant={m.role === "user" ? "muted" : "default"}>{m.role}</Badge>
                    <span className="flex-1 truncate">{m.content}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {relativeTime(m.created_at)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Channels */}
              <Card>
                <CardHeader>
                  <CardTitle>Active channels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ChannelRow icon={Globe} label="Web chat" active={data.channels.web} />
                  <ChannelRow icon={Smartphone} label="WhatsApp" active={data.channels.whatsapp} />
                  <ChannelRow icon={Send} label="Telegram" active={data.channels.telegram} />
                </CardContent>
              </Card>

              {/* Connector health */}
              <Card>
                <CardHeader>
                  <CardTitle>Connector health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.connectors.length === 0 && (
                    <p className="text-sm text-muted-foreground">No connectors yet.</p>
                  )}
                  {data.connectors.map((c: any) => (
                    <div key={c.type} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{c.type.replace("_", " ")}</span>
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, sub }: any) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ChannelRow({ icon: Icon, label, active }: any) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      <Badge variant={active ? "success" : "muted"}>{active ? "on" : "off"}</Badge>
    </div>
  );
}

function statusVariant(status: string) {
  if (status === "connected") return "success";
  if (status === "error") return "error";
  if (status === "syncing") return "warning";
  return "muted";
}

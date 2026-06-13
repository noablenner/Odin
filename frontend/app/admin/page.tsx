"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [memory, setMemory] = useState<any>(null);
  const [impersonated, setImpersonated] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet("/api/admin/users"),
      apiGet("/api/admin/usage"),
      apiGet("/api/admin/connectors/health"),
      apiGet("/api/admin/memory/overview"),
    ])
      .then(([u, us, h, m]) => {
        setUsers(u);
        setUsage(us);
        setHealth(h);
        setMemory(m);
      })
      .catch((e) => setError(e.message));
  }, []);

  const impersonate = async (id: string) => {
    setImpersonated(await apiGet(`/api/admin/impersonate/${id}`));
  };

  if (error) {
    return (
      <AppShell>
        <p className="text-destructive">{error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Metric label="Users" value={users.length} />
        <Metric label="Est. cost (USD)" value={usage ? `$${usage.estimated_cost_usd}` : "…"} />
        <Metric
          label="Tokens in/out"
          value={usage ? `${usage.tokens_in}/${usage.tokens_out}` : "…"}
        />
        <Metric
          label="Memory storage"
          value={memory ? formatBytes(memory.storage_bytes) : "…"}
          sub={memory ? `${memory.total_chunks} chunks` : ""}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1">Email</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Msgs</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="py-1.5 truncate max-w-[180px]">{u.email}</td>
                      <td><Badge variant="muted">{u.plan}</Badge></td>
                      <td>{u.subscription_status}</td>
                      <td>{u.messages}</td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => impersonate(u.id)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connector health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {health &&
                Object.entries(health.by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize">{status}</span>
                    <span>{count as number}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {impersonated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{impersonated.user.email}</CardTitle>
                <p className="text-xs text-muted-foreground">Read-only snapshot</p>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>Plan: {impersonated.user.plan}</div>
                <div>Memory: {impersonated.memory.doc_count} docs</div>
                <div>
                  Connectors:{" "}
                  {impersonated.connectors.map((c: any) => c.type).join(", ") || "none"}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, sub }: any) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

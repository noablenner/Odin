"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { startCheckout, openBillingPortal } from "@/lib/stripe";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const [me, setMe] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/auth/me").then(setMe);
    apiGet("/api/billing/history").then((d) => setInvoices(d.invoices)).catch(() => {});
  }, []);

  const changePassword = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setMsg(error ? error.message : "Password updated ✓");
    setNewPassword("");
  };

  const rotateKey = async () => {
    const { api_key } = await apiPost("/api/auth/api-key");
    setApiKey(api_key);
  };

  const deleteAccount = async () => {
    if (!confirm("Delete your account and all data? This cannot be undone.")) return;
    await apiDelete("/api/auth/account");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!me) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  const subscribed = ["active", "trialing"].includes(me.subscription_status);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Email:</span> {me.email}
            </div>
            <div className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">Plan:</span>
              <Badge>{me.plan}</Badge>
              <Badge variant={subscribed ? "success" : "muted"}>{me.subscription_status}</Badge>
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-xs text-muted-foreground">Change password</label>
              <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button size="sm" onClick={changePassword} disabled={newPassword.length < 6}>Update password</Button>
              {msg && <p className="text-xs text-emerald-600">{msg}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscribed ? (
              <Button onClick={openBillingPortal}>Manage billing</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => startCheckout("pro")}>Upgrade to Pro</Button>
                <Button variant="outline" onClick={() => startCheckout("business")}>Business</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use a personal API key to call your agent directly.
            </p>
            <Button size="sm" onClick={rotateKey}>Generate new API key</Button>
            {apiKey && (
              <div className="rounded bg-muted p-2 text-xs break-all">
                {apiKey}
                <p className="mt-1 text-muted-foreground">Copy now — shown once.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing history</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <span>{formatDate(new Date(inv.created * 1000).toISOString())}</span>
                    <span>
                      {(inv.amount_paid / 100).toFixed(2)} {inv.currency?.toUpperCase()}
                    </span>
                    <a className="text-primary hover:underline" href={inv.pdf} target="_blank" rel="noreferrer">PDF</a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={deleteAccount}>Delete account</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

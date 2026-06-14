"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPut } from "@/lib/api";

export default function AgentPage() {
  const [profile, setProfile] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  // channel form state
  const [waActive, setWaActive] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [tgActive, setTgActive] = useState(false);
  const [tgToken, setTgToken] = useState("");

  useEffect(() => {
    apiGet("/api/agent/profile").then(setProfile);
    apiGet("/api/agent/channels").then((chs) => {
      setChannels(chs);
      const wa = chs.find((c: any) => c.type === "whatsapp");
      const tg = chs.find((c: any) => c.type === "telegram");
      if (wa) {
        setWaActive(wa.is_active);
        setWaPhone(wa.phone_number || "");
      }
      if (tg) setTgActive(tg.is_active);
    });
  }, []);

  const saveProfile = async () => {
    await apiPut("/api/agent/profile", profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveWhatsapp = async () => {
    await apiPut("/api/agent/channels", {
      type: "whatsapp",
      is_active: waActive,
      phone_number: waPhone,
    });
  };

  const saveTelegram = async () => {
    await apiPut("/api/agent/channels", {
      type: "telegram",
      is_active: tgActive,
      bot_token: tgToken || undefined,
    });
  };

  if (!profile) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  const set = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">My Agent</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Agent name">
              <Input value={profile.agent_name || ""} onChange={(e) => set("agent_name", e.target.value)} placeholder="Aria for EG-PRO" />
            </Field>
            <Field label="Personality">
              <Textarea value={profile.agent_personality || ""} onChange={(e) => set("agent_personality", e.target.value)} placeholder="Friendly, concise, proactive…" />
            </Field>
            <Field label="Response language">
              <Input value={profile.response_language || "auto"} onChange={(e) => set("response_language", e.target.value)} placeholder="auto / English / Français…" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Company name">
              <Input value={profile.company_name || ""} onChange={(e) => set("company_name", e.target.value)} />
            </Field>
            <Field label="Activity / context">
              <Textarea value={profile.activity_description || ""} onChange={(e) => set("activity_description", e.target.value)} placeholder="What the company does — injected into every prompt." />
            </Field>
            <Field label="Custom instructions">
              <Textarea value={profile.custom_instructions || ""} onChange={(e) => set("custom_instructions", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modèle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-md border bg-accent/40 p-3">
              <Badge variant="success">Automatique</Badge>
              <p className="text-sm text-muted-foreground">
                Le modèle est choisi automatiquement selon la complexité de votre
                demande : les questions simples utilisent un modèle rapide et
                économique, les tâches complexes un modèle plus puissant. Aucun
                réglage nécessaire.
              </p>
            </div>
            <Field label="Custom system prompt (advanced)" className="mt-4">
              <Textarea value={profile.custom_system_prompt || ""} onChange={(e) => set("custom_system_prompt", e.target.value)} placeholder="Overrides the default base prompt when set." />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Web chat</span>
              <Badge variant="success">always on</Badge>
            </div>

            <div className="space-y-2 border-t pt-3">
              <label className="flex items-center justify-between text-sm font-medium">
                WhatsApp
                <input type="checkbox" checked={waActive} onChange={(e) => setWaActive(e.target.checked)} />
              </label>
              <Input placeholder="whatsapp:+33…" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
              <Button size="sm" variant="outline" onClick={saveWhatsapp}>Save WhatsApp</Button>
            </div>

            <div className="space-y-2 border-t pt-3">
              <label className="flex items-center justify-between text-sm font-medium">
                Telegram
                <input type="checkbox" checked={tgActive} onChange={(e) => setTgActive(e.target.checked)} />
              </label>
              <Input type="password" placeholder="Bot token (from @BotFather)" value={tgToken} onChange={(e) => setTgToken(e.target.value)} />
              <Button size="sm" variant="outline" onClick={saveTelegram}>Save Telegram</Button>
            </div>

            <p className="text-xs text-muted-foreground border-t pt-3">Coming soon: SMS, Email, Slack</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={saveProfile}>Save agent settings</Button>
        {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
      </div>
    </AppShell>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

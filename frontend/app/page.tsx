"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between px-6 md:px-12 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            O
          </div>
          <span className="font-semibold text-lg">Odin</span>
        </div>
        <Link href="/auth">
          <Button variant="outline">Sign in</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          One AI agent that knows<br /> your entire business.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Connect Airtable, Qonto, Google Drive, Outlook and more. Odin remembers
          your company knowledge and acts across every tool — from the web,
          WhatsApp or Telegram.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/auth">
            <Button size="lg">Get started free</Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline">
              See features
            </Button>
          </a>
        </div>

        <div id="features" className="mt-24 grid gap-6 md:grid-cols-3 text-left">
          {[
            ["Persistent memory", "Upload docs, URLs and notes. Odin chunks, embeds and recalls them on demand."],
            ["Real connectors", "Read transactions, emails, calendars, spreadsheets and Airtable records."],
            ["Every channel", "The same agent on web, WhatsApp and Telegram — configured from one control center."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

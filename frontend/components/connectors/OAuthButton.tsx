"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OAuthButton({
  provider,
  onConnect,
}: {
  provider: string;
  onConnect: (provider: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onConnect(provider);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Redirecting…" : "Connect with OAuth"}
    </Button>
  );
}

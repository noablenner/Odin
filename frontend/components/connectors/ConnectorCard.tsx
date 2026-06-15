"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiKeyForm } from "./ApiKeyForm";
import { OAuthButton } from "./OAuthButton";
import { relativeTime } from "@/lib/utils";

export interface ConnectorDef {
  type: string;
  name: string;
  description: string;
  method: "oauth" | "apikey" | "rest" | "webhook";
  oauthProvider?: string;
  keyPlaceholder?: string;
  comingSoon?: boolean;
}

export function ConnectorCard({
  def,
  state,
  actions,
}: {
  def: ConnectorDef;
  state?: any;
  actions: {
    connectApiKey: (type: string, key: string) => Promise<void>;
    connectRest: (body: any) => Promise<void>;
    startOAuth: (provider: string) => Promise<void>;
    test: (type: string) => Promise<any>;
    preview: (type: string) => Promise<any>;
    disconnect: (type: string) => Promise<void>;
  };
}) {
  const connected = state && state.status !== "disconnected";
  const [testResult, setTestResult] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [restUrl, setRestUrl] = useState("");
  const [restKey, setRestKey] = useState("");

  const status = state?.status || "disconnected";
  const variant =
    status === "connected"
      ? "success"
      : status === "error"
      ? "error"
      : status === "syncing"
      ? "warning"
      : "muted";

  const runTest = async () => {
    setTestResult("testing…");
    try {
      await actions.test(def.type);
      setTestResult("✓ Connection OK");
    } catch (e: any) {
      setTestResult(`✗ ${e.message}`);
    }
  };

  const runPreview = async () => {
    try {
      const { records } = await actions.preview(def.type);
      setPreviewData(records || []);
    } catch (e: any) {
      setTestResult(`✗ ${e.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{def.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>
          </div>
          <Badge variant={def.comingSoon ? "muted" : variant}>{def.comingSoon ? "soon" : status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {def.comingSoon ? (
          <Button size="sm" variant="outline" className="w-full" disabled>
            Bientôt disponible
          </Button>
        ) : connected ? (
          <>
            <p className="text-xs text-muted-foreground">
              Last sync: {relativeTime(state.last_sync_at)}
            </p>
            {state.last_error && (
              <p className="text-xs text-destructive">{state.last_error}</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={runTest}>
                <CheckCircle2 className="h-4 w-4" /> Test
              </Button>
              <Button size="sm" variant="outline" onClick={runPreview}>
                <RefreshCw className="h-4 w-4" /> Preview
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => actions.disconnect(def.type)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {testResult && <p className="text-xs">{testResult}</p>}
            {previewData && (
              <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-[10px]">
                {JSON.stringify(previewData.slice(0, 3), null, 2)}
              </pre>
            )}
          </>
        ) : (
          <>
            {def.method === "oauth" && (
              <OAuthButton provider={def.oauthProvider!} onConnect={actions.startOAuth} />
            )}
            {def.method === "apikey" && (
              <ApiKeyForm
                placeholder={def.keyPlaceholder || "API key"}
                onSubmit={(key) => actions.connectApiKey(def.type, key)}
              />
            )}
            {def.method === "rest" && (
              <div className="space-y-2">
                <Input
                  placeholder="Base URL (https://api.example.com)"
                  value={restUrl}
                  onChange={(e) => setRestUrl(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="API key (optional)"
                  value={restKey}
                  onChange={(e) => setRestKey(e.target.value)}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    actions.connectRest({ base_url: restUrl, api_key: restKey })
                  }
                >
                  Connect
                </Button>
              </div>
            )}
            {def.method === "webhook" && (
              <p className="text-xs text-muted-foreground">
                A webhook URL is generated on connect. Configure it in your source
                system to push data into Odin.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

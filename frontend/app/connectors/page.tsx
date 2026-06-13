"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ConnectorCard, type ConnectorDef } from "@/components/connectors/ConnectorCard";
import { useConnectors } from "@/hooks/useConnectors";

const DEFS: ConnectorDef[] = [
  { type: "airtable", name: "Airtable", description: "Read & write records across bases and tables.", method: "oauth", oauthProvider: "airtable" },
  { type: "qonto", name: "Qonto", description: "Bank transactions, balances and invoices.", method: "apikey", keyPlaceholder: "login:secret-key" },
  { type: "google_drive", name: "Google Drive", description: "Search and read files and documents.", method: "oauth", oauthProvider: "google" },
  { type: "google_sheets", name: "Google Sheets", description: "Read & write spreadsheet ranges (via Google).", method: "oauth", oauthProvider: "google" },
  { type: "outlook", name: "Microsoft Outlook", description: "Read emails and calendar events.", method: "oauth", oauthProvider: "microsoft" },
  { type: "excel_online", name: "Excel Online", description: "Read workbook ranges (via Microsoft).", method: "oauth", oauthProvider: "microsoft" },
  { type: "webhook", name: "Generic Webhook", description: "Receive external data pushed into Odin.", method: "webhook" },
  { type: "rest", name: "Generic REST API", description: "Connect any REST API with a base URL + key.", method: "rest" },
];

export default function ConnectorsPage() {
  const { connectors, ...actions } = useConnectors();
  const byType = Object.fromEntries(connectors.map((c) => [c.type, c]));

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-2">Connectors</h1>
      <p className="text-muted-foreground mb-6">
        Connect your tools so your agent can read and act on real data.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DEFS.map((def) => (
          <ConnectorCard
            key={def.type}
            def={def}
            state={byType[def.type]}
            actions={actions}
          />
        ))}
      </div>
    </AppShell>
  );
}

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

  // Coming soon — showcase grid (activated one by one via their OAuth app)
  { type: "slack", name: "Slack", description: "Read & post messages across channels.", method: "oauth", comingSoon: true },
  { type: "gmail", name: "Gmail", description: "Read, search and draft emails.", method: "oauth", comingSoon: true },
  { type: "gcalendar", name: "Google Calendar", description: "Read and create events.", method: "oauth", comingSoon: true },
  { type: "notion", name: "Notion", description: "Read & write pages and databases.", method: "oauth", comingSoon: true },
  { type: "hubspot", name: "HubSpot", description: "Contacts, deals and CRM records.", method: "oauth", comingSoon: true },
  { type: "salesforce", name: "Salesforce", description: "Accounts, leads and opportunities.", method: "oauth", comingSoon: true },
  { type: "stripe", name: "Stripe", description: "Payments, customers and invoices.", method: "apikey", comingSoon: true },
  { type: "shopify", name: "Shopify", description: "Orders, products and customers.", method: "oauth", comingSoon: true },
  { type: "trello", name: "Trello", description: "Boards, lists and cards.", method: "oauth", comingSoon: true },
  { type: "asana", name: "Asana", description: "Projects and tasks.", method: "oauth", comingSoon: true },
  { type: "linear", name: "Linear", description: "Issues and project tracking.", method: "oauth", comingSoon: true },
  { type: "jira", name: "Jira", description: "Issues, sprints and boards.", method: "oauth", comingSoon: true },
  { type: "zendesk", name: "Zendesk", description: "Support tickets and customers.", method: "oauth", comingSoon: true },
  { type: "intercom", name: "Intercom", description: "Conversations and contacts.", method: "oauth", comingSoon: true },
  { type: "discord", name: "Discord", description: "Read & post in servers.", method: "oauth", comingSoon: true },
  { type: "dropbox", name: "Dropbox", description: "Search and read files.", method: "oauth", comingSoon: true },
  { type: "mailchimp", name: "Mailchimp", description: "Audiences and campaigns.", method: "oauth", comingSoon: true },
  { type: "quickbooks", name: "QuickBooks", description: "Invoices and accounting data.", method: "oauth", comingSoon: true },
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

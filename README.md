# Odin — Personal AI Business Agent Platform

Odin is a SaaS where a business owner connects all their tools and gets a
**persistent AI agent** that knows everything about their company. The web
interface is the **control center** — not just a chat. WhatsApp, Telegram and
other channels are secondary entry points to the *same* agent, configured from
the web.

```
┌────────────────────────────────────────────────────────────┐
│  Web Control Center (Next.js)                                │
│  Dashboard · Chat · Memory · Connectors · Agent · Settings   │
└───────────────┬──────────────────────────────────────────────┘
                │ Supabase JWT
        ┌───────▼────────┐      ┌───────────────┐   ┌───────────┐
        │  FastAPI core  │◄─────│  WhatsApp/Twilio│  │ Telegram  │
        │  Agent loop    │      └───────────────┘   └───────────┘
        │  RAG (pgvector)│
        │  Connectors    │──► Airtable · Qonto · Google · Microsoft
        └───────┬────────┘
        ┌───────▼────────┐
        │ Supabase        │  Postgres + pgvector + Auth + RLS
        └─────────────────┘
```

## Tech stack

| Layer       | Technology                                            |
|-------------|-------------------------------------------------------|
| Backend     | FastAPI (Python 3.12)                                 |
| Database    | Supabase (Postgres + pgvector)                        |
| Auth        | Supabase Auth (email + magic link)                    |
| Payments    | Stripe (subscription gating)                          |
| AI agent    | Anthropic Claude API (streaming, tool use)            |
| Embeddings  | OpenAI `text-embedding-3-small` or Voyage `voyage-3`  |
| WhatsApp    | Twilio WhatsApp Business API                          |
| Telegram    | Telegram Bot API                                      |
| Frontend    | Next.js 14 App Router + Tailwind + shadcn/ui          |
| Deployment  | Railway (backend) + Vercel (frontend)                 |

## Monorepo layout

```
/backend      FastAPI app, agent, connectors, ingestion, migrations
/frontend     Next.js 14 control center (7 tabs + admin)
/.github      CI/CD workflows (Railway + Vercel)
```

See [`backend/README` section below](#backend) and
[`frontend`](#frontend) for details.

## Required accounts

Before you can run Odin in production you need:

1. **Supabase** project — Postgres, Auth, pgvector. Grab the URL, anon key,
   service-role key, JWT secret and direct `DATABASE_URL`.
2. **Anthropic** API key (Claude).
3. **OpenAI** (or **Voyage**) API key for embeddings.
4. **Stripe** account — secret/publishable keys, a webhook signing secret, and
   one Price per plan (`STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_BUSINESS`).
5. **Twilio** account with a WhatsApp sender (for the WhatsApp channel).
6. **Telegram** bot token (created via `@BotFather`) — entered per-user in the
   *My Agent* tab, so no global token is needed.
7. **OAuth apps** for the connectors you want:
   - Airtable OAuth app
   - Google Cloud OAuth client (Drive + Sheets scopes)
   - Microsoft Entra app registration (Graph: Mail, Calendars, Files)

## Local development

### 1. Clone & configure

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local   # only NEXT_PUBLIC_* are read by Next
```

Generate the Fernet encryption key and paste it into `backend/.env`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 2. Run with Docker

```bash
docker compose up --build
```

- Backend → http://localhost:8000  (docs at `/docs`)
- Frontend → http://localhost:3000
- Postgres+pgvector → localhost:5432

### 3. Or run pieces manually

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### 4. Apply migrations

With the Supabase CLI:

```bash
supabase db push
```

…or apply the SQL files in `backend/supabase/migrations/` in order against
your `DATABASE_URL`.

## Agent architecture

On every request the system prompt is assembled from:

1. Company profile (Tab 5)
2. Agent personality + custom instructions (Tab 5)
3. Active connectors summary
4. RAG retrieval: top-k chunks from pgvector matching the query
5. Last 10 messages of conversation history
6. Current date/time + user timezone

The agent exposes tools (Claude function calling): `query_memory`,
`get_airtable_records`, `get_qonto_transactions`, `get_qonto_balance`,
`search_emails`, `get_calendar_events`, `get_drive_file`, `read_sheet`,
`write_sheet`, `write_airtable_record`. The same loop serves web (SSE),
WhatsApp and Telegram.

## Security

- Connector credentials encrypted at rest (Fernet AES-256).
- All API routes protected by Supabase JWT.
- Stripe & Twilio webhooks verified by signature.
- Rate limiting on public endpoints (slowapi).
- Row-Level Security on Supabase — users only see their own data.
- Superadmin role checked server-side.

## Deployment

- **Backend → Railway**: `.github/workflows/deploy-backend.yml` deploys on push
  to `main`. Set all `backend/.env` values as Railway variables.
- **Frontend → Vercel**: `.github/workflows/deploy-frontend.yml` deploys on push
  to `main`. Set `NEXT_PUBLIC_*` values as Vercel env vars.

## License

Proprietary — all rights reserved.

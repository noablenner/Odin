-- ============================================================
-- Odin — 0001_init.sql
-- Extensions + core tables
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ------------------------------------------------------------
-- users  (mirrors auth.users; profile + billing)
-- ------------------------------------------------------------
create table if not exists public.users (
    id                      uuid primary key references auth.users(id) on delete cascade,
    email                   text unique not null,
    created_at              timestamptz not null default now(),
    plan                    text not null default 'free',          -- free | pro | business
    is_superadmin           boolean not null default false,
    stripe_customer_id      text,
    stripe_subscription_id  text,
    subscription_status     text default 'inactive',               -- active | trialing | past_due | canceled | inactive
    api_key_hash            text,                                   -- sha256 of personal API key
    timezone                text default 'UTC'
);

-- ------------------------------------------------------------
-- company_profile  (1:1 with users)
-- ------------------------------------------------------------
create table if not exists public.company_profile (
    user_id              uuid primary key references public.users(id) on delete cascade,
    company_name         text,
    activity_description  text,
    custom_instructions   text,
    custom_system_prompt  text,
    agent_name           text default 'Odin',
    agent_personality    text,
    model_preference     text default 'claude-sonnet-4-6',
    response_language    text default 'auto',
    updated_at           timestamptz not null default now()
);

-- ------------------------------------------------------------
-- knowledge_items
-- ------------------------------------------------------------
create table if not exists public.knowledge_items (
    id           uuid primary key default uuid_generate_v4(),
    user_id      uuid not null references public.users(id) on delete cascade,
    type         text not null,                  -- doc | url | note
    title        text not null,
    source_url   text,
    content_raw  text,
    mime_type    text,
    byte_size    bigint default 0,
    tags         text[] default '{}',
    chunk_count  integer not null default 0,
    status       text not null default 'pending',  -- pending | processing | ready | error
    error        text,
    created_at   timestamptz not null default now()
);
create index if not exists idx_knowledge_items_user on public.knowledge_items(user_id);

-- ------------------------------------------------------------
-- knowledge_chunks  (pgvector)
-- ------------------------------------------------------------
create table if not exists public.knowledge_chunks (
    id           uuid primary key default uuid_generate_v4(),
    item_id      uuid not null references public.knowledge_items(id) on delete cascade,
    user_id      uuid not null references public.users(id) on delete cascade,
    content      text not null,
    embedding    vector(1536),
    chunk_index  integer not null default 0,
    metadata     jsonb not null default '{}'::jsonb,
    created_at   timestamptz not null default now()
);
create index if not exists idx_knowledge_chunks_user on public.knowledge_chunks(user_id);
create index if not exists idx_knowledge_chunks_item on public.knowledge_chunks(item_id);
-- approximate nearest-neighbour index (cosine)
create index if not exists idx_knowledge_chunks_embedding
    on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ------------------------------------------------------------
-- connectors
-- ------------------------------------------------------------
create table if not exists public.connectors (
    id                    uuid primary key default uuid_generate_v4(),
    user_id               uuid not null references public.users(id) on delete cascade,
    type                  text not null,            -- airtable | qonto | google_drive | outlook | google_sheets | excel_online | webhook | rest
    display_name          text,
    credentials_encrypted text,                     -- Fernet ciphertext
    status                text not null default 'disconnected', -- connected | error | syncing | disconnected
    last_sync_at          timestamptz,
    last_error            text,
    config                jsonb not null default '{}'::jsonb,
    created_at            timestamptz not null default now(),
    unique (user_id, type)
);
create index if not exists idx_connectors_user on public.connectors(user_id);

-- ------------------------------------------------------------
-- channels  (whatsapp / telegram)
-- ------------------------------------------------------------
create table if not exists public.channels (
    id          uuid primary key default uuid_generate_v4(),
    user_id     uuid not null references public.users(id) on delete cascade,
    type        text not null,             -- whatsapp | telegram
    config      jsonb not null default '{}'::jsonb,  -- encrypted secrets live here as needed
    is_active   boolean not null default false,
    external_id text,                      -- phone number (whatsapp) or bot token hash (telegram)
    created_at  timestamptz not null default now(),
    unique (user_id, type)
);
create index if not exists idx_channels_user on public.channels(user_id);
create index if not exists idx_channels_external on public.channels(type, external_id);

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
create table if not exists public.conversations (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references public.users(id) on delete cascade,
    channel         text not null default 'web',   -- web | whatsapp | telegram
    external_id     text,                          -- chat id / phone for messaging channels
    title           text,
    created_at      timestamptz not null default now(),
    last_message_at timestamptz not null default now()
);
create index if not exists idx_conversations_user on public.conversations(user_id);
create index if not exists idx_conversations_channel_ext on public.conversations(channel, external_id);

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
create table if not exists public.messages (
    id              uuid primary key default uuid_generate_v4(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id         uuid not null references public.users(id) on delete cascade,
    role            text not null,        -- user | assistant | tool
    content         text not null default '',
    tokens_in       integer not null default 0,
    tokens_out      integer not null default 0,
    model           text,
    sources_used    jsonb not null default '[]'::jsonb,
    created_at      timestamptz not null default now()
);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_user_created on public.messages(user_id, created_at desc);

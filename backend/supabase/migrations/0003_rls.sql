-- ============================================================
-- Odin — 0003_rls.sql
-- Row-Level Security. Every table is scoped to the owning user.
-- The backend uses the service-role key (which bypasses RLS) for
-- privileged work; these policies protect any client using the
-- anon key with a user JWT.
-- ============================================================

alter table public.users            enable row level security;
alter table public.company_profile  enable row level security;
alter table public.knowledge_items   enable row level security;
alter table public.knowledge_chunks  enable row level security;
alter table public.connectors        enable row level security;
alter table public.channels          enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;

-- helper: is the current JWT a superadmin?
create or replace function public.is_superadmin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
    select coalesce(
        (select is_superadmin from public.users where id = auth.uid()),
        false
    );
$$;

-- ---------------- users ----------------
drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users
    for select using (auth.uid() = id or public.is_superadmin());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
    for update using (auth.uid() = id);

-- ---------------- company_profile ----------------
drop policy if exists cp_owner_all on public.company_profile;
create policy cp_owner_all on public.company_profile
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- knowledge_items ----------------
drop policy if exists ki_owner_all on public.knowledge_items;
create policy ki_owner_all on public.knowledge_items
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- knowledge_chunks ----------------
drop policy if exists kc_owner_all on public.knowledge_chunks;
create policy kc_owner_all on public.knowledge_chunks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- connectors ----------------
drop policy if exists conn_owner_all on public.connectors;
create policy conn_owner_all on public.connectors
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- channels ----------------
drop policy if exists ch_owner_all on public.channels;
create policy ch_owner_all on public.channels
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- conversations ----------------
drop policy if exists conv_owner_all on public.conversations;
create policy conv_owner_all on public.conversations
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- messages ----------------
drop policy if exists msg_owner_all on public.messages;
create policy msg_owner_all on public.messages
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

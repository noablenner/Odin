-- ============================================================
-- Odin — 0002_functions.sql
-- Helper functions: new-user trigger + vector similarity search
-- ============================================================

-- Create a public.users row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;

    insert into public.company_profile (user_id, agent_name)
    values (new.id, 'Odin')
    on conflict (user_id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- match_chunks: cosine similarity search scoped to a user.
-- Returns the top-k most similar chunks above a threshold.
-- ------------------------------------------------------------
create or replace function public.match_chunks(
    p_user_id    uuid,
    query_embedding vector(1536),
    match_count  int default 6,
    similarity_threshold float default 0.0
)
returns table (
    id          uuid,
    item_id     uuid,
    content     text,
    chunk_index integer,
    metadata    jsonb,
    similarity  float
)
language sql
stable
as $$
    select
        c.id,
        c.item_id,
        c.content,
        c.chunk_index,
        c.metadata,
        1 - (c.embedding <=> query_embedding) as similarity
    from public.knowledge_chunks c
    where c.user_id = p_user_id
      and c.embedding is not null
      and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
    order by c.embedding <=> query_embedding
    limit match_count;
$$;

-- ------------------------------------------------------------
-- touch_company_profile: keep updated_at fresh.
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_company_profile_touch on public.company_profile;
create trigger trg_company_profile_touch
    before update on public.company_profile
    for each row execute function public.touch_updated_at();

-- ==========================================================
-- Migration: 20251107_add_subscription_and_token_tracking.sql
-- Purpose: Complete Supabase subscription + token usage setup
-- Author: Stephen Highlander / Speechwriter MicroFactory
-- ==========================================================

-- 1️⃣ Create user_subscriptions table if missing
create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free',
  tokens_allocated integer not null default 100,
  tokens_used integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2️⃣ Create token_usage table if missing
create table if not exists public.token_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tokens_consumed integer not null,
  operation_type text not null,
  created_at timestamp with time zone default now()
);

-- 3️⃣ Enable Row-Level Security (RLS) where not already enabled
do $$
begin
  if not exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'user_subscriptions'
  ) then
    raise notice 'user_subscriptions table does not exist yet, skipping RLS enable.';
  else
    execute 'alter table public.user_subscriptions enable row level security';
  end if;

  if not exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'token_usage'
  ) then
    raise notice 'token_usage table does not exist yet, skipping RLS enable.';
  else
    execute 'alter table public.token_usage enable row level security';
  end if;
end$$;

-- 4️⃣ Add policies idempotently
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'User can see own subscription'
  ) then
    create policy "User can see own subscription"
      on public.user_subscriptions
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'User can update own subscription'
  ) then
    create policy "User can update own subscription"
      on public.user_subscriptions
      for update using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'User can see own usage'
  ) then
    create policy "User can see own usage"
      on public.token_usage
      for select using (auth.uid() = user_id);
  end if;
end$$;

-- 5️⃣ Create or replace consume_tokens() RPC
create or replace function public.consume_tokens(
  _user_id uuid,
  _tokens integer,
  _operation text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_tokens integer;
begin
  if _user_id != auth.uid() then
    raise exception 'Unauthorized: cannot consume tokens for other users';
  end if;

  select (tokens_allocated - tokens_used)
    into remaining_tokens
    from public.user_subscriptions
   where user_id = _user_id;

  if remaining_tokens is null or remaining_tokens < _tokens then
    return false;
  end if;

  update public.user_subscriptions
     set tokens_used = tokens_used + _tokens,
         updated_at = now()
   where user_id = _user_id;

  insert into public.token_usage(user_id, tokens_consumed, operation_type)
  values (_user_id, _tokens, _operation);

  return true;
end;
$$;

-- 6️⃣ Create or replace handle_new_user_subscription() function
create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_subscriptions (user_id, tier, tokens_allocated, tokens_used)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'subscription_plan')::text, 'free'),
    100,
    0
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- 7️⃣ Safely drop and recreate trigger on_auth_user_created
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_subscription();

-- 8️⃣ Backfill existing users if missing subscription rows
insert into public.user_subscriptions (user_id, tier, tokens_allocated, tokens_used)
select 
  id,
  coalesce((raw_user_meta_data->>'subscription_plan')::text, 'free'),
  100,
  0
from auth.users
where id not in (select user_id from public.user_subscriptions);

-- 9️⃣ Final verification notices
do $$
begin
  raise notice '✅ Migration complete: user_subscriptions + token_usage setup verified.';
end$$;
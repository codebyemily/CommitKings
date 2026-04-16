-- Public profiles (for display names / avatars in messaging and search)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null default '',
  display_name text not null default 'Member',
  avatar_path text,
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Profiles read authenticated" on public.profiles;
create policy "Profiles read authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own"
on public.profiles for update
to authenticated
using (auth.uid() = id);

insert into public.profiles (id, username, display_name, avatar_path)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'username'), ''), 'user_' || substr(replace(u.id::text, '-', ''), 1, 12)),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    split_part(u.email, '@', 1),
    'Member'
  ),
  nullif(trim(u.raw_user_meta_data->>'avatar_path'), '')
from auth.users u
on conflict (id) do nothing;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'user_' || substr(replace(new.id::text, '-', ''), 1, 12)),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(new.email, '@', 1),
      'Member'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- One-to-one direct conversations (ordered pair for uniqueness)
create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users (id) on delete cascade,
  user_high uuid not null references auth.users (id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  check (user_low < user_high),
  unique (user_low, user_high)
);

create index if not exists direct_conversations_user_low_idx on public.direct_conversations (user_low);
create index if not exists direct_conversations_user_high_idx on public.direct_conversations (user_high);
create index if not exists direct_conversations_last_msg_idx on public.direct_conversations (last_message_at desc nulls last);

alter table public.direct_conversations enable row level security;

drop policy if exists "Direct conv participants read" on public.direct_conversations;
create policy "Direct conv participants read"
on public.direct_conversations for select
to authenticated
using (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "Direct conv participants insert" on public.direct_conversations;
create policy "Direct conv participants insert"
on public.direct_conversations for insert
to authenticated
with check (auth.uid() = user_low or auth.uid() = user_high);

-- Messages
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(body) between 1 and 4000)
);

create index if not exists direct_messages_conv_created_idx on public.direct_messages (conversation_id, created_at);

alter table public.direct_messages enable row level security;

drop policy if exists "Direct messages read by participants" on public.direct_messages;
create policy "Direct messages read by participants"
on public.direct_messages for select
to authenticated
using (
  exists (
    select 1
    from public.direct_conversations c
    where c.id = direct_messages.conversation_id
      and (auth.uid() = c.user_low or auth.uid() = c.user_high)
  )
);

drop policy if exists "Direct messages insert by sender in conv" on public.direct_messages;
create policy "Direct messages insert by sender in conv"
on public.direct_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.direct_conversations c
    where c.id = direct_messages.conversation_id
      and (auth.uid() = c.user_low or auth.uid() = c.user_high)
  )
);

create or replace function public.direct_messages_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.direct_conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 120)
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_direct_message_insert on public.direct_messages;
create trigger on_direct_message_insert
  after insert on public.direct_messages
  for each row execute function public.direct_messages_touch_conversation();

-- Realtime: postgres_changes on new rows (RLS applies to subscribers)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;

-- Case-insensitive username lookup (avoids ILIKE metacharacters in usernames)
create or replace function public.find_profile_id_by_username(q text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where lower(trim(q)) = lower(trim(username))
  limit 1
$$;

grant execute on function public.find_profile_id_by_username(text) to authenticated;

-- Who follows whom (viewer follows profile owner)
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_follower_id_idx on public.follows (follower_id);

alter table public.follows enable row level security;

drop policy if exists "Follows read authenticated" on public.follows;
create policy "Follows read authenticated"
on public.follows for select
to authenticated
using (true);

drop policy if exists "Follows insert self as follower" on public.follows;
create policy "Follows insert self as follower"
on public.follows for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "Follows delete self as follower" on public.follows;
create policy "Follows delete self as follower"
on public.follows for delete
to authenticated
using (auth.uid() = follower_id);

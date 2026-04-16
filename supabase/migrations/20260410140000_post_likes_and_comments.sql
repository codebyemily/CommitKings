-- Per-user likes (counts maintained on posts.likes_count via trigger)
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_id_idx on public.post_likes (user_id);

alter table public.post_likes enable row level security;

drop policy if exists "Post likes readable by authenticated" on public.post_likes;
create policy "Post likes readable by authenticated"
on public.post_likes for select
to authenticated
using (true);

drop policy if exists "Users insert own post like" on public.post_likes;
create policy "Users insert own post like"
on public.post_likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own post like" on public.post_likes;
create policy "Users delete own post like"
on public.post_likes for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.post_likes_sync_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set likes_count = likes_count + 1
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
    set likes_count = greatest(0, likes_count - 1)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_post_likes_ins on public.post_likes;
create trigger tr_post_likes_ins
  after insert on public.post_likes
  for each row execute function public.post_likes_sync_count();

drop trigger if exists tr_post_likes_del on public.post_likes;
create trigger tr_post_likes_del
  after delete on public.post_likes
  for each row execute function public.post_likes_sync_count();

-- Comments (denormalized author names for simple feed reads)
alter table public.posts add column if not exists comments_count integer not null default 0;

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_username text not null,
  author_display_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(trim(body)) between 1 and 2000)
);

create index if not exists post_comments_post_created_idx on public.post_comments (post_id, created_at);

alter table public.post_comments enable row level security;

drop policy if exists "Post comments readable by authenticated" on public.post_comments;
create policy "Post comments readable by authenticated"
on public.post_comments for select
to authenticated
using (true);

drop policy if exists "Users insert own post comments" on public.post_comments;
create policy "Users insert own post comments"
on public.post_comments for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own post comments" on public.post_comments;
create policy "Users delete own post comments"
on public.post_comments for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.post_comments_sync_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set comments_count = comments_count + 1
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
    set comments_count = greatest(0, comments_count - 1)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_post_comments_ins on public.post_comments;
create trigger tr_post_comments_ins
  after insert on public.post_comments
  for each row execute function public.post_comments_sync_count();

drop trigger if exists tr_post_comments_del on public.post_comments;
create trigger tr_post_comments_del
  after delete on public.post_comments
  for each row execute function public.post_comments_sync_count();

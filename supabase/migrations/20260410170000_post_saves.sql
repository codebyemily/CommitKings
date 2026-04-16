create table if not exists public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_saves_user_id_idx on public.post_saves (user_id);

alter table public.post_saves enable row level security;

drop policy if exists "Post saves readable by authenticated" on public.post_saves;
create policy "Post saves readable by authenticated"
on public.post_saves for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own post save" on public.post_saves;
create policy "Users insert own post save"
on public.post_saves for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own post save" on public.post_saves;
create policy "Users delete own post save"
on public.post_saves for delete
to authenticated
using (auth.uid() = user_id);

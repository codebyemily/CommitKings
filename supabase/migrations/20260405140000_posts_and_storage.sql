-- Storage bucket for post images (public read; authenticated write to own folder)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Post images public read" on storage.objects;
create policy "Post images public read"
on storage.objects for select
using (bucket_id = 'post-images');

drop policy if exists "Users upload own post-images folder" on storage.objects;
create policy "Users upload own post-images folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own post-images" on storage.objects;
create policy "Users update own post-images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own post-images" on storage.objects;
create policy "Users delete own post-images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Feed posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  caption text not null default '',
  author_username text not null,
  author_display_name text not null,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

drop policy if exists "Authenticated users read posts" on public.posts;
create policy "Authenticated users read posts"
on public.posts for select
to authenticated
using (true);

drop policy if exists "Users insert own posts" on public.posts;
create policy "Users insert own posts"
on public.posts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts"
on public.posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users update own posts" on public.posts;
create policy "Users update own posts"
on public.posts for update
to authenticated
using (auth.uid() = user_id);

alter table public.profiles
  add column if not exists bio text not null default '';

update public.profiles p
set bio = coalesce(nullif(trim(u.raw_user_meta_data->>'bio'), ''), '')
from auth.users u
where u.id = p.id
  and coalesce(p.bio, '') = '';

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, bio)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'user_' || substr(replace(new.id::text, '-', ''), 1, 12)),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(new.email, '@', 1),
      'Member'
    ),
    coalesce(nullif(trim(new.raw_user_meta_data->>'bio'), ''), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

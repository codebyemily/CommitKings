-- Substring search on username / display_name (no ILIKE metacharacters from user input)
create or replace function public.search_profiles(p_query text, p_limit int default 20)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_path text
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select trim(p_query) as t
  )
  select p.id, p.username, p.display_name, p.avatar_path
  from public.profiles p, q
  where length(q.t) >= 2
    and (
      position(lower(q.t) in lower(p.username)) > 0
      or position(lower(q.t) in lower(p.display_name)) > 0
    )
  order by
    (lower(p.username) = lower(q.t)) desc,
    (lower(p.username) like lower(q.t) || '%') desc,
    p.username asc
  limit least(greatest(coalesce(p_limit, 20), 1), 30);
$$;

grant execute on function public.search_profiles(text, int) to authenticated;

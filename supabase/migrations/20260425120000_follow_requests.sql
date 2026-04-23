-- Pending follow: requester asks target; target accepts before a row exists in public.follows
create table if not exists public.follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  target_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (requester_id <> target_id),
  unique (requester_id, target_id)
);

create index if not exists follow_requests_target_id_idx on public.follow_requests (target_id);
create index if not exists follow_requests_requester_id_idx on public.follow_requests (requester_id);

alter table public.follow_requests enable row level security;

drop policy if exists "Follow requests read participants" on public.follow_requests;
create policy "Follow requests read participants"
on public.follow_requests for select
to authenticated
using (requester_id = auth.uid() or target_id = auth.uid());

drop policy if exists "Follow requests insert as requester" on public.follow_requests;
create policy "Follow requests insert as requester"
on public.follow_requests for insert
to authenticated
with check (requester_id = auth.uid());

drop policy if exists "Follow requests delete as participant" on public.follow_requests;
create policy "Follow requests delete as participant"
on public.follow_requests for delete
to authenticated
using (requester_id = auth.uid() or target_id = auth.uid());

-- Target accepts: remove request and create follow row (requester follows target).
-- RLS on follows only allows requester to insert their own row; target cannot insert for them without this.
create or replace function public.accept_follow_request(p_requester_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.follow_requests
  where requester_id = p_requester_id
    and target_id = auth.uid();
  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    raise exception 'No pending follow request';
  end if;

  insert into public.follows (follower_id, following_id)
  values (p_requester_id, auth.uid())
  on conflict (follower_id, following_id) do nothing;
end;
$$;

grant execute on function public.accept_follow_request(uuid) to authenticated;

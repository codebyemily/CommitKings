-- Accepting a friend request makes both users follow each other (mutual friendship).
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

  insert into public.follows (follower_id, following_id)
  values (auth.uid(), p_requester_id)
  on conflict (follower_id, following_id) do nothing;
end;
$$;

-- Remove all follow edges between the current user and another (end friendship / one-way follow).
create or replace function public.unfriend_user(p_other_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_other_id is null or p_other_id = auth.uid() then
    raise exception 'Invalid user';
  end if;

  delete from public.follows
  where (follower_id = auth.uid() and following_id = p_other_id)
     or (follower_id = p_other_id and following_id = auth.uid());
end;
$$;

grant execute on function public.unfriend_user(uuid) to authenticated;

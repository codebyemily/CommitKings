'use server'

import { createClient } from '@/lib/supabase/server'
import {
  isMissingFollowRequestsTable,
  isMissingFollowsTable,
} from '@/lib/posts/schema-fallback'
import { revalidatePath } from 'next/cache'

export type FollowActionResult =
  | { ok: true; friends: boolean; outgoingRequest: boolean }
  | { ok: false; error: string }

export type FollowRequestActionResult = { ok: true } | { ok: false; error: string }

function revalidateAfterFollowChange(usernameForPath: string) {
  const raw = usernameForPath.trim().replace(/^@+/, '')
  if (raw) {
    revalidatePath(`/u/${raw}`)
  }
  revalidatePath('/following')
  revalidatePath('/home')
  revalidatePath('/profile')
  revalidatePath('/follow-requests')
}

async function revalidatePublicProfileByUserId(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()
  const u =
    typeof data?.username === 'string' && data.username.trim()
      ? data.username.trim()
      : ''
  if (u) {
    revalidatePath(`/u/${u}`)
  }
}

async function callUnfriendRpc(
  supabase: Awaited<ReturnType<typeof createClient>>,
  otherUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc('unfriend_user', {
    p_other_id: otherUserId,
  })
  if (error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes('unfriend_user') ||
      (msg.includes('function') && msg.includes('does not exist'))
    ) {
      return {
        ok: false,
        error:
          'Run `supabase/migrations/20260426120000_friendship_mutual_on_accept.sql` on Supabase (adds mutual friendship on accept + unfriend), then refresh.',
      }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function toggleFollowAction(input: {
  followingId: string
  usernameForPath: string
}): Promise<FollowActionResult> {
  const target = input.followingId.trim()
  if (!target) {
    return { ok: false, error: 'Invalid user.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Sign in to add friends.' }
  }

  if (user.id === target) {
    return { ok: false, error: 'You cannot add yourself as a friend.' }
  }

  const { data: existingFollow, error: followFindErr } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', target)
    .maybeSingle()

  if (followFindErr) {
    if (isMissingFollowsTable(followFindErr.message)) {
      return {
        ok: false,
        error:
          'Missing the follows table. In Supabase → SQL Editor, run `supabase/migrations/20260424120000_follows.sql`, then `20260425120000_follow_requests.sql`, then refresh this page.',
      }
    }
    return { ok: false, error: followFindErr.message }
  }

  if (existingFollow) {
    const r = await callUnfriendRpc(supabase, target)
    if (!r.ok) {
      return { ok: false, error: r.error }
    }

    revalidateAfterFollowChange(input.usernameForPath)
    return { ok: true, friends: false, outgoingRequest: false }
  }

  const { data: pending, error: reqFindErr } = await supabase
    .from('follow_requests')
    .select('id')
    .eq('requester_id', user.id)
    .eq('target_id', target)
    .maybeSingle()

  if (reqFindErr && !isMissingFollowRequestsTable(reqFindErr.message)) {
    return { ok: false, error: reqFindErr.message }
  }

  if (pending) {
    const { error: delErr } = await supabase
      .from('follow_requests')
      .delete()
      .eq('requester_id', user.id)
      .eq('target_id', target)

    if (delErr) {
      if (!isMissingFollowRequestsTable(delErr.message)) {
        return { ok: false, error: delErr.message }
      }
    }

    revalidateAfterFollowChange(input.usernameForPath)
    return { ok: true, friends: false, outgoingRequest: false }
  }

  const { error: insertErr } = await supabase.from('follow_requests').insert({
    requester_id: user.id,
    target_id: target,
  })

  if (insertErr) {
    if (isMissingFollowRequestsTable(insertErr.message)) {
      return {
        ok: false,
        error:
          'Missing the follow_requests table. Run `supabase/migrations/20260425120000_follow_requests.sql` in Supabase SQL Editor (after follows.sql), then refresh.',
      }
    }
    if (insertErr.code === '23505') {
      revalidateAfterFollowChange(input.usernameForPath)
      return { ok: true, friends: false, outgoingRequest: true }
    }
    return { ok: false, error: insertErr.message }
  }

  revalidateAfterFollowChange(input.usernameForPath)
  return { ok: true, friends: false, outgoingRequest: true }
}

export async function acceptFollowRequestAction(
  requesterId: string,
): Promise<FollowRequestActionResult> {
  const rid = requesterId.trim()
  if (!rid) {
    return { ok: false, error: 'Invalid user.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const { error } = await supabase.rpc('accept_follow_request', {
    p_requester_id: rid,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes('accept_follow_request') ||
      msg.includes('function') ||
      msg.includes('does not exist')
    ) {
      return {
        ok: false,
        error:
          'Apply follow request migrations on Supabase, including `20260426120000_friendship_mutual_on_accept.sql`, then refresh.',
      }
    }
    return { ok: false, error: error.message }
  }

  await revalidatePublicProfileByUserId(rid)
  await revalidatePublicProfileByUserId(user.id)
  revalidatePath('/follow-requests')
  revalidatePath('/following')
  revalidatePath('/home')
  revalidatePath('/profile')

  return { ok: true }
}

export async function declineFollowRequestAction(
  requesterId: string,
): Promise<FollowRequestActionResult> {
  const rid = requesterId.trim()
  if (!rid) {
    return { ok: false, error: 'Invalid user.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const { error } = await supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', rid)
    .eq('target_id', user.id)

  if (error) {
    if (isMissingFollowRequestsTable(error.message)) {
      return {
        ok: false,
        error:
          'Missing the follow_requests table. Run `supabase/migrations/20260425120000_follow_requests.sql` in Supabase SQL Editor (after follows.sql), then refresh.',
      }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/follow-requests')
  await revalidatePublicProfileByUserId(rid)

  return { ok: true }
}

/** End friendship (removes both follow edges, or a one-way edge if present). */
export async function unfriendUserAction(input: {
  otherUserId: string
  usernameForPath: string
}): Promise<FollowRequestActionResult> {
  const target = input.otherUserId.trim()
  if (!target) {
    return { ok: false, error: 'Invalid user.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  if (user.id === target) {
    return { ok: false, error: 'Invalid user.' }
  }

  const r = await callUnfriendRpc(supabase, target)
  if (!r.ok) {
    return r
  }

  revalidateAfterFollowChange(input.usernameForPath)
  await revalidatePublicProfileByUserId(user.id)

  return { ok: true }
}

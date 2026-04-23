import { createClient } from '@/lib/supabase/server'
import {
  isMissingFollowRequestsTable,
  isMissingFollowsTable,
} from '@/lib/posts/schema-fallback'

/** Mutual friendship: both users follow each other in `follows`. */
export type FriendListItem = {
  id: string
  username: string
  displayName: string
  avatarPath: string | null
}

export type IncomingFollowRequestItem = {
  requesterId: string
  username: string
  displayName: string
  avatarPath: string | null
  createdAt: string
}

/** Count of mutual friendships (both follow each other). */
export async function getMutualFriendsCount(profileUserId: string): Promise<number> {
  if (!profileUserId.trim()) {
    return 0
  }

  const supabase = await createClient()

  const { data: outgoing, error: outErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', profileUserId)

  if (outErr) {
    if (!isMissingFollowsTable(outErr.message)) {
      console.error('getMutualFriendsCount outgoing:', outErr.message)
    }
    return 0
  }

  const { data: incoming, error: inErr } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', profileUserId)

  if (inErr) {
    if (!isMissingFollowsTable(inErr.message)) {
      console.error('getMutualFriendsCount incoming:', inErr.message)
    }
    return 0
  }

  const followingSet = new Set(
    (outgoing ?? [])
      .map((r) => r.following_id as string | undefined)
      .filter((id): id is string => Boolean(id)),
  )

  let n = 0
  for (const row of incoming ?? []) {
    const id = row.follower_id as string | undefined
    if (id && followingSet.has(id)) {
      n += 1
    }
  }
  return n
}

export async function viewerOutgoingFollowRequest(
  requesterId: string,
  targetId: string,
): Promise<boolean> {
  if (!requesterId || !targetId || requesterId === targetId) {
    return false
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('follow_requests')
    .select('id')
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .maybeSingle()

  if (error) {
    if (!isMissingFollowRequestsTable(error.message)) {
      console.error('viewerOutgoingFollowRequest:', error.message)
    }
    return false
  }

  return Boolean(data)
}

export async function getIncomingFollowRequests(
  targetUserId: string,
): Promise<IncomingFollowRequestItem[]> {
  if (!targetUserId.trim()) {
    return []
  }

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('follow_requests')
    .select('requester_id, created_at')
    .eq('target_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if (!isMissingFollowRequestsTable(error.message)) {
      console.error('getIncomingFollowRequests:', error.message)
    }
    return []
  }

  if (!rows?.length) {
    return []
  }

  const ids = rows
    .map((r) => r.requester_id as string | undefined)
    .filter((id): id is string => Boolean(id))

  if (!ids.length) {
    return []
  }

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path')
    .in('id', ids)

  if (profErr || !profiles) {
    if (profErr) console.error('getIncomingFollowRequests profiles:', profErr.message)
    return []
  }

  const byId = new Map(
    profiles.map((p) => [
      p.id as string,
      {
        username: (p.username && String(p.username).trim()) || 'user',
        displayName:
          (p.display_name && String(p.display_name).trim()) || 'Member',
        avatarPath:
          typeof p.avatar_path === 'string' && p.avatar_path.trim()
            ? p.avatar_path.trim()
            : null,
      },
    ]),
  )

  return (rows as { requester_id: string; created_at: string }[])
    .map((row) => {
      const p = byId.get(row.requester_id)
      if (!p) return null
      return {
        requesterId: row.requester_id,
        username: p.username,
        displayName: p.displayName,
        avatarPath: p.avatarPath,
        createdAt:
          typeof row.created_at === 'string'
            ? row.created_at
            : new Date().toISOString(),
      }
    })
    .filter((x): x is IncomingFollowRequestItem => x !== null)
}

export async function viewerFollowsUser(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) {
    return false
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (error) {
    if (isMissingFollowsTable(error.message)) {
      return false
    }
    console.error('viewerFollowsUser:', error.message)
    return false
  }

  return Boolean(data)
}

export async function viewerFriendsWithUser(
  viewerId: string,
  otherUserId: string,
): Promise<boolean> {
  const [ab, ba] = await Promise.all([
    viewerFollowsUser(viewerId, otherUserId),
    viewerFollowsUser(otherUserId, viewerId),
  ])
  return ab && ba
}

/** People you are mutual friends with (both follow each other). */
export async function getFriendsList(userId: string): Promise<FriendListItem[]> {
  const supabase = await createClient()

  const { data: outRows, error: outErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (outErr) {
    if (!isMissingFollowsTable(outErr.message)) {
      console.error('getFriendsList:', outErr.message)
    }
    return []
  }

  const { data: inRows, error: inErr } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)

  if (inErr) {
    if (!isMissingFollowsTable(inErr.message)) {
      console.error('getFriendsList incoming:', inErr.message)
    }
    return []
  }

  const followerSet = new Set(
    (inRows ?? [])
      .map((r) => r.follower_id as string | undefined)
      .filter((id): id is string => Boolean(id)),
  )

  const friendIdsOrdered = (outRows ?? [])
    .map((r) => r.following_id as string | undefined)
    .filter(
      (id): id is string =>
        typeof id === 'string' && id.length > 0 && followerSet.has(id),
    )

  if (!friendIdsOrdered.length) {
    return []
  }

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path')
    .in('id', friendIdsOrdered)

  if (profErr || !profiles) {
    if (profErr) console.error('getFriendsList profiles:', profErr.message)
    return []
  }

  const byId = new Map(
    profiles.map((p) => [
      p.id as string,
      {
        username: (p.username && String(p.username).trim()) || 'user',
        displayName:
          (p.display_name && String(p.display_name).trim()) || 'Member',
        avatarPath:
          typeof p.avatar_path === 'string' && p.avatar_path.trim()
            ? p.avatar_path.trim()
            : null,
      },
    ]),
  )

  return friendIdsOrdered
    .map((id) => {
      const p = byId.get(id)
      if (!p) return null
      return {
        id,
        username: p.username,
        displayName: p.displayName,
        avatarPath: p.avatarPath,
      }
    })
    .filter((x): x is FriendListItem => x !== null)
}

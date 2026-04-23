import { createClient } from '@/lib/supabase/server'
import { isMissingFollowsTable } from '@/lib/posts/schema-fallback'

export type FollowingListItem = {
  id: string
  username: string
  displayName: string
  avatarPath: string | null
}

/** Users who follow this profile and are followed back (mutual follows). */
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

export async function getFollowingList(
  followerId: string,
): Promise<FollowingListItem[]> {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', followerId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    if (!isMissingFollowsTable(error.message)) {
      console.error('getFollowingList:', error.message)
    }
    return []
  }

  if (!rows?.length) {
    return []
  }

  const ids = rows
    .map((r) => r.following_id as string | undefined)
    .filter((id): id is string => Boolean(id))

  if (!ids.length) {
    return []
  }

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path')
    .in('id', ids)

  if (profErr || !profiles) {
    if (profErr) console.error('getFollowingList profiles:', profErr.message)
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

  return ids
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
    .filter((x): x is FollowingListItem => x !== null)
}

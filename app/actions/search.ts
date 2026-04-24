'use server'

import { createClient } from '@/lib/supabase/server'

export type ProfileSearchHit = {
  id: string
  username: string
  displayName: string
  avatarPath: string | null
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_path: string | null
}

function mapProfileRow(row: ProfileRow): ProfileSearchHit {
  return {
    id: row.id,
    username: (row.username && String(row.username).trim()) || 'user',
    displayName:
      (row.display_name && String(row.display_name).trim()) || 'Member',
    avatarPath:
      typeof row.avatar_path === 'string' && row.avatar_path.trim()
        ? row.avatar_path.trim()
        : null,
  }
}

/** Strip characters that act as wildcards in ILIKE when no ESCAPE is set. */
function ilikeSubstringPattern(raw: string): string | null {
  const safe = raw.replace(/%/g, '').replace(/_/g, '').trim()
  if (safe.length < 2) {
    return null
  }
  return `%${safe}%`
}

function sortSearchHits(hits: ProfileSearchHit[], q: string): ProfileSearchHit[] {
  const t = q.trim().replace(/^@+/, '').toLowerCase()
  const rank = (h: ProfileSearchHit) => {
    const u = h.username.toLowerCase()
    if (u === t) return 0
    if (u.startsWith(t)) return 1
    return 2
  }
  return [...hits].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return a.username.localeCompare(b.username)
  })
}

async function searchProfilesDirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  q: string,
  limit: number,
): Promise<ProfileSearchHit[]> {
  const pattern = ilikeSubstringPattern(q)
  if (!pattern) {
    return []
  }

  const [byUser, byName] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_path')
      .ilike('username', pattern)
      .limit(limit),
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_path')
      .ilike('display_name', pattern)
      .limit(limit),
  ])

  if (byUser.error) {
    console.error('searchProfilesDirect username:', byUser.error.message)
  }
  if (byName.error) {
    console.error('searchProfilesDirect display_name:', byName.error.message)
  }

  const map = new Map<string, ProfileRow>()
  for (const row of [...(byUser.data ?? []), ...(byName.data ?? [])] as ProfileRow[]) {
    map.set(row.id, row)
  }

  return sortSearchHits(
    Array.from(map.values()).map(mapProfileRow),
    q,
  ).slice(0, limit)
}

export async function searchProfilesAction(
  query: string,
): Promise<ProfileSearchHit[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const q = query.trim().replace(/^@+/, '')
  if (q.length < 2) {
    return []
  }

  const limit = 20

  const { data, error } = await supabase.rpc('search_profiles', {
    p_query: q,
    p_limit: limit,
  })

  if (error) {
    console.warn('search_profiles RPC unavailable, using direct query:', error.message)
    return searchProfilesDirect(supabase, q, limit)
  }

  const rows = Array.isArray(data) ? (data as ProfileRow[]) : []
  const hits = rows.map(mapProfileRow)
  return sortSearchHits(hits, q).slice(0, limit)
}

import { createClient } from '@/lib/supabase/server'

export type PublicProfile = {
  id: string
  username: string
  displayName: string
  avatarPath: string | null
  bio: string
}

export async function getPublicProfileByUsername(
  raw: string,
): Promise<PublicProfile | null> {
  const q = raw.trim().replace(/^@+/, '')
  if (!q) {
    return null
  }

  const supabase = await createClient()
  const { data: profileId, error: rpcError } = await supabase.rpc(
    'find_profile_id_by_username',
    { q },
  )

  if (rpcError) {
    console.error('getPublicProfileByUsername rpc:', rpcError.message)
    return null
  }

  if (typeof profileId !== 'string' || !profileId) {
    return null
  }

  const { data: row, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_path, bio')
    .eq('id', profileId)
    .maybeSingle()

  if (error || !row) {
    if (error) console.error('getPublicProfileByUsername:', error.message)
    return null
  }

  const username =
    (typeof row.username === 'string' && row.username.trim()) || 'user'
  const displayName =
    (typeof row.display_name === 'string' && row.display_name.trim()) ||
    username
  const bio = typeof row.bio === 'string' ? row.bio : ''
  const avatarPath =
    typeof row.avatar_path === 'string' && row.avatar_path.trim()
      ? row.avatar_path.trim()
      : null

  return {
    id: row.id as string,
    username,
    displayName,
    avatarPath,
    bio,
  }
}

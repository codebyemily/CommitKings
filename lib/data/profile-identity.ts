import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Canonical display identity for posts/comments: prefer `profiles`, then auth metadata.
 */
export async function getAuthorIdentityFromProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<{
  username: string
  displayName: string
  avatarPath: string | null
}> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_path')
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata as Record<string, unknown>
  const username =
    (typeof profile?.username === 'string' && profile.username.trim()) ||
    (typeof meta?.username === 'string' && meta.username.trim()) ||
    user.email?.split('@')[0] ||
    'user'
  const displayName =
    (typeof profile?.display_name === 'string' && profile.display_name.trim()) ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    username
  const avatarPathRaw =
    (typeof profile?.avatar_path === 'string' && profile.avatar_path.trim()) ||
    (typeof meta?.avatar_path === 'string' && meta.avatar_path.trim()) ||
    ''

  return {
    username,
    displayName,
    avatarPath: avatarPathRaw || null,
  }
}

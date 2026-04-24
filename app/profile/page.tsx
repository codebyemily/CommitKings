import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import { redirect } from 'next/navigation'
import { ProfileScreen } from '@/components/profile/ProfileScreen'
import { getMutualFriendsCount } from '@/lib/data/follows'

export const metadata: Metadata = {
  title: 'Profile',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_path, bio')
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata as Record<string, unknown>
  const displayName =
    (typeof profile?.display_name === 'string' && profile.display_name.trim()) ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.username === 'string' && meta.username.trim()) ||
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    user.email?.split('@')[0] ||
    'Member'

  const handle =
    (typeof profile?.username === 'string' && profile.username.trim().replace(/^@/, '')) ||
    (typeof meta?.username === 'string' && meta.username.trim().replace(/^@/, '')) ||
    user.email?.split('@')[0] ||
    'user'

  const bio =
    (typeof profile?.bio === 'string' && profile.bio) ||
    (typeof meta?.bio === 'string' ? meta.bio : '')

  const avatarPathRaw =
    (typeof profile?.avatar_path === 'string' && profile.avatar_path.trim()) ||
    (typeof meta?.avatar_path === 'string' ? meta.avatar_path.trim() : '')
  const avatarUrl = avatarPathRaw
    ? getPostImagePublicUrl(avatarPathRaw) || null
    : null

  const friendsCount = await getMutualFriendsCount(user.id)

  return (
    <ProfileScreen
      email={user.email ?? ''}
      displayName={displayName}
      handle={handle}
      bio={bio}
      avatarUrl={avatarUrl}
      friendsCount={friendsCount}
    />
  )
}
